class SeasonScoreRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  _getView(db) {
    if (db.vwSeasonScore) return db.vwSeasonScore;
    if (db.vw_season_score) return db.vw_season_score;
    throw new Error("❌ Vista vw_season_score no encontrada. Ejecuta 'npx prisma generate'.");
  }

  _getTable(db) {
    if (db.seasonScore) return db.seasonScore;
    if (db.season_score) return db.season_score;
    if (db.SeasonScore) return db.SeasonScore;
    throw new Error("❌ Tabla season_score no encontrada.");
  }

  async countSeasonRanking(tx, { seasonId, guildInternalId }) {
    const db = tx || this.prisma;
    const view = this._getView(db);

    return view.count({
      where: {
        season_id: Number(seasonId),
        guild_id: Number(guildInternalId),
        points: { gt: 0 },
      },
    });
  }

  async getSeasonRankingPage(tx, { seasonId, guildInternalId, perPage = 10, page = 1 }) {
    const db = tx || this.prisma;
    const view = this._getView(db);
    const take = Math.min(Math.max(perPage, 1), 50);
    const skip = Math.max(page - 1, 0) * take;

    const rows = await view.findMany({
      where: {
        season_id: Number(seasonId),
        guild_id: Number(guildInternalId),
        points: { gt: 0 },
      },
      orderBy: [{ points: "desc" }],
      take,
      skip,
    });

    return rows.map((r) => ({
      userId: r.user_id,
      guildId: r.guild_id,
      seasonId: r.season_id,
      points: r.points,
      position: r.position,
      lastPosition: r.last_position,
      username: r.username || `User#${r.user_id}`,
      discordId: r.user_dc_id,
    }));
  }

  async updateSeasonPositions(tx, { seasonId, guildInternalId }) {
    const db = tx || this.prisma;
    const table = this._getTable(db);
    const sid = Number(seasonId);
    const gid = Number(guildInternalId);

    const all = await table.findMany({
      where: { season_id: sid, guild_id: gid, points: { gt: 0 } },
      select: {
        season_score_id: true,
        points: true,
        position: true,
      },
      orderBy: [{ points: "desc" }, { season_score_id: "asc" }],
    });

    let updates = 0;
    let rank = 0;
    let prevPoints = null;

    for (let i = 0; i < all.length; i++) {
      const row = all[i];
      if (prevPoints === null || row.points !== prevPoints) {
        rank = i + 1;
        prevPoints = row.points;
      }

      if (row.position !== rank) {
        await table.update({
          where: {
            season_score_id: row.season_score_id,
          },
          data: {
            last_position: row.position,
            position: rank,
          },
        });
        updates++;
      }
    }
    return { updates, total: all.length };
  }

  async upsertSeasonScore(tx, { userId, guildId, seasonId, delta }) {
    const db = tx || this.prisma;
    const table = this._getTable(db);

    const row = await table.findFirst({
      where: {
        user_id: Number(userId),
        guild_id: Number(guildId),
        season_id: Number(seasonId),
      },
      select: {
        season_score_id: true,
        points: true,
      },
    });

    if (row) {
      return table.update({
        where: { season_score_id: row.season_score_id },
        data: { points: row.points + delta },
      });
    }

    return table.create({
      data: {
        user_id: Number(userId),
        guild_id: Number(guildId),
        season_id: Number(seasonId),
        points: delta,
        enabled: true,
        created: new Date(),
        position: 0,
        last_position: 0,
      },
    });
  }
}

module.exports = SeasonScoreRepository;
