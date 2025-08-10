// src/commands/newSeason.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { startNewSeason } = require('../domain/season.service');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('newseason')
    .setDescription('Crea una nueva temporada y cierra la actual (si existe).')
    .addStringOption(o =>
      o.setName('nombre').setDescription('Nombre de la nueva temporada').setRequired(false)
    )
    .setDMPermission(false),
  async execute(interaction, ctx) {
    const canManage = interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild);
    if (!canManage) {
      return interaction.reply({
        content: '⛔ Necesitas el permiso **Manage Server**.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const requestedName = interaction.options.getString('nombre') || null;
    const guildName = interaction.guild?.name || 'Unknown';

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const { closedSeason, newSeason } = await startNewSeason({
      prisma: ctx.prisma,
      guildId: interaction.guildId, 
      guildName,
      requestedName,
    });

    let msg =
      `✅ **Nueva temporada creada**\n` +
      `• Nombre: **${newSeason.name}**\n` +
      `• Inicio: <t:${Math.floor(newSeason.startDate.getTime()/1000)}:F>\n` +
      `• Activa: **${newSeason.active ? 'Sí' : 'No'}**`;

    if (closedSeason) {
      msg +=
        `\n\n🛑 **Temporada cerrada**\n` +
        `• Nombre: **${closedSeason.name}**\n` +
        `• Fin: <t:${Math.floor(closedSeason.endDate.getTime()/1000)}:F>\n` +
        `• Activa: **${closedSeason.active ? 'Sí' : 'No'}**`;
    }

    await interaction.editReply({ content: msg });
  },
};
