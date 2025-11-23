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

  async getActiveSeason({ guildId }) {
    if (!guildId) {
      return {
        error: true,
        message: "El parámetro 'guildId' es obligatorio.",
      };
    }
    const activeSeason = await this.service.getActiveSeason(guildId);
    if (!activeSeason) {
      return {
        data: null,
        message: "No existe una temporada activa para este servidor.",
      };
    }
    return {
      data: activeSeason,
    };
  }
  
}

module.exports = SeasonFacade;
