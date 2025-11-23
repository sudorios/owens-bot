class EventRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  _getScoreTable(db) {
    if (db.eventScore) return db.eventScore;
    if (db.event_score) return db.event_score;
    if (db.EventScore) return db.EventScore;

    const tables = Object.keys(db).filter((k) => !k.startsWith("_") && !k.startsWith("$"));
    console.error("❌ Error: No encuentro la tabla 'event_score'. Tablas disponibles:", tables);
    throw new Error("Tabla event_score no encontrada en Prisma.");
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
        updated: null,
      },
    });
  }

  async getEvent(tx, eventId) {
    const db = tx || this.prisma;
    const event = await db.event.findUnique({
      where: { event_id: Number(eventId) },
      select: { event_id: true, name: true },
    });

    if (event) {
      return { ...event, id: event.event_id };
    }
    return null;
  }

  async getSeasonIdByEventId(tx, eventId) {
    const db = tx || this.prisma;
    const ev = await db.event.findUnique({
      where: { event_id: Number(eventId) },
      select: { season_id: true },
    });

    return ev?.season_id || null;
  }

  async upsertEventScore(tx, { userId, guildId, eventId, delta }) {
    const db = tx || this.prisma;
    const table = this._getScoreTable(db);
    const row = await table.findFirst({
      where: {
        user_id: Number(userId),
        guild_id: Number(guildId),
        event_id: Number(eventId),
      },
      select: {
        event_score_id: true,
        points: true,
      },
    });

    if (row) {
      return table.update({
        where: {
          event_score_id: row.event_score_id,
        },
        data: {
          points: row.points + delta,
          updated: new Date(),
        },
      });
    }
    return table.create({
      data: {
        user_id: Number(userId),
        guild_id: Number(guildId),
        event_id: Number(eventId),
        points: delta,
        enabled: true,
        created: new Date(),
        updated: new Date(),
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
    return rows.map((r) => ({ ...r, id: r.event_id }));
  }
}

module.exports = EventRepository;
