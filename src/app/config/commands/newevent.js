const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

const EventFacade = require("../facade/event.facade");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("newevent")
    .setDescription("Crea un nuevo evento en este servidor.")
    .addStringOption(o =>
      o.setName("name").setDescription("Nombre del evento").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("state")
        .setDescription("Estado inicial")
        .addChoices(
          { name: "draft", value: "draft" },
          { name: "open", value: "open" },
          { name: "closed", value: "closed" },
        )
    ),

  async execute(interaction, ctx) {
    console.log("🔥 Command triggered: /newevent");

    if (!ctx?.prisma) {
      return interaction.reply("❌ No se recibió prisma en el contexto.");
    }

    const canManage = interaction.memberPermissions?.has(
      PermissionFlagsBits.ManageGuild
    );

    if (!canManage) {
      return interaction.reply({
        content: "⛔ Requieres permiso de `Manage Server`.",
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const facade = new EventFacade(ctx.prisma);

    const res = await facade.createEvent({
      guildIdStr: interaction.guildId,
      guildName: interaction.guild.name,
      discordUserId: interaction.user.id,
      username: interaction.user.username,
      name: interaction.options.getString("name"),
      state: interaction.options.getString("state") || "draft",
    });

    if (res.error) {
      return interaction.editReply(`❌ Error: ${res.message}`);
    }

    return interaction.editReply(
      `✅ Evento creado: **${res.data.name}**`
    );
  },
};
