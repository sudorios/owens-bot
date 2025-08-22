const { EmbedBuilder } = require('discord.js');
const { getEventWinnersBundle } = require('../../domain/eventWinner.service');
const { makeCollector, parseCid, clamp, buildPagingRowGeneric } = require('./shared');

const PREFIX = 'evwinners';

function buildWinnersEmbed({ description, page, totalPages, total }) {
  return new EmbedBuilder()
    .setTitle('🏅 Ganadores de Eventos')
    .setDescription(description)
    .setFooter({ text: `Página ${page}/${totalPages} • Ganadores: ${total}` })
    .setColor(0x2ECC71)
    .setTimestamp(new Date());
}

function buildPagingRowWinners({ guildInternalId, perPage, page, totalPages }) {
  return buildPagingRowGeneric(
    PREFIX,
    ['prev', guildInternalId, perPage, page],
    ['next', guildInternalId, perPage, page],
    page <= 1,
    page >= totalPages
  );
}


function attachEventWinnersPager({ message, interaction, ctx, meta, ttlMs = 60_000 }) {
  return makeCollector({
    message,
    interaction,
    prefix: PREFIX,
    ttlMs,
    onCollect: async (i) => {
      const parts = parseCid(i.customId, PREFIX, 4);
      if (!parts) return i.deferUpdate().catch(() => {});
      const [dir, guildStr, perStr, pageStr] = parts;
      const guildInternalId = Number(guildStr), per = Number(perStr), cur = Number(pageStr);

      const nextPage = clamp(dir === 'prev' ? cur - 1 : cur + 1, 1, meta.totalPages);

      const bundle = await getEventWinnersBundle({
        prisma: ctx.prisma,
        guildInternalId,
        perPage: per,
        page: nextPage,
      });

      const newEmbed = buildWinnersEmbed({
        description: bundle.description,
        page: bundle.page,
        totalPages: bundle.totalPages,
        total: bundle.total,
      });

      const newRow = buildPagingRowWinners({
        guildInternalId,
        perPage: per,
        page: bundle.page,
        totalPages: bundle.totalPages,
      });

      await i.update({ 
        embeds: [newEmbed], 
        components: bundle.totalPages > 1 ? [newRow] : [] 
      });
    },
  });
}

module.exports = {
  buildWinnersEmbed,
  buildPagingRowWinners,
  attachEventWinnersPager,
};
