const { EmbedBuilder } = require("discord.js");
const SeasonRankingFacade = require("../../app/core/facade/seasonRanking.facade");
const { makeCollector, parseCid, buildPagingRowGeneric } = require("./shared");

const PREFIX = "ssrank";

function buildSeasonRankingEmbed({ season, description, page, totalPages, total }) {
  return new EmbedBuilder()
    .setTitle(`🏆 Ranking de la Season — ${season.name}`)
    .setDescription(description)
    .setFooter({ text: `Página ${page}/${totalPages} • Participantes: ${total}` })
    .setColor(0x2ecc71)
    .setTimestamp(new Date());
}

function buildPagingRowSeasonRank({ page, totalPages, perPage }) {
  return buildPagingRowGeneric(PREFIX, ["prev", page, perPage], ["next", page, perPage], page <= 1, page >= totalPages);
}

function attachSeasonRankingPager({ message, interaction, ctx, meta, ttlMs = 60_000 }) {
  return makeCollector({
    message,
    interaction,
    prefix: PREFIX,
    ttlMs,
    onCollect: async (i) => {
      const parts = parseCid(i.customId, PREFIX, 3);
      if (!parts) return i.deferUpdate().catch(() => {});

      const [dir, pageStr, perStr] = parts;
      const cur = Number(pageStr);
      const per = Number(perStr);

      let next = dir === "prev" ? cur - 1 : cur + 1;
      if (meta.totalPages) next = Math.min(Math.max(next, 1), meta.totalPages);

      const facade = new SeasonRankingFacade(ctx.prisma);

      const bundle = await facade.getRankingPage({
        guildIdStr: meta.guildId,
        guildName: meta.guildName,
        perPage: per,
        page: next,
      });

      if (!bundle || !bundle.season) {
        return i.followUp({ content: "❌ La season ya no está activa.", ephemeral: true });
      }

      const embed = buildSeasonRankingEmbed({
        season: bundle.season,
        description: bundle.description,
        page: bundle.page,
        totalPages: bundle.totalPages,
        total: bundle.total,
      });

      const row = buildPagingRowSeasonRank({
        page: bundle.page,
        totalPages: bundle.totalPages,
        perPage: per,
      });

      await i.update({ embeds: [embed], components: bundle.totalPages > 1 ? [row] : [] });
    },
  });
}

module.exports = {
  buildSeasonRankingEmbed,
  buildPagingRowSeasonRank,
  attachSeasonRankingPager,
};
