const {
  getEventById,
  findOpenDuplicateQuestion,
  createQuestionWithOptions,
  attachMessageMeta,
  getOptionIdByIndex,
  closeQuestionWithAnswer,
} = require("../data/question.repo.js");

const {
  ensureGuildAndUser,
  upsertEventScore,
  getSeasonIdByEventId,
} = require("../data/event.repo.js");

const { upsertSeasonScore } = require("../data/season.repo.js");
const { upsertGuildUserPoints } = require("../data/guildUser.repo.js");
const { updateAccuracy } = require("../data/prediction.repo.js");

function sanitizeOptions(raw) {
  if (!raw) return ["Yes", "No"];
  const arr = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const uniq = Array.from(new Set(arr));
  const cut = uniq.map((s) => s.slice(0, 55));
  if (cut.length < 2) return ["Yes", "No"];
  return cut.slice(0, 10);
}

function normalizeAddQuestionInput({ eventId, text, points, options, hours }) {
  const eid = Number(eventId);
  if (!Number.isInteger(eid) || eid <= 0)
    throw new Error("eventId debe ser un entero positivo.");
  if (!text || !text.trim()) throw new Error("text es requerido.");
  const pts = points != null ? Number(points) : 1;
  if (!Number.isFinite(pts) || pts < 0)
    throw new Error("points debe ser un número ≥ 0.");
  const opts = sanitizeOptions(options);
  let hrs = hours != null ? Number(hours) : 24;
  if (!Number.isFinite(hrs) || hrs < 1) hrs = 24;
  if (hrs > 768) hrs = 768;
  return {
    eventId: eid,
    text: text.trim(),
    points: pts,
    options: opts,
    pollDurationHours: hrs,
  };
}

async function createQuestionForEvent({
  prisma,
  guildIdStr,
  guildName = "Unknown",
  discordUserId,
  username,
  eventId,
  text,
  points = 1,
  options,
  pollDurationHours,
}) {
  if (!prisma) throw new Error("Prisma no inicializado");

  return prisma.$transaction(async (tx) => {
    await ensureGuildAndUser(tx, {
      guildIdStr,
      guildName,
      discordUserId,
      username,
    });

    const event = await getEventById(tx, eventId);
    if (!event) throw new Error(`Event con id ${eventId} no existe.`);

    const dup = await findOpenDuplicateQuestion(tx, { eventId, text });
    if (dup)
      throw new Error(
        `Ya existe una pregunta abierta igual para este evento (Question ID ${dup.id}).`
      );

    const question = await createQuestionWithOptions(tx, {
      eventId,
      text,
      points,
      options,
      pollDurationHours,
    });

    return { question, event };
  });
}

async function attachQuestionMessage({
  prisma,
  questionId,
  messageId,
  channelId,
}) {
  if (!prisma) throw new Error("Prisma no inicializado");
  return prisma.$transaction(async (tx) => {
    return attachMessageMeta(tx, { questionId, messageId, channelId });
  });
}

async function closeAndScoreQuestion({ prisma, questionId, pollAnswers, correctIndex }) {
  return prisma.$transaction(async (tx) => {
    const q = await tx.question.findUnique({
      where: { id: questionId },
      select: { id: true, eventId: true, points: true, answer: true },
    });
    if (!q) throw new Error("Question no existe");

    if (q.answer) {
      return { alreadyClosed: true, winners: 0, questionId: q.id, delta: 0, ansLabel: q.answer };
    }

    const n = pollAnswers?.length || 0;
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= n) {
      throw new Error(`Índice fuera de rango. Opciones: 0..${n - 1}`);
    }

    const lbl = (pollAnswers[correctIndex]?.text || '').trim();
    let opt = await tx.questionOption.findFirst({
      where: { questionId: q.id, label: { equals: lbl, mode: "insensitive" } },
      select: { id: true, label: true, index: true },
    });
    if (!opt?.id) {
      const idByIndex = await getOptionIdByIndex(tx, { questionId: q.id, index: correctIndex });
      if (idByIndex) opt = { id: idByIndex, label: lbl, index: correctIndex };
    }
    if (!opt?.id) throw new Error("Opción inexistente para ese index/label.");

    const seasonId = await getSeasonIdByEventId(tx, q.eventId);
    const delta = Math.max(1, Number(q.points) || 1);

    const { winners } = await updateAccuracy(tx, {
      questionId: q.id,
      winnerOptionId: opt.id,
    });

    for (const w of winners) {
      await upsertEventScore(tx, { userId: w.userId, guildId: w.guildId, eventId: q.eventId, delta });
      if (seasonId) {
        await upsertSeasonScore(tx, { userId: w.userId, guildId: w.guildId, seasonId, delta });
      }
      await upsertGuildUserPoints(tx, { userId: w.userId, guildId: w.guildId, delta });
    }

    const ansLabel = opt.label ?? lbl ?? String(correctIndex + 1);
    await closeQuestionWithAnswer(tx, { questionId: q.id, answer: ansLabel });

    return { alreadyClosed: false, winners: winners.length, questionId: q.id, delta, ansLabel };
  });
}


module.exports = {
  normalizeAddQuestionInput,
  createQuestionForEvent,
  attachQuestionMessage,
  closeAndScoreQuestion,
};
