const { EmbedBuilder } = require('discord.js');
const { getGuildRankingBundle } = require('../../domain/guildUser.service');
const { makeCollector, parseCid, buildPagingRowGeneric } = require('./shared');

const PREFIX = 'grank'; 

function buildGuildRankingEmbed({ guild, description, page, totalPages, total }) {
  return new EmbedBuilder()
    .setTitle(`🌐 Ranking Global — ${guild.name}`)
    .setDescription(description)
    .setFooter({ text: `Página ${page}/${totalPages} • Participantes: ${total}` })
    .setColor(0x1ABC9C)
    .setTimestamp(new Date());
}

function buildPagingRowGuildRank({ page, totalPages, perPage }) {
  return buildPagingRowGeneric(
    PREFIX,
    ['prev', page, perPage],
    ['next', page, perPage],
    page <= 1,
    page >= totalPages
  );
}

function attachGuildRankingPager({ message, interaction, ctx, meta, ttlMs = 60_000 }) {
  return makeCollector({
    message, interaction, prefix: PREFIX, ttlMs,
    onCollect: async (i) => {
      const parts = parseCid(i.customId, PREFIX, 3);
      if (!parts) return i.deferUpdate().catch(() => {});
      const [dir, pageStr, perStr] = parts;
      const cur = Number(pageStr), per = Number(perStr);
      const next = dir === 'prev' ? cur - 1 : cur + 1;

      const bundle = await getGuildRankingBundle({
        prisma: ctx.prisma,
        discordGuildIdStr: meta.guildId,
        guildName: meta.guildName,
        perPage: per,
        page: next,
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
