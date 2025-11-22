const GuildUserRepository = require("../../core/repository/guildUser.repo");
const SeasonRepository = require("../repository/season.repo");
const EventRepository = require("../repository/event.repo");

class EventService {
  constructor(prisma) {
    if (!prisma) {
      throw new Error("❌ EventService requiere prisma.");
    }
    this.prisma = prisma;
    this.guildUserRepo = new GuildUserRepository(prisma);
    this.seasonRepo = new SeasonRepository(prisma);
    this.eventRepo = new EventRepository(prisma);
  }

  async createEvent({ guildIdStr, guildName, discordUserId, username, name, state = "draft" }) {
    return this.prisma.$transaction(async (tx) => {
      const { guildInternalId, userInternalId } = await this.guildUserRepo.createGuildUser(tx, {
        guildIdStr,
        guildName,
        discordUserId,
        username,
      });
      const activeSeason = await this.seasonRepo.findActiveSeasonByGuild(guildInternalId);
      if (!activeSeason) {
        throw new Error("No hay una temporada activa. Usa /newseason para crear una.");
      }
      if (!name?.trim()) {
        throw new Error("El nombre del evento no puede estar vacío.");
      }
      return this.eventRepo.createEvent(tx, {
        guildInternalId,
        userInternalId,
        seasonId: activeSeason.season_id,
        name: name.trim(),
        createdBy: username,
        state,
      });
    });
  }

  async getEventsPage({ guildIdStr, page = 1, perPage = 10 }) {
    const guild = await this.guildUserRepo.guildRepo.findByDiscordId(this.prisma, guildIdStr);
    if (!guild) return { season: null };
    const activeSeason = await this.seasonRepo.findActiveSeasonByGuild(guild.id);
    if (!activeSeason) {
      return { season: null };
    }
    const total = await this.eventRepo.countEventsForSeason(this.prisma, {
      seasonId: activeSeason.season_id,
      guildInternalId: guild.id,
    });
    const totalPages = Math.ceil(total / perPage) || 1;
    const safePage = Math.max(1, Math.min(page, totalPages));
    const skip = (safePage - 1) * perPage;
    const rows = await this.eventRepo.listEventsForSeason(this.prisma, {
      seasonId: activeSeason.season_id,
      guildInternalId: guild.id,
      skip,
      take: perPage,
    });
    return {
      season: activeSeason,
      rows,
      page: safePage,
      totalPages,
      total,
    };
  }
}

module.exports = EventService;
