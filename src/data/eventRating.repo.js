
async function upsertEventRating(tx, { userId, guildId, event, rating }) {
  const existing = await tx.eventRating.findFirst({
    where: { userId, guildId, event },
    select: { id: true },
  });

  if (existing) {
    return tx.eventRating.update({
      where: { id: existing.id },
      data: { rating },
    });
  }

  return tx.eventRating.create({
    data: { userId, guildId, event, rating },
  });
}

module.exports = { upsertEventRating };
