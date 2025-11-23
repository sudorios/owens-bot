const SeasonScoreRepository = require("../repository/seasonScore.repo");
const SeasonRepository = require("../../config/repository/season.repo");
const GuildRepository = require("../../config/repository/guild.repo");

const MEDALS = ["🥇", "🥈", "🥉"];

class SeasonRankingService {
  constructor(prisma) {
    this.prisma = prisma;
    this.scoreRepo = new SeasonScoreRepository(prisma);
    this.seasonRepo = new SeasonRepository(prisma);
    this.guildRepo = new GuildRepository(prisma);
  }

  _buildRankingText(list, page, perPage) {
    if (!list || list.length === 0) return "No hay puntuaciones en esta temporada todavía.";

    const startRank = (page - 1) * perPage + 1;

    return list
      .map((e, idx) => {
        const abs = startRank + idx;
        const tag = abs <= 3 ? MEDALS[abs - 1] : `#${abs}`;

        let mv = "•";
        if (e.lastPosition) {
          if (e.position < e.lastPosition) mv = `▲${e.lastPosition - e.position}`;
          else if (e.position > e.lastPosition) mv = `▼${e.position - e.lastPosition}`;
          else mv = "=";
        }

        const discordId = e.discordId;
        const username = e.username || "Unknown";
        const mention = discordId ? `<@${discordId}>` : username;

        return `${tag} ${mention} — **${e.points}** pts ${mv}`;
      })
      .join("\n");
  }

  async getRankingPage({ guildIdStr, page = 1, perPage = 10 }) {
    return this.prisma.$transaction(async (tx) => {
      const guildInternalId = await this.guildRepo.getInternalGuildId(tx, guildIdStr);
      if (!guildInternalId) {
        return { season: null, error: "Guild no registrada" };
      }
      const activeSeason = await this.seasonRepo.findActiveSeasonByGuild(guildInternalId);
      if (!activeSeason) {
        return { season: null };
      }
      await this.scoreRepo.updateSeasonPositions(tx, {
        seasonId: activeSeason.season_id,
        guildInternalId: guildInternalId,
      });
      const total = await this.scoreRepo.countSeasonRanking(tx, {
        seasonId: activeSeason.season_id,
        guildInternalId: guildInternalId,
      });
      const totalPages = Math.max(1, Math.ceil(total / perPage));
      const safePage = Math.min(Math.max(page, 1), totalPages);
      const list = await this.scoreRepo.getSeasonRankingPage(tx, {
        seasonId: activeSeason.season_id,
        guildInternalId: guildInternalId,
        page: safePage,
        perPage,
      });

      const description = this._buildRankingText(list, safePage, perPage);

      return {
        season: activeSeason,
        total,
        totalPages,
        page: safePage,
        perPage,
        description,
      };
    });
  }
}

module.exports = SeasonRankingService;
