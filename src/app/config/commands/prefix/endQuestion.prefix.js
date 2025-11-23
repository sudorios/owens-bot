const QuestionFacade = require("../../facade/question.facade");
const PredictionFacade = require("../../../core/facade/prediction.facade");

module.exports = {
  data: { name: "endquestion", type: "prefix" },

  async execute(msg, ctx) {
    const prisma = ctx?.prisma || msg.client.prisma || msg.client.ctx?.prisma;

    if (!prisma) {
      return msg.reply("❌ Error crítico: No se encontró la conexión a la base de datos.");
    }

    const parts = msg.content.trim().split(/\s+/);
    const rawIndex = Number(parts[1]);

    if (!Number.isInteger(rawIndex)) return msg.reply("⚠️ Usa: `!endquestion <index>` (ej: !endquestion 1)");

    const refId = msg.reference?.messageId;
    if (!refId) return msg.reply("⚠️ Responde al mensaje de la pregunta (Poll) para cerrarla.");

    let refMsg;
    try {
      refMsg = await msg.channel.messages.fetch(refId);
    } catch (e) {
      return msg.reply("⚠️ No pude leer el mensaje referenciado.");
    }

    const q = await prisma.question.findFirst({
      where: { message_id: refMsg.id },
      include: {
        question_options: {
          orderBy: { index: "asc" },
        },
      },
    });

    if (!q) return msg.reply("❌ No encontré la Question vinculada a este mensaje.");
    if (q.answer) return msg.reply(`🛑 Ya estaba cerrada con respuesta: **${q.answer}**.`);

    let ingestInfo = { saved: 0 };

    if (refMsg.poll) {
      const statusMsg = await msg.reply("⏳ Leyendo votos de la Poll...");

      const predFacade = new PredictionFacade(prisma);

      const ingestRes = await predFacade.ingestPollVotes({
        guild: msg.guild,
        message: refMsg,
      });

      if (ingestRes.error) {
        console.error("Error ingest:", ingestRes.message);
      } else {
        ingestInfo = ingestRes.data;
      }

      await statusMsg.delete().catch(() => {});
    }

    const totalOptions = q.question_options?.length || 0;
    if (rawIndex < 1 || (totalOptions > 0 && rawIndex > totalOptions)) {
      return msg.reply(`❌ Índice inválido. Opciones disponibles: 1..${totalOptions}`);
    }

    const correctIndex = rawIndex - 1;

    const qFacade = new QuestionFacade(prisma);
    const resolveRes = await qFacade.resolveQuestion({
      questionId: q.question_id,
      correctIndex: correctIndex,
      rawVotes: [],
    });

    if (resolveRes.error) {
      return msg.reply(`❌ Error al cerrar: ${resolveRes.message}`);
    }

    const summary = resolveRes.data;

    return msg.reply(
      `✅ **Pregunta Cerrada**\n` +
        `• Respuesta: **${summary.ansLabel}**\n` +
        `• Votos nuevos guardados: **${ingestInfo.saved}**\n` +
        `• Ganadores totales: **${summary.winners}**\n` +
        `• Puntos entregados: **${summary.delta}**`
    );
  },
};
