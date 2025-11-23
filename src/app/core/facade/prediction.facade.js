const PredictionService = require("../service/prediction.service");

class PredictionFacade {

  constructor(prisma) {
    if (!prisma) {
      throw new Error("❌ PredictionFacade requiere una instancia de Prisma.");
    }
    this.service = new PredictionService(prisma);
  }

  async ingestPollVotes(params) {
    try {
      const result = await this.service.ingestPollVotes(params);
      return {
        error: false,
        data: result,
      };
    } catch (err) {
      console.error("🔥 [PredictionFacade] Error al ingestar votos:", err.message);
      return {
        error: true,
        message: err.message,
      };
    }
  }
    
}

module.exports = PredictionFacade;
