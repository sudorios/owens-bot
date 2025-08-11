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

module.exports = {
  data: { name: "endquestion", type: "prefix" },
  async execute(msg) {
    const parts = msg.content.trim().split(/\s+/);
    const correctIndex = Number(parts[1]);
    if (!Number.isInteger(correctIndex))
      return msg.reply("⚠️ Usa: `!endquestion <index>`");

    const refId = msg.reference?.messageId;
    if (!refId)
      return msg.reply("⚠️ Responde al mensaje del bot con la encuesta.");
    const refMsg = await msg.channel.messages.fetch(refId).catch(() => null);
    if (!refMsg || refMsg.author?.id !== msg.client.user?.id)
      return msg.reply("⚠️ No es mensaje del bot.");

    const summary = await msg.client.ctx.prisma.$transaction(async (tx) => {
      const q = await findQuestionByMessageId(tx, { messageId: refMsg.id });
      if (!q) throw new Error("Question no encontrada por messageId");

      // leer opciones de la poll y validar rango
      const pollAnswers = Array.from(refMsg.poll?.answers.values() || []);
      const index1 = Number(correctIndex);
      const index0 = index1 - 1; // tratar input como 1-based
      if (
        !Number.isInteger(index1) ||
        index1 <= 0 ||
        index0 >= pollAnswers.length
      ) {
        throw new Error(
          `Índice fuera de rango. Recibido ${index1}. Opciones en poll: ${pollAnswers.length}`
        );
      }

      // intentar por índice en DB (0-based)
      let opt = await getOptionIdByIndex(tx, {
        questionId: q.id,
        index: index0,
      });

      // si no existe en DB, intentar por label (normalizado)
      const pollLabel = (pollAnswers[index0]?.text || "").trim().toLowerCase();
      if (!opt?.id && pollLabel) {
        const byLabel = await tx.questionOption.findFirst({
          where: {
            questionId: q.id,
            label: { equals: pollLabel, mode: "insensitive" },
          },
          select: { id: true, label: true, index: true },
        });
        if (byLabel) opt = byLabel;
      }

      if (!opt?.id) {
        // debug útil: muestra mapa índice/label de DB y de la poll
        const dbOpts = await tx.questionOption.findMany({
          where: { questionId: q.id },
          select: { index: true, label: true },
          orderBy: { index: "asc" },
        });
        const pollOpts = pollAnswers.map((a, i) => ({
          index: i,
          label: a.text,
        }));
        throw new Error(
          `Opción inexistente para ese index.\n` +
            `DB options: ${dbOpts
              .map((o) => `[${o.index}] ${o.label}`)
              .join(" | ")}\n` +
            `POLL opts: ${pollOpts
              .map((o) => `[${o.index}] ${o.label}`)
              .join(" | ")}`
        );
      }

      const winners = await findWinningPredictions(tx, {
        questionId: q.id,
        optionId: opt.id,
      });
      const seasonId = await getSeasonIdByEventId(tx, q.eventId);
      const delta = q.points || 1;

      let applied = 0;
      for (const w of winners) {
        await upsertEventScore(tx, {
          userId: w.userId,
          guildId: w.guildId,
          eventId: q.eventId,
          delta,
        });
        if (seasonId)
          await upsertSeasonScore(tx, {
            userId: w.userId,
            guildId: w.guildId,
            seasonId,
            delta,
          });
        await upsertGuildUserPoints(tx, {
          userId: w.userId,
          guildId: w.guildId,
          delta,
        });
        applied++;
      }

      const ansLabel = opt.label ?? String(index1);
      await closeQuestionWithAnswer(tx, { questionId: q.id, answer: ansLabel });

      return { winners: applied, questionId: q.id, delta, ansLabel };
    });

    return msg.reply(
      `✅ Pregunta #${summary.questionId} cerrada.\n✔️ Respuesta: **${summary.ansLabel}**\n🏅 Ganadores: **${summary.winners}**\n➕ Puntos por acierto: **${summary.delta}**`
    );
  },
};
