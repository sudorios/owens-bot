const EventRatingService = require("../service/eventRating.service");

class EventRatingFacade {
  constructor(prisma) {
    if (!prisma) throw new Error("❌ EventRatingFacade requiere Prisma.");
    this.service = new EventRatingService(prisma);
  }

  async createRatingSummary(params) {
    try {
      const summary = await this.service.initializeSummary(params);
      return { error: false, data: summary };
    } catch (err) {
      console.error("🔥 Error creando poll:", err.message);
      return { error: true, message: err.message };
    }
  }

  async registerButtonVote(params) {
    try {
      const data = await this.service.rateEvent(params);
      return { error: false, data };
    } catch (err) {
      console.error("🔥 Error al votar:", err.message);
      return { error: true, message: err.message };
    }
  }

  async getRatingsBundle(params) {
    try {
      return await this.service.getRatingsBundle(params);
    } catch (err) {
      console.error("🔥 Error listando:", err.message);
      return { total: 0, totalPages: 0, description: "Error interno." };
    }
  }
}

module.exports = EventRatingFacade;
