const EventWinnerRepository = require("../repository/eventWinner.repo");
const GuildRepository = require("../repository/guild.repo");

class EventWinnerService {
  constructor(prisma) {
    this.prisma = prisma;
    this.repo = new EventWinnerRepository(prisma);
    this.guildRepo = new GuildRepository(prisma);
  }

  _buildWinnerPageText(list, page, perPage) {
    if (!list || list.length === 0) return "No hay ganadores registrados todavía.";

    const startRank = (page - 1) * perPage + 1;

    return list
      .map((w, idx) => {
        const rank = startRank + idx;
        const discordId = w.discordId;
        const mention = discordId ? `<@${discordId}>` : w.username;

        return `#${rank} ${mention} — *(Evento: ${w.eventName})*`;
      })
      .join("\n");
  }

  async getWinnersPage({ guildIdStr, page = 1, perPage = 10 }) {
    return this.prisma.$transaction(async (tx) => {
      const guildInternalId = await this.guildRepo.getInternalGuildId(tx, guildIdStr);

      if (!guildInternalId) {
        return { total: 0, description: "Servidor no registrado." };
      }

      const total = await this.repo.countEventWinners(tx, { guildInternalId });
      const totalPages = Math.max(1, Math.ceil(total / perPage));
      const safePage = Math.min(Math.max(page, 1), totalPages);
      const skip = (safePage - 1) * perPage;

      const list = await this.repo.getEventWinnersPage(tx, {
        guildInternalId,
        skip,
        take: perPage,
      });

      const description = this._buildWinnerPageText(list, safePage, perPage);

      return {
        total,
        totalPages,
        page: safePage,
        perPage,
        description,
        guildIdStr,
      };
    });
  }
}

module.exports = EventWinnerService;
