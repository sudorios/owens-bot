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

async function getMatchRatingsBundle({ prisma, guildId, perPage = 5, page = 1 }) {
  const skip = (page - 1) * perPage;

  const total = await prisma.matchRating.count({
    where: { guildId },
  });

  const ratings = await prisma.matchRating.findMany({
    where: { guildId },
    orderBy: { id: "asc" },
    skip,
    take: perPage,
  });

  const description = ratings
    .map((r) => `⭐ **${r.match}** → Promedio: ${r.rating}`)
    .join("\n");

  return {
    description: description || "📭 No hay luchas calificadas aún.",
    ratings,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

module.exports = {
  addMatchVote,
  getMatchRatingsBundle,
};