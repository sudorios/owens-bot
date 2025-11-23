const { EmbedBuilder } = require("discord.js");
const EventRankingFacade = require("../../app/core/facade/eventRanking.facade");
const { makeCollector, parseCid, clamp, buildPagingRowGeneric } = require("./shared");

const PREFIX = "evrank";

function buildRankingEmbed({ event, description, page, totalPages, total }) {
  const titleName = event.name || `#${event.id || event.event_id}`;

  return new EmbedBuilder()
    .setTitle(`🏆 Ranking del Evento: ${titleName}`)
    .setDescription(description)
    .setFooter({ text: `Página ${page}/${totalPages} • Participantes: ${total}` })
    .setColor(0xf1c40f)
    .setTimestamp(new Date());
}

function buildPagingRowRank({ eventId, perPage, page, totalPages }) {
  return buildPagingRowGeneric(
    PREFIX,
    ["prev", eventId, page, perPage],
    ["next", eventId, page, perPage],
    page <= 1,
    page >= totalPages
  );
}

function attachEventRankingPager({ message, interaction, ctx, meta, ttlMs = 60_000 }) {
  return makeCollector({
    message,
    interaction,
    prefix: PREFIX,
    ttlMs,
    onCollect: async (i) => {
      const parts = parseCid(i.customId, PREFIX, 4);
      if (!parts) return i.deferUpdate().catch(() => {});

      const [dir, evStr, pageStr, perStr] = parts;
      const ev = Number(evStr);
      const per = Number(perStr);
      const cur = Number(pageStr);

      const nextPage = clamp(dir === "prev" ? cur - 1 : cur + 1, 1, meta.totalPages || 999);

      const facade = new EventRankingFacade(ctx.prisma);
      const bundle = await facade.getRankingPage({
        eventId: ev,
        perPage: per,
        page: nextPage,
      });

      if (!bundle || !bundle.event) {
        return i.followUp({ content: "❌ Error cargando datos.", ephemeral: true });
      }

      const newEmbed = buildRankingEmbed({
        event: bundle.event,
        description: bundle.description,
        page: bundle.page,
        totalPages: bundle.totalPages,
        total: bundle.total,
      });

      const newRow = buildPagingRowRank({
        eventId: ev,
        perPage: per,
        page: bundle.page,
        totalPages: bundle.totalPages,
      });

      await i.update({
        embeds: [newEmbed],
        components: bundle.totalPages > 1 ? [newRow] : [],
      });
    },
  });
}

module.exports = {
  buildRankingEmbed,
  buildPagingRowRank,
  attachEventRankingPager,
};
