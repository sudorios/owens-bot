const EventService = require("../service/event.service");

class EventFacade {
  constructor(prisma) {
    if (!prisma) {
      throw new Error("❌ EventFacade requiere instancia de Prisma.");
    }
    this.service = new EventService(prisma);
  }
  
  async createEvent(params) {
    try {
      const newEvent = await this.service.createEvent(params);
      return {
        error: false,
        data: newEvent,
      };
    } catch (err) {
      console.error("[EventFacade] Error al crear evento:", err.message);
      return {
        error: true,
        message: err.message,
      };
    }
  }

  async getEventsPage(params) {
    try {
      return await this.service.getEventsPage(params);
    } catch (err) {
      console.error("[EventFacade] Error en getEventsPage:", err.message);
      return {
        season: null,
        rows: [],
        total: 0,
        totalPages: 0,
        page: 1,
      };
    }
  }
}

module.exports = EventFacade;
