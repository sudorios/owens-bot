class EventRatingRepository {

  constructor(prisma) {
    this.prisma = prisma;
  }

  async findOrCreateSummary(tx, { guildInternalId, eventName, createdBy }) {
    const db = tx || this.prisma;
    const existing = await db.event_rating.findUnique({
      where: {
        guild_id_event: {
          guild_id: guildInternalId,
          event: eventName,
        },
      },
    });
    if (existing) return existing;
    return db.event_rating.create({
      data: {
        guild_id: guildInternalId,
        event: eventName,
        rating: 0,
        user_id: 0,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: createdBy,
        enabled: true,
      },
    });
  }

  async upsertDetail(tx, { summaryId, guildInternalId, userInternalId, eventName, rating, createdBy }) {
    const db = tx || this.prisma;

    return db.event_rating_detail.upsert({
      where: {
        guild_id_user_id_event: { 
          guild_id: guildInternalId,
          user_id: userInternalId,
          event: eventName
        }
      },
      update: {
        rating: rating,
        updated: new Date(),
        updated_by: createdBy
      },
      create: {
        event_rating_id: summaryId,
        guild_id: guildInternalId,
        user_id: userInternalId,
        event: eventName,
        rating: rating,
        created: new Date(),
        updated: new Date(),
        created_by: createdBy,
        enabled: true 
      }
    });
  }

  async updateAverage(tx, summaryId) {
    const db = tx || this.prisma;
    const aggregate = await db.event_rating_detail.aggregate({
      where: { event_rating_id: summaryId, enabled: true },
      _avg: { rating: true },
      _count: { rating: true },
    });
    const newAvg = aggregate._avg.rating || 0;
    return db.event_rating.update({
      where: { event_rating_id: summaryId },
      data: {
        rating: newAvg,
        updated_at: new Date(),
      },
    });
  }

  async countEventRatings(tx, { guildIdStr }) {
    const db = tx || this.prisma;
    return db.event_rating.count({
      where: { guild_id: Number(guildIdStr) },
    });
  }

  async getInternalGuildId(tx, discordGuildIdStr) {
    const g = await db.guild.findUnique({ where: { guild_id: BigInt(discordGuildIdStr) } });
    return g ? g.id : null;
  }

  async getEventRatingsPage(tx, { guildInternalId, skip, take }) {
    const db = tx || this.prisma;

    const rows = await db.event_rating.findMany({
      where: { guild_id: Number(guildInternalId) },
      orderBy: { created_at: "desc" },
      skip,
      take,
    });

    return rows.map((r) => ({
      eventName: r.event,
      rating: Number(r.rating).toFixed(2),
      date: r.created_at,
    }));
  }
}

module.exports = EventRatingRepository;
