const { getEventById, findOpenDuplicateQuestion, createQuestion, attachMessageId } = require('../data/question.repo.js');
const { ensureGuildAndUser } = require('../data/event.repo.js');

function normalizeAddQuestionInput({ eventId, text, points }) {
  const eid = Number(eventId);
  if (!Number.isInteger(eid) || eid <= 0) throw new Error('eventId debe ser un entero positivo.');
  if (!text || !text.trim()) throw new Error('text es requerido.');
  const pts = points != null ? Number(points) : 1;
  if (!Number.isFinite(pts) || pts < 0) throw new Error('points debe ser un número ≥ 0.');
  return { eventId: eid, text: text.trim(), points: pts };
}

async function createQuestionForEvent({
  prisma, guildIdStr, guildName = 'Unknown', discordUserId, username,
  eventId, text, points = 1,
}) {
  if (!prisma) throw new Error('Prisma no inicializado');

  return prisma.$transaction(async (tx) => {
    const { guildInternalId, userInternalId } = await ensureGuildAndUser(tx, {
      guildIdStr, guildName, discordUserId, username,
    });

    const event = await getEventById(tx, eventId);
    if (!event) throw new Error(`Event con id ${eventId} no existe.`);

    const dup = await findOpenDuplicateQuestion(tx, { eventId, text });
    if (dup) throw new Error(`Ya existe una pregunta abierta igual para este evento (Question ID ${dup.id}).`);

    const question = await createQuestion(tx, { eventId, text, points });
    return { question, event, guildInternalId, userInternalId };
  });
}

async function attachQuestionMessage({ prisma, questionId, messageId }) {
  if (!prisma) throw new Error('Prisma no inicializado');
  return prisma.$transaction(async (tx) => attachMessageId(tx, { questionId, messageId }));
}

module.exports = { normalizeAddQuestionInput, createQuestionForEvent, attachQuestionMessage };
