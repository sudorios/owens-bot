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
    if (!refId) return msg.reply('⚠️ Responde al mensaje de la pregunta.');
    const refMsg = await msg.channel.messages.fetch(refId).catch(() => null);
    if (!refMsg) return msg.reply('⚠️ No encontré el mensaje referenciado.');

    const q = await findQuestionByMessageId(msg.client.ctx.prisma, { messageId: refMsg.id });
    if (!q) return msg.reply('❌ No encontré la Question vinculada a ese mensaje.');
    if (q.answer) {
      return msg.reply(`🛑 La pregunta #${q.id} ya estaba cerrada con respuesta: **${q.answer}**. No se volvió a puntuar.`);
    }

    let pollAnswers = [];
    if (refMsg.poll?.answers?.size) {
      pollAnswers = Array.from(refMsg.poll.answers.values());
    } else if (q.options) {
      pollAnswers = q.options.map((opt, i) => ({ text: opt, index: i }));
    }

    if (!pollAnswers.length) return msg.reply('❌ No encontré opciones para esta pregunta.');

    let index0;
    if (raw >= 0 && raw < pollAnswers.length) index0 = raw;
    else if (raw >= 1 && raw <= pollAnswers.length) index0 = raw - 1;
    else return msg.reply(`❌ Índice fuera de rango. Opciones: 0..${pollAnswers.length - 1} o 1..${pollAnswers.length}`);

    let ingest = { questionId: q.id, saved: 0 };
    if (refMsg.poll) {
      ingest = await ingestPollVotes({ prisma: msg.client.ctx.prisma, guild: msg.guild, message: refMsg });
    }

    const summary = await closeAndScoreQuestion({
      prisma: msg.client.ctx.prisma,
      questionId: q.id,
      pollAnswers,
      correctIndex: index0
    });

    if (summary.alreadyClosed) {
      return msg.reply(`🛑 La pregunta #${summary.questionId} ya estaba cerrada con respuesta: **${summary.ansLabel}**.`);
    }

    return msg.reply(
      `✅ Pregunta #${summary.questionId} cerrada.\n` +
      (refMsg.poll ? `🗳️ Votos guardados: **${ingest.saved}**\n` : '') +
      `✔️ Respuesta: **${summary.ansLabel}**\n` +
      `🏅 Ganadores: **${summary.winners}**\n` +
      `➕ Puntos por acierto: **${summary.delta}**`
    );
  },
};
