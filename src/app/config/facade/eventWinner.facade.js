const EventWinnerService = require("../service/eventWinner.service");

class EventWinnerFacade {
  constructor(prisma) {
    if (!prisma) throw new Error("❌ EventWinnerFacade requiere Prisma.");
    this.service = new EventWinnerService(prisma);
  }

  async getWinnersPage(params) {
    try {
      return await this.service.getWinnersPage(params);
    } catch (err) {
      console.error("🔥 [EventWinnerFacade] Error:", err.message);
      return { total: 0, error: true, description: "Error interno." };
    }
  }
}

module.exports = EventWinnerFacade;