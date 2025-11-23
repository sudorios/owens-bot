const { SlashCommandBuilder } = require("discord.js");
const EventWinnerFacade = require("../facade/eventWinner.facade");
const {
  buildWinnersEmbed,
  buildPagingRowWinners,
  attachEventWinnersPager,
} = require("../../../utils/ui/event_winners");

const PER_PAGE = 10;
const COLLECTOR_MS = 60_000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("event-winners")
    .setDescription("Muestra el ranking de ganadores de eventos")
    .addIntegerOption((opt) => opt.setName("pagina").setDescription("Número de página (opcional)").setMinValue(1)),

  async execute(interaction, ctx) {
    if (!ctx?.prisma) return interaction.reply("❌ Error DB.");

    await interaction.deferReply();

    const guildIdStr = interaction.guildId;
    const perPage = PER_PAGE;
    const requestedPage = interaction.options.getInteger("pagina") ?? 1;

    const facade = new EventWinnerFacade(ctx.prisma);

    const bundle = await facade.getWinnersPage({
      guildIdStr,
      perPage,
      page: requestedPage,
    });

    if (bundle.total === 0) {
      if (bundle.error) console.error(bundle.description);
      return interaction.editReply("ℹ️ No hay ganadores registrados en este servidor.");
    }

    const embed = buildWinnersEmbed({
      description: bundle.description,
      page: bundle.page,
      totalPages: bundle.totalPages,
      total: bundle.total,
    });

    const row =
      bundle.totalPages > 1
        ? buildPagingRowWinners({
            perPage,
            page: bundle.page,
            totalPages: bundle.totalPages,
          })
        : null;

    const msg = await interaction.editReply({
      embeds: [embed],
      components: row ? [row] : [],
    });

    if (row) {
      attachEventWinnersPager({
        message: msg,
        interaction,
        ctx,
        meta: {
          guildIdStr,
          totalPages: bundle.totalPages,
        },
        ttlMs: COLLECTOR_MS,
      });
    }
  },
};
