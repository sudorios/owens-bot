class EventRankingRepository {

  constructor(prisma) {
    this.prisma = prisma;
  }

  _getView(db) {
    if (db.vwEventScore) return db.vwEventScore;
    if (db.vw_event_score) return db.vw_event_score;
    throw new Error("❌ Vista vw_event_score no encontrada. Ejecuta 'npx prisma generate'.");
  }

  async countEventRanking(tx, { eventId }) {
    const db = tx || this.prisma;
    const view = this._getView(db);

    return view.count({
      where: {
        event_id: Number(eventId),
        points: { gt: 0 },
      },
    });
  }

  async getEventRankingPage(tx, { eventId, skip, take }) {
    const db = tx || this.prisma;
    const view = this._getView(db);

    const rows = await view.findMany({
      where: {
        event_id: Number(eventId),
        points: { gt: 0 },
      },
      orderBy: [{ points: "desc" }, { event_score_id: "asc" }],
      skip,
      take,
    });

    return rows.map((r) => ({
      userId: r.user_id,
      eventId: r.event_id,
      points: r.points,
      username: r.username,
      discordId: r.user_dc_id,
    }));
  }
  
}

module.exports = EventRankingRepository;
