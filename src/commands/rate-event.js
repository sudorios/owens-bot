const { SlashCommandBuilder } = require("discord.js");
const { prisma } = require("../lib/prisma.js");
const { ensureGuildAndUser } = require("../data/event.repo.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rate-event")
    .setDescription("Califica un evento con estrellas (1-5)")
    .addStringOption((opt) =>
      opt
        .setName("evento")
        .setDescription("Nombre del evento")
        .setRequired(true)
    ),
  async execute(interaction) {
    const eventLabel = interaction.options.getString("evento");

    const { guildInternalId } = await ensureGuildAndUser(prisma, {
      guildIdStr: interaction.guild.id,
      guildName: interaction.guild.name,
      discordUserId: "0",
      username: "bot",
    });

    const existingEvent = await prisma.eventRating.findFirst({
      where: { guildId: guildInternalId, event: eventLabel },
    });

    if (existingEvent) {
      return interaction.reply({
        content: `❌ El evento **${eventLabel}** ya fue creado.`,
        ephemeral: true,
      });
    }

    const msg = await interaction.reply({
      content: `⭐ Evento: **${eventLabel}**  
Reacciona con 1️⃣ - 5️⃣ para calificar.`,
      fetchReply: true,
    });

    const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"];
    for (const emoji of emojis) await msg.react(emoji);
  },
};
