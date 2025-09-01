
async function addEventVote({ prisma, guildId, userId, event, rating }) {
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

async function getEventRatingsBundle({ prisma, guildId, perPage = 5, page = 1 }) {
  const skip = (page - 1) * perPage;

  const total = await prisma.eventRating.count({
    where: { guildId },
  });

  const ratings = await prisma.eventRating.findMany({
    where: { guildId },
    orderBy: { id: "asc" },
    skip,
    take: perPage,
  });

  const description = ratings
    .map(r => `⭐ **${r.event}** → Promedio: ${r.rating}`)
    .join("\n");

  return {
    description: description || "📭 No hay eventos calificados aún.",
    ratings,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

module.exports = { addEventVote, getEventRatingsBundle };