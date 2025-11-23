const { EmbedBuilder } = require("discord.js");
const EventWinnerFacade = require("../../app/config/facade/eventWinner.facade");
const { makeCollector, parseCid, clamp, buildPagingRowGeneric } = require("./shared");

const PREFIX = "evwin";

function buildWinnersEmbed({ description, page, totalPages, total }) {
  return new EmbedBuilder()
    .setTitle(`🏅 Ganadores de Eventos`)
    .setDescription(description)
    .setFooter({ text: `Página ${page}/${totalPages} • Registros: ${total}` })
    .setColor(0x9b59b6)
    .setTimestamp();
}

function buildPagingRowWinners({ page, totalPages, perPage }) {
  return buildPagingRowGeneric(PREFIX, ["prev", page, perPage], ["next", page, perPage], page <= 1, page >= totalPages);
}

function attachEventWinnersPager({ message, interaction, ctx, meta, ttlMs = 60_000 }) {
  return makeCollector({
    message,
    interaction,
    prefix: PREFIX,
    ttlMs,
    onCollect: async (i) => {
      const parts = parseCid(i.customId, PREFIX, 3);
      if (!parts) return i.deferUpdate().catch(() => {});

      const [dir, pageStr, perStr] = parts;
      const cur = Number(pageStr);
      const per = Number(perStr);

      const nextPage = clamp(dir === "prev" ? cur - 1 : cur + 1, 1, meta.totalPages);

      const facade = new EventWinnerFacade(ctx.prisma);
      const bundle = await facade.getWinnersPage({
        guildIdStr: meta.guildIdStr,
        perPage: per,
        page: nextPage,
      });

      if (bundle.error) {
        return i.followUp({ content: "❌ Error cargando datos.", ephemeral: true });
      }

      const embed = buildWinnersEmbed({
        description: bundle.description,
        page: bundle.page,
        totalPages: bundle.totalPages,
        total: bundle.total,
      });

      const row = buildPagingRowWinners({
        page: bundle.page,
        totalPages: bundle.totalPages,
        perPage: per,
      });

      await i.update({
        embeds: [embed],
        components: bundle.totalPages > 1 ? [row] : [],
      });
    },
  });
}

module.exports = {
  buildWinnersEmbed,
  buildPagingRowWinners,
  attachEventWinnersPager,
};
