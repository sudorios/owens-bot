const { SlashCommandBuilder } = require("discord.js");
const EventFacade = require("../facade/event.facade");

const {
  buildEventInfoTable,
  buildEventInfoEmbed,
  attachEventInfoPager,
  buildPagingRowEventInfo,
} = require("../../../utils/ui/event");

const PER_PAGE = 10;
const COLLECTOR_MS = 60_000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("event-info")
    .setDescription("Muestra una tabla con los eventos de la season activa."),
  async execute(interaction, ctx) {
    if (!ctx?.prisma) {
      return interaction.reply({ content: "❌ Error interno: Base de datos no disponible.", ephemeral: true });
    }
    await interaction.deferReply();
    const guildId = interaction.guildId;
    const guildName = interaction.guild?.name || "Unknown";
    const perPage = PER_PAGE;
    const facade = new EventFacade(ctx.prisma);
    const bundle = await facade.getEventsPage({
      guildIdStr: guildId,
      guildName,
      perPage,
      page: 1,
    });
    if (!bundle.season) {
      return interaction.editReply({
        content: "ℹ️ No hay una season activa en este servidor.",
      });
    }
    const table = buildEventInfoTable(bundle.rows);
    const embed = buildEventInfoEmbed({
      season: bundle.season,
      table,
      page: bundle.page,
      totalPages: bundle.totalPages,
      total: bundle.total,
    });
    const components =
      bundle.totalPages > 1
        ? [
            buildPagingRowEventInfo({
              page: bundle.page,
              totalPages: bundle.totalPages,
              perPage,
            }),
          ]
        : [];
    const msg = await interaction.editReply({ embeds: [embed], components });
    if (bundle.totalPages > 1) {
      attachEventInfoPager({
        message: msg,
        interaction,
        ctx,
        meta: {
          totalPages: bundle.totalPages,
          perPage,
          guildId,
          guildName,
          page: bundle.page,
        },
        ttlMs: COLLECTOR_MS,
      });
    }
  },
};
