const { EmbedBuilder } = require('discord.js');
const { getEventInfoBundle }   = require('../../domain/event.service');        
const { pad, makeCollector,  parseCid, clamp, buildPagingRowGeneric } = require('./shared');

const EV_PREFIX = 'evinfo';

function buildEventInfoTable(rows) {
  const headers = [ pad('ID', 6), pad('Nombre', 30) ];
  const sep = '-'.repeat(40);
  const lines = rows.map(r => [ pad(r.id, 6), pad(r.name ?? '-', 30) ].join('  '));
  return '```text\n' + headers.join('  ') + '\n' + sep + '\n' + (lines.join('\n') || 'Sin eventos') + '\n```';
}

function buildEventInfoEmbed({ season, table, page, totalPages, total }) {
  return new EmbedBuilder()
    .setTitle(`📅 Eventos de la Season Activa — ${season.name}`)
    .setDescription(table)
    .setFooter({ text: `Página ${page}/${totalPages} • Total eventos: ${total}` })
    .setColor(0x3498DB)
    .setTimestamp(new Date());
}

function buildPagingRowEventInfo({ page, totalPages, perPage }) {
  return buildPagingRowGeneric(
    EV_PREFIX,
    ['prev', page, perPage],
    ['next', page, perPage],
    page <= 1,
    page >= totalPages
  );
}

function attachEventInfoPager({ message, interaction, ctx, meta, ttlMs = 60_000 }) {
  return makeCollector({
    message, interaction, prefix: EV_PREFIX, ttlMs,
    onCollect: async (i) => {
      const parts = parseCid(i.customId, EV_PREFIX, 3);
      if (!parts) return i.deferUpdate().catch(() => {});
      const [dir, pageStr, perStr] = parts;
      const cur = Number(pageStr), per = Number(perStr);
      const nextPage = clamp(dir === 'prev' ? cur - 1 : cur + 1, 1, meta.totalPages);

      const bundle = await getEventInfoBundle({
        prisma: ctx.prisma,
        discordGuildIdStr: meta.guildId,
        guildName: meta.guildName,
        perPage: per,
        page: nextPage,
      });

      const table = buildEventInfoTable(bundle.rows);
      const embed = buildEventInfoEmbed({
        season: bundle.season,
        table,
        page: bundle.page,
        totalPages: bundle.totalPages,
        total: bundle.total,
      });
      const row = buildPagingRowEventInfo({
        page: bundle.page,
        totalPages: bundle.totalPages,
        perPage: per,
      });

      await i.update({ embeds: [embed], components: bundle.totalPages > 1 ? [row] : [] });
    },
  });
}

module.exports = { buildEventInfoTable,  buildEventInfoEmbed, buildPagingRowEventInfo, attachEventInfoPager,}