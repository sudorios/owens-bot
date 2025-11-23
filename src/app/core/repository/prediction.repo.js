class PredictionRepository {

  constructor(prisma) {
    this.prisma = prisma;
  }

  _getTable(db) {
    return db.prediction || db.Prediction;
  }

  async upsertPrediction(tx, { questionId, eventId, guildId, userId, optionId }) {
    const db = tx || this.prisma;
    const table = this._getTable(db);

    return table.upsert({
      where: {
        question_id_user_id: {
          question_id: Number(questionId),
          user_id: Number(userId),
        },
      },
      update: {
        option_id: Number(optionId),
        event_id: Number(eventId),
        guild_id: Number(guildId),
      },
      create: {
        user_id: Number(userId),
        guild_id: Number(guildId),
        event_id: Number(eventId),
        question_id: Number(questionId),
        option_id: Number(optionId),
        accuracy: 0,
        created: new Date(),
      },
    });
  }

  async updateAccuracy(tx, { questionId, winnerOptionId }) {
    const db = tx || this.prisma;
    const table = this._getTable(db);
    const qid = Number(questionId);
    const oid = Number(winnerOptionId);

    const winners = await table.findMany({
      where: {
        question_id: qid,
        option_id: oid,
      },
      select: {
        user_id: true,
        guild_id: true,
        event_id: true,
      },
    });

    if (winners.length > 0) {
      await table.updateMany({
        where: {
          question_id: qid,
          option_id: oid,
          accuracy: 0,
        },
        data: { accuracy: 1 },
      });
    }
    return {
      winners: winners.map((w) => ({
        userId: w.user_id,
        guildId: w.guild_id,
        eventId: w.event_id,
      })),
      winnersMarked: winners.length,
    };
  }
  
}

module.exports = PredictionRepository;
