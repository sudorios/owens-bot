const { SlashCommandBuilder } = require("discord.js");
const SeasonRankingFacade = require("../facade/seasonRanking.facade");
const {
  buildSeasonRankingEmbed,
  buildPagingRowSeasonRank,
  attachSeasonRankingPager,
} = require("../../../utils/ui/season_score");

const PER_PAGE = 10;
const COLLECTOR_MS = 60_000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("season-ranking")
    .setDescription("Muestra el ranking de la season activa en este servidor."),

  async execute(interaction, ctx) {
    if (!ctx?.prisma) return interaction.reply("❌ Error DB.");
    await interaction.deferReply();

    const guildId = interaction.guildId;
    const guildName = interaction.guild?.name || "Unknown";
    const perPage = PER_PAGE;

    const facade = new SeasonRankingFacade(ctx.prisma);

    const bundle = await facade.getRankingPage({
      guildIdStr: guildId,
      guildName,
      page: 1,
      perPage,
    });

    if (!bundle.season) {
      return interaction.editReply({ content: "ℹ️ No hay una season activa en este servidor." });
    }

    const embed = buildSeasonRankingEmbed({
      season: bundle.season,
      description: bundle.description,
      page: bundle.page,
      totalPages: bundle.totalPages,
      total: bundle.total,
    });

    const components =
      bundle.totalPages > 1
        ? [buildPagingRowSeasonRank({ page: bundle.page, totalPages: bundle.totalPages, perPage })]
        : [];

    const msg = await interaction.editReply({ embeds: [embed], components });

    if (bundle.totalPages > 1) {
      attachSeasonRankingPager({
        message: msg,
        interaction,
        ctx,
        meta: { totalPages: bundle.totalPages, perPage, guildId, guildName },
        ttlMs: COLLECTOR_MS,
      });
    }
  },
};
