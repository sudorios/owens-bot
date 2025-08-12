const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getSeasonInfoBundle } = require('../../domain/season.service');

function pad(str, len) {
  const s = String(str ?? '');
  return s.length >= len ? s.slice(0, len) : s + ' '.repeat(len - s.length);
}

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

function cid({ dir, page, perPage }) {
  return `ssinfo:${dir}:${page}:${perPage}`;
}
function parseCid(id) {
  const parts = id.split(':');
  if (parts.length !== 4 || parts[0] !== 'ssinfo') return null;
  const [_, dir, pStr, perStr] = parts;
  return { dir, page: Number(pStr), perPage: Number(perStr) };
}

function buildPagingRow({ page, totalPages, perPage }) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(cid({ dir: 'prev', page, perPage }))
      .setLabel('◀️ Anterior')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 1),
    new ButtonBuilder()
      .setCustomId(cid({ dir: 'next', page, perPage }))
      .setLabel('Siguiente ▶️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages)
  );
}

function attachSeasonInfoPager({ message, interaction, ctx, meta, ttlMs = 60_000 }) {
  const filter = (i) => i.user.id === interaction.user.id && i.message.id === message.id && i.customId.startsWith('ssinfo:');
  const collector = message.createMessageComponentCollector({ filter, time: ttlMs });

  collector.on('collect', async (i) => {
    const parsed = parseCid(i.customId);
    if (!parsed) return i.deferUpdate().catch(() => {});
    const next = parsed.dir === 'prev' ? parsed.page - 1 : parsed.page + 1;
    const page = Math.min(Math.max(next, 1), meta.totalPages);

    const bundle = await getSeasonInfoBundle({
      prisma: ctx.prisma,
      discordGuildIdStr: meta.guildId,
      guildName: meta.guildName,
      perPage: parsed.perPage,
      page,
    });

    const table = buildSeasonTable(bundle.rows);
    const embed = buildSeasonListEmbed({
      guild: bundle.guild,
      table,
      page: bundle.page,
      totalPages: bundle.totalPages,
      total: bundle.total,
    });
    const row = buildPagingRow({ page: bundle.page, totalPages: bundle.totalPages, perPage: parsed.perPage });

    await i.update({ embeds: [embed], components: bundle.totalPages > 1 ? [row] : [] });
  });

  collector.on('end', async () => {
    try { await message.edit({ components: [] }); } catch {}
  });
}

module.exports = {
  buildSeasonTable,
  buildSeasonListEmbed,
  buildPagingRow,
  attachSeasonInfoPager,
};
