class MatchRatingRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async findOrCreateSummary(tx, { guildInternalId, matchName, createdBy }) {
    const db = tx || this.prisma;

    const existing = await db.match_rating.findUnique({
      where: {
        guild_id_match: {
          guild_id: guildInternalId,
          match: matchName,
        },
      },
    });

    if (existing) return existing;
    return db.match_rating.create({
      data: {
        guild_id: guildInternalId,
        match: matchName,
        rating: 0,
        created: new Date(),
        updated: new Date(),
        created_by: createdBy,
        enabled: true,
      },
    });
  }

  async upsertDetail(tx, { summaryId, userInternalId, rating, createdBy }) {
    const db = tx || this.prisma;

    return db.match_rating_detail.upsert({
      where: {
        user_id_match_rating_id: {
          user_id: userInternalId,
          match_rating_id: summaryId,
        },
      },
      update: {
        rating: rating,
        updated: new Date(),
        updated_by: createdBy,
      },
      create: {
        match_rating_id: summaryId,
        user_id: userInternalId,
        rating: rating,
        created: new Date(),
        updated: new Date(),
        created_by: createdBy,
        enabled: true,
      },
    });
  }

  async updateAverage(tx, summaryId) {
    const db = tx || this.prisma;

    const aggregate = await db.match_rating_detail.aggregate({
      where: { match_rating_id: summaryId, enabled: true },
      _avg: { rating: true },
    });

    const newAvg = aggregate._avg.rating ? Number(aggregate._avg.rating) : 0;

    return db.match_rating.update({
      where: { match_rating_id: summaryId },
      data: {
        rating: newAvg,
        updated: new Date(),
      },
    });
  }

  async findSummaryById(tx, summaryId) {
    const db = tx || this.prisma;
    return db.match_rating.findUnique({
      where: { match_rating_id: Number(summaryId) },
    });
  }

  async countMatchRatings(tx, { guildInternalId }) {
    const db = tx || this.prisma;
    return db.match_rating.count({
      where: {
        guild_id: Number(guildInternalId),
      },
    });
  }

  async getMatchRatingsPage(tx, { guildInternalId, skip, take }) {
    const db = tx || this.prisma;

    const rows = await db.match_rating.findMany({
      where: {
        guild_id: Number(guildInternalId),
      },
      orderBy: { created: "desc" },
      skip,
      take,
    });
    return rows.map((r) => ({
      matchName: r.match,
      rating: Number(r.rating).toFixed(2),
      date: r.created,
    }));
  }
}

module.exports = MatchRatingRepository;
