const MatchRatingService = require("../service/matchRating.service");

class MatchRatingFacade {
  constructor(prisma) {
    if (!prisma) throw new Error("❌ MatchRatingFacade requiere Prisma.");
    this.service = new MatchRatingService(prisma);
  }

  async createMatchPoll(params) {
    try {
      const summary = await this.service.initializeSummary(params);
      return { error: false, data: summary };
    } catch (err) {
      console.error("🔥 Error creando poll match:", err.message);
      return { error: true, message: err.message };
    }
  }

  async registerButtonVote(params) {
    try {
      const data = await this.service.rateMatch(params);
      return { error: false, data };
    } catch (err) {
      console.error("🔥 Error votando match:", err.message);
      return { error: true, message: err.message };
    }
  }

  async getRatingsBundle(params) {
    try {
      return await this.service.getRatingsBundle(params);
    } catch (err) {
      console.error("🔥 [MatchRatingFacade] List Error:", err.message);
      return { total: 0, totalPages: 0, description: "Error interno." };
    }
  }
  
}

module.exports = MatchRatingFacade;
