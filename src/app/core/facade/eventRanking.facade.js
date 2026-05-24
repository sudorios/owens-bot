const EventRankingService = require("../service/eventRanking.service");

class EventRankingFacade {
  constructor(prisma) {
    if (!prisma) throw new Error("❌ EventRankingFacade requiere Prisma.");
    this.service = new EventRankingService(prisma);
  }

  async getRankingPage(params) {
    try {
      return await this.service.getRankingPage(params);
    } catch (err) {
      console.error("🔥 [EventRankingFacade] Error:", err.message);
      return { event: null, error: true, message: err.message };
    }
  }
}

module.exports = EventRankingFacade;