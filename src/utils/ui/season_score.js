const { EmbedBuilder } = require('discord.js');
const { getSeasonRankingBundle } = require('../../domain/seasonScore.service');
const { makeCollector, parseCid, buildPagingRowGeneric } = require('./shared');

const PREFIX = 'ssrank'; 

function buildSeasonRankingEmbed({ season, description, page, totalPages, total }) {
  return new EmbedBuilder()
    .setTitle(`🏆 Ranking de la Season — ${season.name}`)
    .setDescription(description)
    .setFooter({ text: `Página ${page}/${totalPages} • Participantes: ${total}` })
    .setColor(0x2ECC71)
    .setTimestamp(new Date());
}

function buildPagingRowSeasonRank({ page, totalPages, perPage }) {
  return buildPagingRowGeneric(
    PREFIX,
    ['prev', page, perPage],
    ['next', page, perPage],
    page <= 1,
    page >= totalPages
  );
}

function attachSeasonRankingPager({ message, interaction, ctx, meta, ttlMs = 60_000 }) {
  return makeCollector({
    message, interaction, prefix: PREFIX, ttlMs,
    onCollect: async (i) => {
      const parts = parseCid(i.customId, PREFIX, 3);
      if (!parts) return i.deferUpdate().catch(() => {});
      const [dir, pageStr, perStr] = parts;
      const cur = Number(pageStr), per = Number(perStr);
      const next = dir === 'prev' ? cur - 1 : cur + 1;

      const bundle = await getSeasonRankingBundle({
        prisma: ctx.prisma,
        discordGuildIdStr: meta.guildId,
        guildName: meta.guildName,
        perPage: per,
        page: next,
      });

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
