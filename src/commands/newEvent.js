const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { createNewEvent } = require('../domain/event.service');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('newevent')
    .setDescription('Crea un nuevo evento en este servidor.')
    .addStringOption(o => o.setName('name').setDescription('Nombre del evento').setRequired(true))
    .addStringOption(o => o.setName('state').setDescription('Estado inicial')
      .addChoices({ name: 'draft', value: 'draft' }, { name: 'open', value: 'open' }, { name: 'closed', value: 'closed' })
    )
    .setDMPermission(false),
  async execute(interaction, ctx) {
    const canManage = interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild);
    if (!canManage) {
      return interaction.reply({ content: '⛔ Necesitas Manage Server.', flags: MessageFlags.Ephemeral });
    }

    const name  = interaction.options.getString('name', true).trim();
    const state = interaction.options.getString('state') || 'draft';

    const displayName =
      interaction.member?.displayName ??
      interaction.user.globalName ??
      interaction.user.username;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const event = await createNewEvent({
      prisma: ctx.prisma,
      guildIdStr: interaction.guildId,
      guildName : interaction.guild?.name || 'Unknown',
      discordUserId: interaction.user.id,
      username: displayName,             
      name,
      state,
    });

    await interaction.editReply({
      content: [
        '✅ **Evento creado**',
        `• Nombre: **${event.name}**`,
        `• Creado: <t:${Math.floor(new Date(event.createdAt).getTime()/1000)}:F>`,
      ].join('\n')
    });
  },
};