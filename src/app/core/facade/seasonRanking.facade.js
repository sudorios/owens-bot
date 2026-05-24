const SeasonRankingService = require("../service/seasonRanking.service");

class SeasonRankingFacade {
  constructor(prisma) {
    if (!prisma) throw new Error("❌ SeasonRankingFacade requiere Prisma.");
    this.service = new SeasonRankingService(prisma);
  }

  async getRankingPage(params) {
    try {
      return await this.service.getRankingPage(params);
    } catch (err) {
      console.error("🔥 [SeasonRankingFacade] Error:", err.message);
      return { season: null, error: true };
    }
  }
}

module.exports = SeasonRankingFacade;