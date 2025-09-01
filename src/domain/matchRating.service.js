async function addMatchVote({ prisma, guildId, userId, match, rating }) {

  try {
    const detail = await prisma.matchRatingDetail.upsert({
      where: {
        userId_matchRatingId: { 
          userId, 
          matchRatingId: (await prisma.matchRating.findUnique({
            where: { guildId_match: { guildId, match } }
          }))?.id || 0 
        },
      },
      create: {
        rating,
        user: { connect: { id: userId } },
        matchRating: {
          connectOrCreate: {
            where: { guildId_match: { guildId, match } },
            create: {
              guild: { connect: { id: guildId } },
              match,
              rating,
            },
          },
        },
      },
      update: { rating },
    });

    const avg = await prisma.matchRatingDetail.aggregate({
      _avg: { rating: true },
      where: { matchRatingId: detail.matchRatingId },
    });

    await prisma.matchRating.update({
      where: { id: detail.matchRatingId },
      data: { rating: avg._avg.rating ?? 0 },
    });

    return avg._avg.rating ?? 0;

  } catch (err) {
    console.error("[addMatchVote] ERROR:", err);
    throw err;
  }
}

module.exports = { addMatchVote };
