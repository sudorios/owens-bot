
async function addEventVote({ prisma, guildId, userId, event, rating }) {
  console.log("[addEventVote] Internal IDs:", { guildId, userId, event, rating });

  try {
    const detail = await prisma.eventRatingDetail.upsert({
      where: {
        guildId_userId_event: { guildId, userId, event },
      },
      create: {
        rating,
        event,
        user: { connect: { id: userId } },
        guild: { connect: { id: guildId } },
        eventRating: {
          connectOrCreate: {
            where: { guildId_event: { guildId, event } },
            create: {
              rating,
              event,
              guild: { connect: { id: guildId } },
              user: { connect: { id: userId } },
            },
          },
        },
      },
      update: {
        rating,
      },
    });

    const avg = await prisma.eventRatingDetail.aggregate({
      _avg: { rating: true },
      where: { guildId, event },
    });

    await prisma.eventRating.update({
      where: { id: detail.eventRatingId },
      data: { rating: avg._avg.rating ?? 0 },
    });

    return avg._avg.rating ?? 0;
  } catch (err) {
    console.error("[addEventVote] ERROR:", err);
    throw err;
  }
}

module.exports = { addEventVote };