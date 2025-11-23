const { SlashCommandBuilder } = require("discord.js");
const EventRatingFacade = require("../facade/eventRating.facade");

const {
  buildRatingsEmbed,
  buildPagingRowRatings,
  attachEventRatingsPager,
} = require("../../../utils/ui/event-ratings.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("event-ratings")
    .setDescription("Muestra los eventos rateados en este servidor"),

  async execute(interaction, ctx) {
    if (!ctx?.prisma) return interaction.reply("❌ Error DB.");

    await interaction.deferReply();

    try {
      const facade = new EventRatingFacade(ctx.prisma);
      const bundle = await facade.getRatingsBundle({
        guildIdStr: interaction.guild.id,
        guildName: interaction.guild.name,
        discordUserId: interaction.user.id,
        username: interaction.user.username,
        page: 1,
        perPage: 5,
      });

      if (bundle.error) {
        return interaction.editReply(`❌ Error: ${bundle.message || "No se pudieron cargar los ratings."}`);
      }

      const embed = buildRatingsEmbed({
        description: bundle.description,
        page: bundle.page,
        totalPages: bundle.totalPages,
        total: bundle.total,
      });

      const row = buildPagingRowRatings({
        perPage: 5,
        page: bundle.page,
        totalPages: bundle.totalPages,
      });

      const reply = await interaction.editReply({
        embeds: [embed],
        components: bundle.totalPages > 1 ? [row] : [],
      });

      if (bundle.totalPages > 1) {
        attachEventRatingsPager({
          message: reply,
          interaction,
          ctx,
          meta: bundle,
          guildIdStr: interaction.guild.id,
        });
      }
    } catch (err) {
      console.error("[/event-ratings] ERROR:", err);
      await interaction.editReply("❌ Ocurrió un error crítico al mostrar los ratings.");
    }
  },
};
