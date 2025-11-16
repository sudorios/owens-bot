async function upsertPredictionFromVote(tx, { questionId, eventId, guildId, userId, optionId }) {
  return tx.prediction.upsert({
    where: { questionId_userId: { questionId, userId } },
    update: { optionId, eventId, guildId },
    create: { userId, guildId, eventId, questionId, optionId, accuracy: 0 },
    select: { id: true },
  });
}

async function updateAccuracy(tx, { questionId, winnerOptionId }) {
  const qid = Number(questionId);
  const oid = Number(winnerOptionId);

  const winners = await tx.prediction.findMany({
    where: { questionId: qid, optionId: oid },
    select: { userId: true, guildId: true, eventId: true },
  });

  if (winners.length > 0) {
    await tx.prediction.updateMany({
      where: { questionId: qid, optionId: oid, accuracy: 0 },
      data:  { accuracy: 1 },
    });
  }

  return { winners, winnersMarked: winners.length };
}

module.exports = { upsertPredictionFromVote, updateAccuracy };
