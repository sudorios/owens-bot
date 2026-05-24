const EventRankingRepository = require("../repository/eventScore.repo");
const EventRepository = require("../../config/repository/event.repo"); 

const MEDALS = ['🥇','🥈','🥉'];

class EventRankingService {
  constructor(prisma) {
    this.prisma = prisma;
    this.rankingRepo = new EventRankingRepository(prisma);
    this.eventRepo = new EventRepository(prisma);
  }

  _buildRankingText(list, page, perPage) {
    if (!list || list.length === 0) return 'No hay puntuaciones para este evento todavía.';
    
    const startRank = (page - 1) * perPage + 1;
    
    return list.map((e, idx) => {
      const rank = startRank + idx;
      const tag = rank <= 3 ? MEDALS[rank - 1] : `#${rank}`;
      const discordId = e.discordId;
      const username = e.username || 'Unknown';
      
      const mention = discordId ? `<@${discordId}>` : username;

      return `${tag} ${mention} — **${e.points}** pts`;
    }).join('\n');
  }

  async getRankingPage({ eventId, page = 1, perPage = 10 }) {
    return this.prisma.$transaction(async (tx) => {
      const event = await this.eventRepo.getEvent(tx, eventId);
      if (!event) return { event: null, error: "Evento no encontrado" };

      const total = await this.rankingRepo.countEventRanking(tx, { eventId });
      const totalPages = Math.max(1, Math.ceil(total / perPage));
      const safePage = Math.min(Math.max(page, 1), totalPages);
      const skip = (safePage - 1) * perPage;

      const list = await this.rankingRepo.getEventRankingPage(tx, { 
          eventId, skip, take: perPage 
      });

      const description = this._buildRankingText(list, safePage, perPage);

      return {
        event,
        total,
        totalPages,
        page: safePage,
        perPage,
        description
      };
    });
  }
}

module.exports = EventRankingService;