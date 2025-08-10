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

function parseOptionsList(raw) {
  if (!raw) return ['Yes', 'No'];
  const arr = raw.split(',').map(s => s.trim()).filter(Boolean);
  return arr.length >= 2 ? arr.slice(0, 10) : ['Yes', 'No']; // 2..10
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addquestion')
    .setDescription('Crea una pregunta y publica un Poll nativo en este canal.')
    .addIntegerOption(o => o.setName('eventid').setDescription('ID del evento existente').setRequired(true))
    .addStringOption(o => o.setName('text').setDescription('Texto de la pregunta').setRequired(true))
    .addIntegerOption(o => o.setName('points').setDescription('Puntos (default 1)'))
    .addStringOption(o => o.setName('options').setDescription('Opciones coma-separadas (2-10, máx 55 chars c/u)'))
    .addBooleanOption(o => o.setName('multi').setDescription('Permitir múltiples respuestas'))
    .addIntegerOption(o => o.setName('hours').setDescription('Duración del Poll en horas (1–768)'))
    .setDMPermission(false),

  async execute(interaction, ctx) {
    const canManage = interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild);
    if (!canManage) {
      return interaction.reply({ content: '⛔ Necesitas Manage Server.', flags: MessageFlags.Ephemeral });
    }
    const channel = interaction.channel;
    if (!channel || !channel.isTextBased?.()) {
      return interaction.reply({ content: '⛔ Este comando debe ejecutarse en un canal de texto del servidor.', flags: MessageFlags.Ephemeral });
    }

    const eventId = interaction.options.getInteger('eventid', true);
    const text    = interaction.options.getString('text', true).trim();
    const points  = interaction.options.getInteger('points') ?? 1;
    const options = parseOptionsList(interaction.options.getString('options'));
    const multi   = interaction.options.getBoolean('multi') ?? false;

    let hours = interaction.options.getInteger('hours') ?? 24;
    if (!Number.isInteger(hours) || hours < 1) hours = 24;
    if (hours > 768) hours = 768; 

    const displayName =
      interaction.member?.displayName ??
      interaction.user.globalName ??
      interaction.user.username;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const inputs = normalizeAddQuestionInput({ eventId, text, points });
    const { question, event } = await createQuestionForEvent({
      prisma: ctx.prisma,
      guildIdStr: interaction.guildId,
      guildName : interaction.guild?.name || 'Unknown',
      discordUserId: interaction.user.id,
      username: displayName,
      ...inputs,
    });

    let messageId = null;
    const pollPayload = {
      question: { text },                                 
      answers:  options.map(o => ({ text: o.slice(0, 55) })),
      allowMultiselect: Boolean(multi),
      duration: hours,                                  
    };

    const sent = await channel.send({ poll: pollPayload });
    messageId = sent.id;

    await attachQuestionMessage({
      prisma: ctx.prisma,
      questionId: question.id,
      messageId,
    });

    await interaction.editReply({
      content: [
        '✅ **Pregunta creada**',
        `• ID: **${question.id}**`,
        `• Poll publicado en <#${channel.id}> \`messageId=${messageId}\``,
        `• Puntos: **${question.points}**`,
      ].join('\n')
    });
  },
};
