class EventRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async createEvent(tx, { guildInternalId, userInternalId, seasonId, name, createdBy }) {
    const db = tx || this.prisma;
    return db.event.create({
      data: {
        guild_id: guildInternalId,
        user_id: userInternalId,
        season_id: seasonId,
        name: name,
        state_code: "ESEV001",
        enabled: true,
        created: new Date(),
        created_by: createdBy,
      },
    });
  }

  async getEvent(tx, eventId) {
    const db = tx || this.prisma;
    return db.event.findUnique({
      where: { id: Number(eventId) },
      select: { id: true, name: true },
    });
  }

  async getSeasonIdByEventId(tx, eventId) {
    const db = tx || this.prisma;
    const ev = await db.event.findUnique({
      where: { id: Number(eventId) },
      select: { season_id: true },
    });

    return ev?.season_id || null;
  }

  async upsertEventScore(tx, { userId, guildId, eventId, delta }) {
    const db = tx || this.prisma;
    const row = await db.eventScore.findFirst({
      where: {
        userId: Number(userId),
        guildId: Number(guildId),
        eventId: Number(eventId),
      },
      select: { id: true, points: true },
    });

    if (row) {
      return db.eventScore.update({
        where: { id: row.id },
        data: { points: row.points + delta },
      });
    }

    return db.eventScore.create({
      data: {
        userId: Number(userId),
        guildId: Number(guildId),
        eventId: Number(eventId),
        points: delta,
      },
    });
  }

  async countEventsForSeason(tx, { seasonId, guildInternalId }) {
    const db = tx || this.prisma;
    return db.event.count({
      where: {
        season_id: Number(seasonId),
        guild_id: Number(guildInternalId),
      },
    });
  }

  async listEventsForSeason(tx, { seasonId, guildInternalId, skip = 0, take = 10 }) {
    const db = tx || this.prisma;
    const rows = await db.event.findMany({
      where: {
        season_id: Number(seasonId),
        guild_id: Number(guildInternalId),
      },
      select: {
        event_id: true,
        name: true,
        state_code: true,
        created: true,
      },
      orderBy: { created: "desc" },
      skip,
      take,
    });
    return rows.map((r) => ({
      ...r,
      id: r.event_id,
    }));
  }
}

module.exports = EventRepository;
