const { ingestPollVotes } = require('../../domain/prediction.service');
const { closeAndScoreQuestion } = require('../../domain/question.service');
const { findQuestionByMessageId } = require('../../data/question.repo'); 

module.exports = {
  data: { name: 'endquestion', type: 'prefix' },
  async execute(msg) {
    const parts = msg.content.trim().split(/\s+/);
    const raw = Number(parts[1]);
    if (!Number.isInteger(raw)) return msg.reply('⚠️ Usa: `!endquestion <index>`');

    const refId = msg.reference?.messageId;
    if (!refId) return msg.reply('⚠️ Responde al mensaje del bot con la encuesta.');
    const refMsg = await msg.channel.messages.fetch(refId).catch(() => null);
    if (!refMsg || refMsg.author?.id !== msg.client.user?.id) return msg.reply('⚠️ No es mensaje del bot.');
    if (!refMsg.poll) return msg.reply('❌ Ese mensaje no tiene encuesta.');

    const pollAnswers = Array.from(refMsg.poll.answers.values());
    if (!pollAnswers.length) return msg.reply('❌ La encuesta no tiene opciones.');

    let index0;
    if (raw >= 0 && raw < pollAnswers.length) index0 = raw;
    else if (raw >= 1 && raw <= pollAnswers.length) index0 = raw - 1;
    else return msg.reply(`❌ Índice fuera de rango. Opciones: 0..${pollAnswers.length - 1} o 1..${pollAnswers.length}`);

    const q = await findQuestionByMessageId(msg.client.ctx.prisma, { messageId: refMsg.id });
    if (!q) return msg.reply('❌ No encontré la Question vinculada a ese mensaje.');
    if (q.answer) {
      return msg.reply(`🛑 La pregunta #${q.id} ya estaba cerrada con respuesta: **${q.answer}**. No se volvió a puntuar.`);
    }

    const ingest = await ingestPollVotes({ prisma: msg.client.ctx.prisma, guild: msg.guild, message: refMsg });
    const summary = await closeAndScoreQuestion({
      prisma: msg.client.ctx.prisma,
      questionId: ingest.questionId,
      pollAnswers,
      correctIndex: index0
    });

    if (summary.alreadyClosed) {
      return msg.reply(`🛑 La pregunta #${summary.questionId} ya estaba cerrada con respuesta: **${summary.ansLabel}**.`);
    }

    return msg.reply(
      `✅ Pregunta #${summary.questionId} cerrada.\n` +
      `🗳️ Votos guardados: **${ingest.saved}**\n` +
      `✔️ Respuesta: **${summary.ansLabel}**\n` +
      `🏅 Ganadores: **${summary.winners}**\n` +
      `➕ Puntos por acierto: **${summary.delta}**`
    );
  },
};
