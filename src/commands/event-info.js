const { SlashCommandBuilder } = require('discord.js');
const {
  getEventInfoFirstPage,
} = require('../domain/event.service');

const {
  buildEventInfoTable,
  buildEventInfoEmbed,
  buildPagingRowInfo,
  attachEventInfoPager,
} = require('../utils/ui/ranking');

const PER_PAGE = 10;        
const COLLECTOR_MS = 60_000; 

module.exports = {
  data: new SlashCommandBuilder()
    .setName('event-info')
    .setDescription('Muestra una tabla con los eventos de la season activa.')
    .setDMPermission(false),

  async execute(interaction, ctx) {
    await interaction.deferReply(); 

    const guildId = interaction.guildId;
    const guildName = interaction.guild?.name || 'Unknown';
    const perPage = PER_PAGE;

    const bundle = await getEventInfoFirstPage({
      prisma: ctx.prisma,
      discordGuildIdStr: guildId,
      guildName,
      perPage,
    });

    if (!bundle.season) {
      return interaction.editReply({
        content: 'ℹ️ No hay una season activa en este servidor.',
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
        ? [buildPagingRowInfo({ page: bundle.page, totalPages: bundle.totalPages, perPage })]
        : [];

    const msg = await interaction.editReply({ embeds: [embed], components });

    if (bundle.totalPages > 1) {
      attachEventInfoPager({
        message: msg,
        interaction,
        ctx,
        meta: { totalPages: bundle.totalPages, perPage, guildId, guildName },
        ttlMs: COLLECTOR_MS,
      });
    }
  },
};
