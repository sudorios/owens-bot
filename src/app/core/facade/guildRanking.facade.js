const GuildRankingService = require("../service/guildRanking.service");

class GuildRankingFacade {
  constructor(prisma) {
    this.service = new GuildRankingService(prisma);
  }

  async getRankingPage(params) {
    try {
      return await this.service.getRankingPage(params);
    } catch (err) {
      console.error("[GuildRankingFacade] Error:", err.message);
      return { total: 0, totalPages: 0, description: "Error al cargar ranking." };
    }
  }
}

module.exports = GuildRankingFacade;
