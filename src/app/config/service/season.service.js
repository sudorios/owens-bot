const SeasonRepo = require("../repository/season.repo");
const GuildRepo = require("../repository/guild.repo");

class SeasonService {

  constructor(prisma) {
    this.prisma = prisma;
    this.repo = new SeasonRepo(prisma); 
    this.guildRepo = new GuildRepo(prisma);
  }
  async startNewSeason(discordGuildId, guildName, requestedName, createdBy) {
    return await this.prisma.$transaction(async (tx) => {
      const guild = await this.guildRepo.createGuild(
        tx,
        discordGuildId,
        guildName,
        createdBy
      );
      const guildInternalId = guild.id;
      const activeSeason = await this.repo.findActiveSeasonByGuild(
        guildInternalId
      );
      let closedSeason = null;
      if (activeSeason) {
        closedSeason = await this.repo.closeSeason(tx, activeSeason, createdBy);
      }
      const newSeason = await this.repo.createSeason(
        tx,
        guildInternalId,
        requestedName || `Temporada de ${guildName}`,
        createdBy
      );
      return { closedSeason, newSeason };
    });
  }

  async getActiveSeason(discordGuildId) {
    const guildInternalId = await this.guildRepo.getInternalGuildId(
      this.prisma, 
      discordGuildId
    );
    if (!guildInternalId) return null; 
    return await this.repo.findActiveSeasonByGuild(guildInternalId);
  }

}

module.exports = SeasonService;