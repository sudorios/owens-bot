const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getEventRankingBundle } = require('../../domain/eventScore.service');

function buildRankingEmbed({ event, description, page, totalPages, total }) {
  return new EmbedBuilder()
    .setTitle(`🏆 Ranking del Evento #${event.id}${event.name ? ` — ${event.name}` : ''}`)
    .setDescription(description)
    .setFooter({ text: `Página ${page}/${totalPages} • Participantes: ${total}` })
    .setColor(0xF1C40F)
    .setTimestamp(new Date());
}

function cid({ dir, eventId, perPage, page }) {
  return `evrank:${dir}:${eventId}:${perPage}:${page}`;
}

function buildPagingRow({ eventId, perPage, page, totalPages }) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(cid({ dir: 'prev', eventId, perPage, page }))
      .setLabel('◀️ Anterior')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 1),
    new ButtonBuilder()
      .setCustomId(cid({ dir: 'next', eventId, perPage, page }))
      .setLabel('Siguiente ▶️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages)
  );
}

function parseCid(id) {
  const parts = id.split(':');
  if (parts.length !== 5 || parts[0] !== 'evrank') return null;
  const [_, dir, evStr, perStr, pStr] = parts;
  return { dir, eventId: Number(evStr), perPage: Number(perStr), page: Number(pStr) };
}

function attachEventRankingPager({ message, ctx, meta, ttlMs = 60_000 }) {
  const filter = (i) => i.user.id === meta.invokerId && i.message.id === message.id && i.customId.startsWith('evrank:');
  const collector = message.createMessageComponentCollector({ filter, time: ttlMs });

  collector.on('collect', async (i) => {
    const parsed = parseCid(i.customId);
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

    const newRow = buildPagingRow({
      eventId: parsed.eventId,
      perPage: parsed.perPage,
      page: bundle.page,
      totalPages: bundle.totalPages,
    });

    await i.update({ embeds: [newEmbed], components: [newRow] });
  });

  collector.on('end', async () => {
    try { await message.edit({ components: [] }); } catch {}
  });
}

module.exports = {
  buildRankingEmbed,
  buildPagingRow,
  attachEventRankingPager,
};
