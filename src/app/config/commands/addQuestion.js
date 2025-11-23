const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const QuestionFacade = require("../facade/question.facade");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addquestion")
    .setDescription("Crea una pregunta y publica un Poll nativo.")
    .addIntegerOption((o) => o.setName("eventid").setDescription("ID del evento existente").setRequired(true))
    .addStringOption((o) => o.setName("text").setDescription("Texto de la pregunta").setRequired(true))
    .addIntegerOption((o) => o.setName("points").setDescription("Puntos (default 1)"))
    .addStringOption((o) => o.setName("options").setDescription("Opciones separadas por coma (Ej: Si, No)"))
    .addIntegerOption((o) => o.setName("hours").setDescription("Duración en horas (1-768)")),

  async execute(interaction, ctx) {
    
    if (!ctx?.prisma) return interaction.reply("❌ Error DB.");

    const canManage = interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild);
    if (!canManage) return interaction.reply({ content: "⛔ Necesitas Manage Server.", flags: MessageFlags.Ephemeral });

    const channel = interaction.channel;
    if (!channel || !channel.isTextBased?.())
      return interaction.reply({ content: "⛔ Canal inválido.", flags: MessageFlags.Ephemeral });

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const eventId = interaction.options.getInteger("eventid", true);
    const text = interaction.options.getString("text", true);
    const points = interaction.options.getInteger("points");
    const optionsRaw = interaction.options.getString("options");
    const hours = interaction.options.getInteger("hours");
    const username = interaction.user.username;
    const facade = new QuestionFacade(ctx.prisma);

    const res = await facade.createQuestion({
      guildIdStr: interaction.guildId,
      guildName: interaction.guild?.name,
      discordUserId: interaction.user.id,
      username,
      eventId,
      text,
      points,
      options: optionsRaw,
      hours,
    });

    if (res.error) {
      return interaction.editReply(`❌ Error: ${res.message}`);
    }

    const { question, normalized } = res.data;

    const pollPayload = {
      question: { text: normalized.text },
      answers: normalized.options.map((o) => ({ text: o })),
      allowMultiselect: false,
      duration: normalized.pollDurationHours,
    };

    try {
      const sent = await channel.send({ poll: pollPayload });

      await facade.attachMessage({
        questionId: question.question_id,
        messageId: sent.id,
        channelId: channel.id,
      });

      await interaction.editReply({
        content: [
          "✅ **Pregunta creada**",
          `• ID: **${question.question_id}**`,
          `• Poll publicado: <#${channel.id}>`,
          `• Puntos: **${question.points}**`,
          `• Cierre: ${normalized.pollDurationHours}h`,
        ].join("\n"),
      });
    } catch (error) {
      console.error("Error enviando Poll:", error);
      return interaction.editReply("❌ Error al publicar el Poll en Discord. ¿Tengo permisos?");
    }
  },
};
