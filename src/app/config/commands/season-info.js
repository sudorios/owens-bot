const { SlashCommandBuilder } = require("discord.js");
const SeasonFacade = require("../facade/season.facade");
const { PrismaClient } = require("@prisma/client");
const { DateUtil } = require("../../../utils/DateUtil");

const prisma = new PrismaClient();
const seasonFacade = new SeasonFacade(prisma);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("season-info")
    .setDescription("Muestra la season activa del servidor."),

  async execute(interaction) {
    await interaction.deferReply();

    const guildId = interaction.guildId;
    const result = await seasonFacade.getActiveSeason({ guildId });

    if (result.error) {
      return interaction.editReply(`❌ ${result.message}`);
    }

    if (!result.data) {
      return interaction.editReply(
        `ℹ️ No hay una season activa en este servidor todavía.`
      );
    }

    const season = result.data;

    return interaction.editReply(
      ` **Season activa:** ${season.name}\nInicio: ${DateUtil.format(
        season.start_date
      )}`
    );
  },
};
