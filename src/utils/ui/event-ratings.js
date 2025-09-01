const { EmbedBuilder } = require("discord.js");
const { getEventRatingsBundle } = require("../../domain/eventRating.service");
const { makeCollector, parseCid, clamp, buildPagingRowGeneric } = require("./shared");

const PREFIX = "evrate";

function buildRatingsEmbed({ description, page, totalPages, total }) {
  return new EmbedBuilder()
    .setTitle("⭐ Eventos Rateados")
    .setDescription(description)
    .setFooter({ text: `Página ${page}/${totalPages} • Total eventos: ${total}` })
    .setColor(0x3498db)
    .setTimestamp(new Date());
}

function buildPagingRowRatings({ perPage, page, totalPages }) {
  return buildPagingRowGeneric(
    PREFIX,
    ["prev", page, perPage],
    ["next", page, perPage],
    page <= 1,
    page >= totalPages
  );
}

function attachEventRatingsPager({ message, interaction, ctx, meta, guildId, ttlMs = 60_000 }) {
  return makeCollector({
    message,
    interaction,
    prefix: PREFIX,
    ttlMs,
    onCollect: async (i) => {
      const parts = parseCid(i.customId, PREFIX, 3);
      if (!parts) return i.deferUpdate().catch(() => {});

      const [dir, pageStr, perStr] = parts;
      const per = Number(perStr);
      const cur = Number(pageStr);

      const nextPage = clamp(dir === "prev" ? cur - 1 : cur + 1, 1, meta.totalPages);

      try {
        const bundle = await getEventRatingsBundle({
          prisma: ctx.prisma,
          guildId,
          perPage: per,
          page: nextPage,
        });

        const newEmbed = buildRatingsEmbed({
          description: bundle.description,
          page: bundle.page,
          totalPages: bundle.totalPages,
          total: bundle.total,
        });

        const newRow = buildPagingRowRatings({
          perPage: per,
          page: bundle.page,
          totalPages: bundle.totalPages,
        });

        await i.update({
          embeds: [newEmbed],
          components: bundle.totalPages > 1 ? [newRow] : [],
        });
      } catch (error) {
        console.error("Error updating event ratings:", error);
        await i.deferUpdate().catch(() => {});
      }
    },
  });
}

module.exports = {
  buildRatingsEmbed,
  buildPagingRowRatings,
  attachEventRatingsPager,
};
