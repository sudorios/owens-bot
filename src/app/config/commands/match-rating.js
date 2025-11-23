const { SlashCommandBuilder } = require("discord.js");
const MatchRatingFacade = require("../facade/matchRating.facade");

const {
  buildRatingsEmbed,
  buildPagingRowRatings,
  attachMatchRatingsPager,
} = require("../../../utils/ui/match-ratings.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("match-ratings")
    .setDescription("Muestra las luchas calificadas en este servidor")
    .addIntegerOption((opt) =>
      opt
        .setName("por-pagina")
        .setDescription("Cantidad de luchas por página (default: 5)")
        .setMinValue(1)
        .setMaxValue(20)
    ),

  async execute(interaction, ctx) {
    if (!ctx?.prisma) return interaction.reply("❌ Error DB.");

    await interaction.deferReply();

    try {
      const perPage = interaction.options.getInteger("por-pagina") || 5;
      
      const facade = new MatchRatingFacade(ctx.prisma);

      const bundle = await facade.getRatingsBundle({
        guildIdStr: interaction.guild.id,
        guildName: interaction.guild.name,
        discordUserId: interaction.user.id,
        username: interaction.user.username,
        page: 1,
        perPage,
      });

      if (bundle.total === 0) {
        if (bundle.error) console.error(bundle.description);
        return interaction.editReply("ℹ️ Aún no hay luchas calificadas en este servidor.");
      }

      const embed = buildRatingsEmbed({
        description: bundle.description,
        page: bundle.page,
        totalPages: bundle.totalPages,
        total: bundle.total,
      });

      const row = buildPagingRowRatings({
        perPage,
        page: bundle.page,
        totalPages: bundle.totalPages,
      });

      const reply = await interaction.editReply({
        embeds: [embed],
        components: bundle.totalPages > 1 ? [row] : [],
      });

      if (bundle.totalPages > 1) {
        attachMatchRatingsPager({
          message: reply,
          interaction,
          ctx,
          meta: bundle,
          guildIdStr: interaction.guild.id, 
        });
      }
    } catch (err) {
      console.error("[/match-ratings] ERROR:", err);
      await interaction.editReply("❌ Ocurrió un error al mostrar las luchas calificadas.");
    }
  },
};