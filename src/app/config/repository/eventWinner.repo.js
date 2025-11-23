class EventWinnerRepository {

  constructor(prisma) {
    this.prisma = prisma;
  }

  _getView(db) {
    if (db.vwEventWinners) return db.vwEventWinners;
    if (db.vw_event_winners) return db.vw_event_winners;
    throw new Error("❌ Vista vw_event_winners no encontrada. Ejecuta 'npx prisma generate'.");
  }

  async countEventWinners(tx, { guildInternalId }) {
    const db = tx || this.prisma;
    const view = this._getView(db);

    return view.count({
      where: { guild_id: Number(guildInternalId) },
    });
  }

  async getEventWinnersPage(tx, { guildInternalId, skip, take }) {
    const db = tx || this.prisma;
    const view = this._getView(db);

    const rows = await view.findMany({
      where: { guild_id: Number(guildInternalId) },
      orderBy: [{ points: "desc" }, { event_winner_id: "asc" }],
      skip,
      take,
    });

    return rows.map((r) => ({
      username: r.username,
      discordId: r.user_dc_id,
      points: r.points,
      eventName: r.event_name,
    }));
  }
}

module.exports = EventWinnerRepository;