const MatchRatingRepository = require("../repository/matchRating.repo");
const GuildUserRepository = require("../../core/repository/guildUser.repo");

class MatchRatingService {
  constructor(prisma) {
    this.prisma = prisma;
    this.repo = new MatchRatingRepository(prisma);
    this.guildUserRepo = new GuildUserRepository(prisma);
  }

  async initializeSummary({ guildIdStr, guildName, discordUserId, username, matchName }) {
    return this.prisma.$transaction(async (tx) => {
      const { guildInternalId } = await this.guildUserRepo.createGuildUser(tx, {
        guildIdStr,
        guildName,
        discordUserId,
        username,
      });

      return await this.repo.findOrCreateSummary(tx, {
        guildInternalId,
        matchName: matchName.trim(),
        createdBy: username,
      });
    });
  }

  async rateMatch({ guildIdStr, guildName, discordUserId, username, matchName, rating, summaryId }) {
    const score = Number(rating);

    return this.prisma.$transaction(async (tx) => {
      const { guildInternalId, userInternalId } = await this.guildUserRepo.createGuildUser(tx, {
        guildIdStr,
        guildName,
        discordUserId,
        username,
      });

      let targetSummaryId = summaryId;

      if (!targetSummaryId) {
        const summary = await this.repo.findOrCreateSummary(tx, {
          guildInternalId,
          matchName: matchName.trim(),
          createdBy: username,
        });
        targetSummaryId = summary.match_rating_id;
      }

      await this.repo.upsertDetail(tx, {
        summaryId: targetSummaryId,
        userInternalId,
        rating: score,
        createdBy: username,
      });

      const updated = await this.repo.updateAverage(tx, targetSummaryId);

      return {
        matchName: updated.match,
        newAverage: Number(updated.rating).toFixed(2),
        userRating: score,
      };
    });
  }

  _buildDescription(list) {
    if (!list || list.length === 0) return "No hay luchas calificadas en este servidor.";

    return list
      .map((m) => {
        const stars = "⭐".repeat(Math.round(Number(m.rating)));
        return `**${m.matchName}**\n📊 Rating: **${m.rating}** ${stars}\n📅 ${m.date.toLocaleDateString()}`;
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

      const total = await this.repo.countMatchRatings(tx, { guildInternalId });
      const totalPages = Math.max(1, Math.ceil(total / perPage));
      const safePage = Math.min(Math.max(page, 1), totalPages);
      const skip = (safePage - 1) * perPage;

      const list = await this.repo.getMatchRatingsPage(tx, {
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
  
}

module.exports = MatchRatingService;
