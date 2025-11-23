const { EmbedBuilder } = require("discord.js");
const GuildRankingFacade = require("../../app/core/facade/guildRanking.facade");
const { makeCollector, parseCid, clamp, buildPagingRowGeneric } = require("./shared");

const RANK_PREFIX = "grank";

function buildGuildRankingEmbed({ guild, description, page, totalPages, total }) {
  return new EmbedBuilder()
    .setTitle(`🏆 Ranking Global: ${guild.name}`)
    .setDescription(description)
    .setColor(0xffd700)
    .setFooter({ text: `Página ${page}/${totalPages} • Top ${total} miembros` })
    .setTimestamp();
}

function buildPagingRowGuildRank({ page, totalPages, perPage }) {
  return buildPagingRowGeneric(
    RANK_PREFIX,
    ["prev", page, perPage],
    ["next", page, perPage],
    page <= 1,
    page >= totalPages
  );
}

function attachGuildRankingPager({ message, interaction, ctx, meta, ttlMs = 60_000 }) {
  return makeCollector({
    message,
    interaction,
    prefix: RANK_PREFIX,
    ttlMs,
    onCollect: async (i) => {
      const parts = parseCid(i.customId, RANK_PREFIX, 3);
      if (!parts) return i.deferUpdate().catch(() => {});

      const [dir, pageStr, perStr] = parts;
      const cur = Number(pageStr),
        per = Number(perStr);
      const nextPage = clamp(dir === "prev" ? cur - 1 : cur + 1, 1, meta.totalPages);

      const facade = new GuildRankingFacade(ctx.prisma);

      const bundle = await facade.getRankingPage({
        guildIdStr: meta.guildId,
        guildName: meta.guildName,
        page: nextPage,
        perPage: per,
      });

      const embed = buildGuildRankingEmbed({
        guild: bundle.guild,
        description: bundle.description,
        page: bundle.page,
        totalPages: bundle.totalPages,
        total: bundle.total,
      });

      const row = buildPagingRowGuildRank({
        page: bundle.page,
        totalPages: bundle.totalPages,
        perPage: per,
      });

      await i.update({ embeds: [embed], components: bundle.totalPages > 1 ? [row] : [] });
    },
  });
}

module.exports = {
  buildGuildRankingEmbed,
  buildPagingRowGuildRank,
  attachGuildRankingPager,
};
