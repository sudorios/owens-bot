const { SlashCommandBuilder } = require('discord.js');
const { getGuildRankingFirstPage } = require('../domain/guildUser.service');
const { buildGuildRankingEmbed, buildPagingRowGuildRank, attachGuildRankingPager } = require('../utils/ui/ranking');

const PER_PAGE = 10;
const COLLECTOR_MS = 60_000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ranking')
    .setDescription('Muestra el ranking global del servidor.')
    .setDMPermission(false),

  async execute(interaction, ctx) {
    await interaction.deferReply(); 

    const guildId = interaction.guildId;
    const guildName = interaction.guild?.name || 'Unknown';
    const perPage = PER_PAGE;

    const bundle = await getGuildRankingFirstPage({
      prisma: ctx.prisma,
      discordGuildIdStr: guildId,
      guildName,
      perPage,
    });

    if (bundle.total === 0) {
      return interaction.editReply({ content: 'ℹ️ Aún no hay puntos en el ranking global.' });
    }

    const embed = buildGuildRankingEmbed({
      guild: bundle.guild,
      description: bundle.description,
      page: bundle.page,
      totalPages: bundle.totalPages,
      total: bundle.total,
    });

    const components =
      bundle.totalPages > 1
        ? [buildPagingRowGuildRank({ page: bundle.page, totalPages: bundle.totalPages, perPage })]
        : [];

    const msg = await interaction.editReply({ embeds: [embed], components });

    if (bundle.totalPages > 1) {
      attachGuildRankingPager({
        message: msg,
        interaction,
        ctx,
        meta: { totalPages: bundle.totalPages, perPage, guildId, guildName },
        ttlMs: COLLECTOR_MS,
      });
    }
  },
};
