const EventRatingRepository = require("../repository/eventRating.repo");
const GuildUserRepository = require("../../core/repository/guildUser.repo");

class EventRatingService {
  constructor(prisma) {
    this.prisma = prisma;
    this.repo = new EventRatingRepository(prisma);
    this.guildUserRepo = new GuildUserRepository(prisma);
  }

  async rateEvent({ guildIdStr, guildName, discordUserId, username, eventName, rating }) {
    if (!eventName || !eventName.trim()) throw new Error("El nombre del evento es requerido.");
    const score = Number(rating);
    if (isNaN(score) || score < 1 || score > 5) throw new Error("El rating debe ser entre 1 y 5.");

    const cleanEventName = eventName.trim();

    return this.prisma.$transaction(async (tx) => {
      const { guildInternalId, userInternalId } = await this.guildUserRepo.createGuildUser(tx, {
        guildIdStr,
        guildName,
        discordUserId,
        username,
      });

      const summary = await this.repo.findOrCreateSummary(tx, {
        guildInternalId,
        eventName: cleanEventName,
        createdBy: username,
      });

      await this.repo.upsertDetail(tx, {
        summaryId: summary.event_rating_id,
        guildInternalId,
        userInternalId,
        eventName: cleanEventName,
        rating: score,
        createdBy: username,
      });

      const updatedSummary = await this.repo.updateAverage(tx, summary.event_rating_id);

      return {
        eventName: cleanEventName,
        newAverage: Number(updatedSummary.rating).toFixed(2),
        userRating: score,
      };
    });
  }

  _buildDescription(list) {
    if (!list || list.length === 0) return "No hay eventos calificados en este servidor.";

    return list
      .map((e) => {
        const stars = "⭐".repeat(Math.round(Number(e.rating)));
        return `**${e.eventName}**\n📊 Rating: **${e.rating}** ${stars}\n📅 ${e.date.toLocaleDateString()}`;
      })
      .join("\n\n");
  }

  async getRatingsBundle({ guildIdStr, guildName, discordUserId, username, page = 1, perPage = 5 }) {
    return this.prisma.$transaction(async (tx) => {
      const { guildInternalId } = await this.guildUserRepo.createGuildUser(tx, {
        guildIdStr,
        guildName,
        discordUserId,
        username,
      });

      const total = await this.repo.countEventRatings(tx, { guildIdStr: guildInternalId });
      const totalPages = Math.max(1, Math.ceil(total / perPage));
      const safePage = Math.min(Math.max(page, 1), totalPages);
      const skip = (safePage - 1) * perPage;

      const list = await this.repo.getEventRatingsPage(tx, {
        guildInternalId,
        skip,
        take: perPage,
      });

      const description = this._buildDescription(list);

      return {
        total,
        totalPages,
        page: safePage,
        perPage,
        description,
      };
    });
  }

  async initializeSummary({ guildIdStr, guildName, discordUserId, username, eventName }) {
    return this.prisma.$transaction(async (tx) => {
      const { guildInternalId } = await this.guildUserRepo.createGuildUser(tx, {
        guildIdStr,
        guildName,
        discordUserId,
        username,
      });
      const summary = await this.repo.findOrCreateSummary(tx, {
        guildInternalId,
        eventName: eventName.trim(),
        createdBy: username,
      });

      return summary;
    });
  }
  
}

module.exports = EventRatingService;
