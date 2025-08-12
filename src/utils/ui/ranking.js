const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getEventRankingBundle } = require('../../domain/eventScore.service'); 
const { getEventInfoBundle }   = require('../../domain/event.service');


function makeCollector({ message, interaction, prefix, ttlMs = 60_000, onCollect, onEnd }) {
  const filter = (i) => i.user.id === interaction.user.id && i.message.id === message.id && i.customId.startsWith(prefix + ':');
  const collector = message.createMessageComponentCollector({ filter, time: ttlMs });

  collector.on('collect', onCollect);
  collector.on('end', onEnd ?? (async () => {
    try { await message.edit({ components: [] }); } catch {}
  }));
  return collector;
}

function buildRankingEmbed({ event, description, page, totalPages, total }) {
  return new EmbedBuilder()
    .setTitle(`🏆 Ranking del Evento #${event.id}${event.name ? ` — ${event.name}` : ''}`)
    .setDescription(description)
    .setFooter({ text: `Página ${page}/${totalPages} • Participantes: ${total}` })
    .setColor(0xF1C40F)
    .setTimestamp(new Date());
}

function cidRank({ dir, eventId, perPage, page }) {
  return `evrank:${dir}:${eventId}:${perPage}:${page}`;
}

function parseCidRank(id) {
  const parts = id.split(':');
  if (parts.length !== 5 || parts[0] !== 'evrank') return null;
  const [_, dir, evStr, perStr, pStr] = parts;
  return { dir, eventId: Number(evStr), perPage: Number(perStr), page: Number(pStr) };
}

function buildPagingRowRank({ eventId, perPage, page, totalPages }) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(cidRank({ dir: 'prev', eventId, perPage, page }))
      .setLabel('◀️ Anterior')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 1),
    new ButtonBuilder()
      .setCustomId(cidRank({ dir: 'next', eventId, perPage, page }))
      .setLabel('Siguiente ▶️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages)
  );
}

function attachEventRankingPager({ message, interaction, ctx, meta, ttlMs = 60_000 }) {
  return makeCollector({
    message, interaction, prefix: 'evrank', ttlMs,
    onCollect: async (i) => {
      const parsed = parseCidRank(i.customId);
      if (!parsed) return i.deferUpdate().catch(() => {});
      const nextPage = Math.min(Math.max(parsed.dir === 'prev' ? parsed.page - 1 : parsed.page + 1, 1), meta.totalPages);

      const bundle = await getEventRankingBundle({
        prisma: ctx.prisma,
        eventId: parsed.eventId,
        perPage: parsed.perPage,
        page: nextPage,
      });

      const newEmbed = buildRankingEmbed({
        event: bundle.event,
        description: bundle.description,
        page: bundle.page,
        totalPages: bundle.totalPages,
        total: bundle.total,
      });

      const newRow = buildPagingRowRank({
        eventId: parsed.eventId,
        perPage: parsed.perPage,
        page: bundle.page,
        totalPages: bundle.totalPages,
      });

      await i.update({ embeds: [newEmbed], components: bundle.totalPages > 1 ? [newRow] : [] });
    },
  });
}

function pad(str, len) {
  const s = String(str ?? '');
  return s.length >= len ? s.slice(0, len) : s + ' '.repeat(len - s.length);
}

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

function cidInfo({ dir, page, perPage }) {
  return `evinfo:${dir}:${page}:${perPage}`;
}

function parseCidInfo(id) {
  const parts = id.split(':');
  if (parts.length !== 4 || parts[0] !== 'evinfo') return null;
  const [_, dir, pStr, perStr] = parts;
  return { dir, page: Number(pStr), perPage: Number(perStr) };
}

function buildPagingRowInfo({ page, totalPages, perPage }) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(cidInfo({ dir: 'prev', page, perPage }))
      .setLabel('◀️ Anterior')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 1),
    new ButtonBuilder()
      .setCustomId(cidInfo({ dir: 'next', page, perPage }))
      .setLabel('Siguiente ▶️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages)
  );
}

function attachEventInfoPager({ message, interaction, ctx, meta, ttlMs = 60_000 }) {
  return makeCollector({
    message, interaction, prefix: 'evinfo', ttlMs,
    onCollect: async (i) => {
      const parsed = parseCidInfo(i.customId);
      if (!parsed) return i.deferUpdate().catch(() => {});
      const nextPage = Math.min(Math.max(parsed.dir === 'prev' ? parsed.page - 1 : parsed.page + 1, 1), meta.totalPages);

      const bundle = await getEventInfoBundle({
        prisma: ctx.prisma,
        discordGuildIdStr: meta.guildId,
        guildName: meta.guildName,
        perPage: parsed.perPage,
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
      const row = buildPagingRowInfo({ page: bundle.page, totalPages: bundle.totalPages, perPage: parsed.perPage });

      await i.update({ embeds: [embed], components: bundle.totalPages > 1 ? [row] : [] });
    },
  });
}

module.exports = {
  makeCollector,

  buildRankingEmbed,
  buildPagingRowRank,
  attachEventRankingPager,

  buildEventInfoTable,
  buildEventInfoEmbed,
  buildPagingRowInfo,
  attachEventInfoPager,
};
