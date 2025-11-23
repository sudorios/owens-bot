const QuestionService = require("../service/question.service");

class QuestionFacade {
  constructor(prisma) {
    if (!prisma) throw new Error("❌ QuestionFacade requiere Prisma.");
    this.service = new QuestionService(prisma);
  }

  async createQuestion(params) {
    try {
      const result = await this.service.createQuestion(params);
      return { error: false, data: result };
    } catch (err) {
      console.error("🔥 [QuestionFacade] Create Error:", err.message);
      return { error: true, message: err.message };
    }
  }

  async attachMessage(params) {
    try {
      await this.service.attachMessage(params);
      return { error: false };
    } catch (err) {
      console.error("🔥 [QuestionFacade] Attach Error:", err.message);
      return { error: true, message: err.message };
    }
  }

  async resolveQuestion(params) {
    try {
      const result = await this.service.resolveQuestion(params);
      return { error: false, data: result };
    } catch (err) {
      console.error("🔥 [QuestionFacade] Resolve Error:", err.message);
      return { error: true, message: err.message };
    }
  }
}

module.exports = QuestionFacade;