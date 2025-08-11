const {
  findQuestionByMessageId,
  getOptionIdByIndex,
  findWinningPredictions,
  closeQuestionWithAnswer,
} = require("../../data/question.repo");
const {
  getSeasonIdByEventId,
  upsertEventScore,
  upsertSeasonScore,
  upsertGuildUserPoints,
} = require("../../data/score.repo");
const { upsertGuildByDiscordId } = require("../../data/guild.repo");
const { upsertUserByDiscordId } = require("../../data/user.repo");

module.exports = {
  data: { name: "endquestion", type: "prefix" },
  async execute(msg) {
    const parts = msg.content.trim().split(/\s+/);
    const raw = Number(parts[1]);
    if (!Number.isInteger(raw)) return msg.reply("⚠️ Usa: `!endquestion <index>`");

    const refId = msg.reference?.messageId;
    if (!refId) return msg.reply("⚠️ Responde al mensaje del bot con la encuesta.");
    const refMsg = await msg.channel.messages.fetch(refId).catch(() => null);
    if (!refMsg || refMsg.author?.id !== msg.client.user?.id) return msg.reply("⚠️ No es mensaje del bot.");
    if (!refMsg.poll) return msg.reply("❌ Ese mensaje no tiene encuesta.");

    const pollAnswers = Array.from(refMsg.poll.answers.values());
    if (!pollAnswers.length) return msg.reply("❌ La encuesta no tiene opciones.");

    let index0;
    if (raw >= 0 && raw < pollAnswers.length) index0 = raw;
    else if (raw >= 1 && raw <= pollAnswers.length) index0 = raw - 1;
    else return msg.reply(`❌ Índice fuera de rango. Opciones: 0..${pollAnswers.length - 1} o 1..${pollAnswers.length}`);

    const votes = [];
    for (let i = 0; i < pollAnswers.length; i++) {
      const voters = await pollAnswers[i].fetchVoters().catch(() => null);
      if (!voters) continue;
      for (const voter of voters.values()) {
        votes.push({ index: i, discordUserId: voter.id, username: voter.tag });
      }
    }

    const ingest = await msg.client.ctx.prisma.$transaction(async (tx) => {
      const q = await findQuestionByMessageId(tx, { messageId: refMsg.id });
      if (!q) throw new Error("Question no encontrada por messageId");

      const g = await upsertGuildByDiscordId(tx, msg.guild.id, msg.guild.name);

      let saved = 0;
      for (const v of votes) {
        const u = await upsertUserByDiscordId(tx, v.discordUserId, v.username);
        const opt = await tx.questionOption.findUnique({
          where: { questionId_index: { questionId: q.id, index: v.index } },
          select: { id: true },
        });
        if (!opt?.id) continue;
        await tx.prediction.upsert({
          where: { questionId_userId: { questionId: q.id, userId: u.id } },
          update: { optionId: opt.id, eventId: q.eventId, guildId: g.id },
          create: {
            userId: u.id,
            guildId: g.id,
            eventId: q.eventId,
            questionId: q.id,
            optionId: opt.id,
            accuracy: 0,
          },
        });
        saved++;
      }

      return { saved, questionId: q.id, eventId: q.eventId };
    });

    const summary = await msg.client.ctx.prisma.$transaction(async (tx) => {
      const q = await tx.question.findUnique({
        where: { id: ingest.questionId },
        select: { id: true, eventId: true, points: true },
      });

      let opt = await getOptionIdByIndex(tx, { questionId: q.id, index: index0 });
      if (!opt?.id) {
        const label = (pollAnswers[index0]?.text || "").trim();
        const byLabel = await tx.questionOption.findFirst({
          where: { questionId: q.id, label: { equals: label, mode: "insensitive" } },
          select: { id: true, label: true, index: true },
        });
        if (byLabel) opt = byLabel;
      }
      if (!opt?.id) throw new Error("Opción inexistente para ese index (desfasada con DB).");

      const winners = await findWinningPredictions(tx, { questionId: q.id, optionId: opt.id });
      const seasonId = await getSeasonIdByEventId(tx, q.eventId);
      const delta = q.points || 1;

      let applied = 0;
      for (const w of winners) {
        await upsertEventScore(tx,  { userId: w.userId, guildId: w.guildId, eventId: q.eventId, delta });
        if (seasonId) await upsertSeasonScore(tx, { userId: w.userId, guildId: w.guildId, seasonId, delta });
        await upsertGuildUserPoints(tx, { userId: w.userId, guildId: w.guildId, delta });
        applied++;
      }

      const ansLabel = opt.label ?? String(index0 + 1);
      await closeQuestionWithAnswer(tx, { questionId: q.id, answer: ansLabel });

      return { winners: applied, questionId: q.id, delta: delta, ansLabel, ingested: ingest.saved };
    });

    return msg.reply(
      `✅ Pregunta #${summary.questionId} cerrada.\n` +
      `🗳️ Votos guardados: **${summary.ingested}**\n` +
      `✔️ Respuesta: **${summary.ansLabel}**\n` +
      `🏅 Ganadores: **${summary.winners}**\n` +
      `➕ Puntos por acierto: **${summary.delta}**`
    );
  },
};
