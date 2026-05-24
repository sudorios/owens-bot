const GuildUserRepository = require("../repository/guildUser.repo");
const GuildRepository = require("../../config/repository/guild.repo");

const MEDALS = ["🥇", "🥈", "🥉"];

class GuildRankingService {
  constructor(prisma) {
    this.prisma = prisma;
    this.repo = new GuildUserRepository(prisma);
    this.guildRepo = new GuildRepository(prisma);
  }

  _buildRankingText(list, page, perPage) {
    if (!list || list.length === 0) return "No hay puntuaciones globales todavía.";

    const startRank = (page - 1) * perPage + 1;

    return list
      .map((e, idx) => {
        const abs = startRank + idx;
        const tag = abs <= 3 ? MEDALS[abs - 1] : `#${abs}`;

        let mv = "•";
        if (e.last_position) {
          if (e.position < e.last_position) mv = `▲${e.last_position - e.position}`;
          else if (e.position > e.last_position) mv = `▼${e.position - e.last_position}`;
          else mv = "=";
        }

        const discordId = e.user_dc_id;
        const username = e.username || "Unknown";
        const mention = discordId ? `<@${discordId}>` : username;
        return `${tag} ${mention} — **${e.points}** pts ${mv}`;
      })
      .join("\n");
  }

  async getRankingPage({ guildIdStr, guildName, page = 1, perPage = 10 }) {
    return this.prisma.$transaction(async (tx) => {
      const guild = await this.guildRepo.findByDiscordId(tx, guildIdStr);

      if (!guild) {
        return { total: 0, totalPages: 0, rows: [] };
      }

      await this.repo.updateGuildPositions(tx, { guildInternalId: guild.id });

      const total = await this.repo.countGuildRanking(tx, { guildInternalId: guild.id });
      const totalPages = Math.max(1, Math.ceil(total / perPage));
      const safePage = Math.min(Math.max(page, 1), totalPages);
      const skip = (safePage - 1) * perPage;

      const list = await this.repo.getGuildRankingPage(tx, {
        guildInternalId: guild.id,
        skip,
        take: perPage,
      });

      const description = this._buildRankingText(list, safePage, perPage);

      return {
        guild,
        total,
        totalPages,
        page: safePage,
        perPage,
        list,
        description,
      };
    });
  }
}

module.exports = GuildRankingService;
