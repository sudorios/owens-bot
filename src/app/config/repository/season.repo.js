class SeasonRepo {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async findActiveSeasonByGuild(guildInternalId) {
    return this.prisma.season.findFirst({
      where: { guild_id: guildInternalId, active: true },
      orderBy: { season_id: "desc" },
    });
  }

  async closeSeason(tx, activeSeason, createdBy) {
    if (!activeSeason) return null;
    return tx.season.update({
      where: { season_id: activeSeason.season_id },
      data: {
        active: false,
        end_date: new Date(),
        updated: new Date(),
        updated_by: createdBy || process.env.USER,
      },
    });
  }
  
  async createSeason(tx, guildInternalId, seasonName, createdBy) {
    return tx.season.create({
      data: {
        guild_id: guildInternalId,
        name: seasonName,
        start_date: new Date(),
        active: true,
        created: new Date(),
        created_by: createdBy || "system",
      },
    });
  }
}

module.exports = SeasonRepo;
