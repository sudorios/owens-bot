const SeasonService = require("../service/season.service");

class SeasonFacade {
  constructor(prisma) {
    this.service = new SeasonService(prisma);
  }

  async startNewSeason({ guildId, guildName, requestedName, createdBy }) {
    const { closedSeason, newSeason } = await this.service.startNewSeason(
      guildId,
      guildName,
      requestedName,
      createdBy
    );
    return { data: { closedSeason, newSeason } };
  }
}

module.exports = SeasonFacade;