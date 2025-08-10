const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require('discord.js');

const {
  normalizeAddQuestionInput,
  createQuestionForEvent,
  attachQuestionMessage,
} = require('../domain/question.service');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addquestion')
    .setDescription('Crea una pregunta y publica un Poll nativo en este canal.')
    .addIntegerOption(o => o.setName('eventid').setDescription('ID del evento existente').setRequired(true))
    .addStringOption(o => o.setName('text').setDescription('Texto de la pregunta').setRequired(true))
    .addIntegerOption(o => o.setName('points').setDescription('Puntos (default 1)'))
    .addStringOption(o => o.setName('options').setDescription('Opciones coma-separadas (2-10, máx 55 chars c/u)'))
    .addIntegerOption(o => o.setName('hours').setDescription('Duración del Poll en horas (1–768)'))
    .setDMPermission(false),

  async execute(interaction, ctx) {
    const canManage = interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild);
    if (!canManage) {
      return interaction.reply({ content: '⛔ Necesitas Manage Server.', flags: MessageFlags.Ephemeral });
    }

    const channel = interaction.channel;
    if (!channel || !channel.isTextBased?.()) {
      return interaction.reply({ content: '⛔ Ejecuta este comando en un canal de texto del servidor.', flags: MessageFlags.Ephemeral });
    }

    const eventId = interaction.options.getInteger('eventid', true);
    const text    = interaction.options.getString('text', true).trim();
    const points  = interaction.options.getInteger('points') ?? 1;
    const options = interaction.options.getString('options') || null;
    const hours   = interaction.options.getInteger('hours') ?? 24;

    const displayName =
      interaction.member?.displayName ??
      interaction.user.globalName ??
      interaction.user.username;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const norm = normalizeAddQuestionInput({ eventId, text, points, options, hours });
    const { question } = await createQuestionForEvent({
      prisma: ctx.prisma,
      guildIdStr: interaction.guildId,
      guildName : interaction.guild?.name || 'Unknown',
      discordUserId: interaction.user.id,
      username: displayName,
      ...norm,
    });

    const pollPayload = {
      question: { text: norm.text },
      answers:  norm.options.map(o => ({ text: o })),
      allowMultiselect: false,
      duration: norm.pollDurationHours,            
    };

    const sent = await channel.send({ poll: pollPayload });

    await attachQuestionMessage({
      prisma: ctx.prisma,
      questionId: question.id,
      messageId: sent.id,
      channelId: channel.id,
    });

    await interaction.editReply({
      content: [
        '✅ **Pregunta creada**',
        `• ID: **${question.id}**`,
        `• Poll publicado en <#${channel.id}> \`messageId=${sent.id}\``,
        `• Puntos: **${question.points}**`,
        `• Cierre: ${norm.pollDurationHours}h`,
      ].join('\n')
    });
  },
};
