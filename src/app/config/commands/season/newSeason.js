const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const SeasonFacade = require('../../facade/season.facade');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('newseason')
    .setDescription('Crea una nueva temporada y cierra la actual (si existe).')
    .addStringOption(o =>
      o.setName('nombre')
        .setDescription('Nombre de la nueva temporada')
        .setRequired(false)
    ),

  async execute(interaction, ctx) {
    const canManage = interaction.memberPermissions?.has(
      PermissionFlagsBits.ManageGuild
    );

    if (!canManage) {
      return interaction.reply({
        content: '⛔ Necesitas el permiso **Manage Server**.',
        flags: MessageFlags.Ephemeral,
      });
    }
    const requestedName = interaction.options.getString('nombre') || null;
    const guildName = interaction.guild?.name || 'Unknown';
    const createdBy = interaction.user.tag; 
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const facade = new SeasonFacade(ctx.prisma);
    const response = await facade.startNewSeason({
      guildId: interaction.guildId,
      guildName,
      requestedName,
      createdBy
    });
    const { closedSeason, newSeason } = response.data;
    let msg =
      `✅ **Nueva temporada creada**\n` +
      `• Nombre: **${newSeason.name}**\n` +
      `• Inicio: <t:${Math.floor(newSeason.start_date.getTime() / 1000)}:F>\n` +
      `• Activa: **${newSeason.active ? 'Sí' : 'No'}**`;
    if (closedSeason) {
      msg +=
        `\n\n🛑 **Temporada cerrada**\n` +
        `• Nombre: **${closedSeason.name}**\n` +
        `• Fin: <t:${Math.floor(closedSeason.end_date.getTime() / 1000)}:F>\n` +
        `• Activa: **${closedSeason.active ? 'Sí' : 'No'}**`;
    }
    await interaction.editReply({ content: msg });
  },
};