const { SlashCommandBuilder } = require('discord.js');
const { getEventWinnersBundle } = require('../service/eventWinner.service');
const { getInternalGuildId } = require('../repository/guild.repo');
const { buildWinnersEmbed, buildPagingRowWinners, attachEventWinnersPager } = require('../../../utils/ui/event_winners');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('event-winners')
    .setDescription('Muestra el ranking de ganadores de eventos')
    .addIntegerOption(opt =>
      opt.setName('pagina')
        .setDescription('Número de página (opcional)')
        .setMinValue(1)
    ),

  async execute(interaction, { prisma }) {
    await interaction.deferReply();

    const discordGuildId = interaction.guildId ? BigInt(interaction.guildId) : null;
    if (!discordGuildId) {
      return interaction.editReply('❌ No se pudo identificar el servidor.');
    }

    let guildInternalId;
    try {
      guildInternalId = await getInternalGuildId(prisma, discordGuildId);
    } catch (err) {
      console.error(err);
      return interaction.editReply('❌ Este servidor no está registrado en la base de datos.');
    }

    const perPage = 10;
    const requestedPage = interaction.options.getInteger('pagina') ?? 1;

    const bundle = await getEventWinnersBundle({
      prisma,
      guildInternalId,
      perPage,
      page: requestedPage,
    });

    const embed = buildWinnersEmbed({
      description: bundle.description,
      page: bundle.page,
      totalPages: bundle.totalPages,
      total: bundle.total,
    });

    const row = bundle.totalPages > 1
      ? buildPagingRowWinners({
          guildInternalId,
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
        ctx: { prisma },
        meta: bundle,
      });
    }
  },
};
