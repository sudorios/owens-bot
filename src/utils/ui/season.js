const { EmbedBuilder } = require('discord.js');
const { getSeasonInfoBundle }  = require('../../domain/season.service');    
const { pad, makeCollector, parseCid, clamp, buildPagingRowGeneric } = require('./shared');

const SS_PREFIX = 'ssinfo';

function buildSeasonTable(rows) {
  const headers = [ pad('ID', 6), pad('Nombre', 28), pad('Active', 6) ];
  const sep = '-'.repeat(44);
  const lines = rows.map(r => [
    pad(r.id, 6),
    pad(r.name ?? '-', 28),
    pad(r.active ? 'Yes' : 'No', 6),
  ].join('  '));
  return '```text\n' + headers.join('  ') + '\n' + sep + '\n' + (lines.join('\n') || 'Sin seasons') + '\n```';
}

function buildSeasonListEmbed({ guild, table, page, totalPages, total }) {
  return new EmbedBuilder()
    .setTitle(`📚 Seasons del servidor — ${guild.name}`)
    .setDescription(table)
    .setFooter({ text: `Página ${page}/${totalPages} • Total seasons: ${total}` })
    .setColor(0x8E44AD)
    .setTimestamp(new Date());
}

function buildPagingRowSeason({ page, totalPages, perPage }) {
  return buildPagingRowGeneric(
    SS_PREFIX,
    ['prev', page, perPage],
    ['next', page, perPage],
    page <= 1,
    page >= totalPages
  );
}

function attachSeasonInfoPager({ message, interaction, ctx, meta, ttlMs = 60_000 }) {
  return makeCollector({
    message, interaction, prefix: SS_PREFIX, ttlMs,
    onCollect: async (i) => {
      const parts = parseCid(i.customId, SS_PREFIX, 3);
      if (!parts) return i.deferUpdate().catch(() => {});
      const [dir, pageStr, perStr] = parts;
      const cur = Number(pageStr), per = Number(perStr);
      const nextPage = clamp(dir === 'prev' ? cur - 1 : cur + 1, 1, meta.totalPages);

      const bundle = await getSeasonInfoBundle({
        prisma: ctx.prisma,
        discordGuildIdStr: meta.guildId,
        guildName: meta.guildName,
        perPage: per,
        page: nextPage,
      });

      const table = buildSeasonTable(bundle.rows);
      const embed = buildSeasonListEmbed({
        guild: bundle.guild,
        table,
        page: bundle.page,
        totalPages: bundle.totalPages,
        total: bundle.total,
      });
      const row = buildPagingRowSeason({
        page: bundle.page,
        totalPages: bundle.totalPages,
        perPage: per,
      });

      await i.update({ embeds: [embed], components: bundle.totalPages > 1 ? [row] : [] });
    },
  });
}

module.exports = {
  buildSeasonTable,
  buildSeasonListEmbed,
  buildPagingRowSeason,
  attachSeasonInfoPager,
};