async function upsertPredictionFromVote(tx, { questionId, eventId, guildId, userId, optionId }) {
  return tx.prediction.upsert({
    where: { questionId_userId: { questionId, userId } },
    update: { optionId, eventId, guildId },
    create: { userId, guildId, eventId, questionId, optionId, accuracy: 0 },
    select: { id: true },
  });
}

module.exports = { upsertPredictionFromVote };
