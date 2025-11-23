const EventRatingFacade = require("../../app/config/facade/eventRating.facade");
const MatchRatingFacade = require("../../app/config/facade/matchRating.facade");
module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        console.warn(`⚠️ Comando no encontrado: ${interaction.commandName}`);
        return;
      }
      try {
        await command.execute(interaction, client.ctx);
      } catch (error) {
        console.error(`❌ Error ejecutando ${interaction.commandName}:`, error);

        const errorMsg = {
          content: "❌ Hubo un error al ejecutar este comando.",
          ephemeral: true,
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMsg).catch(() => {});
        } else {
          await interaction.reply(errorMsg).catch(() => {});
        }
      }
      return;
    }

    if (interaction.isButton()) {
      const customId = interaction.customId;

      const prisma = client.ctx?.prisma || interaction.client.ctx?.prisma;
      if (!prisma) {
        return interaction.reply({ content: "❌ Error interno: BD no disponible.", ephemeral: true });
      }

      if (customId.startsWith("rate:")) {
        try {
          const [prefix, summaryIdStr, ratingStr] = customId.split(":");
          const rating = Number(ratingStr);
          const summaryId = Number(summaryIdStr);

          await interaction.deferReply({ ephemeral: true });

          const facade = new EventRatingFacade(prisma);

          const summary = await prisma.event_rating.findUnique({
            where: { event_rating_id: summaryId },
          });

          if (!summary) {
            return interaction.editReply("❌ Este evento ya no existe en la base de datos.");
          }

          const res = await facade.registerButtonVote({
            guildIdStr: interaction.guild.id,
            guildName: interaction.guild.name,
            discordUserId: interaction.user.id,
            username: interaction.user.username,
            eventName: summary.event,
            rating: rating,
          });

          if (res.error) {
            return interaction.editReply(`❌ Error: ${res.message}`);
          }

          await interaction.editReply({
            content: `✅ **¡Voto Guardado!**\nLe diste **${rating} ⭐** a **${summary.event}**.\n📊 Promedio actual del servidor: **${res.data.newAverage}**`,
          });
        } catch (err) {
          console.error("🔥 Error en botón rate:", err);
          await interaction.editReply({ content: "❌ Error procesando tu voto." }).catch(() => {});
        }
      }

      if (customId.startsWith("ratematch:")) {
        try {
          const [prefix, summaryIdStr, ratingStr] = customId.split(":");
          const rating = Number(ratingStr);
          const summaryId = Number(summaryIdStr);

          await interaction.deferReply({ ephemeral: true });

          const facade = new MatchRatingFacade(prisma);

          const summary = await prisma.match_rating.findUnique({
            where: { match_rating_id: summaryId },
          });

          if (!summary) {
            return interaction.editReply("❌ Esta lucha ya no existe en la BD.");
          }

          const res = await facade.registerButtonVote({
            guildIdStr: interaction.guild.id,
            guildName: interaction.guild.name,
            discordUserId: interaction.user.id,
            username: interaction.user.username,
            summaryId: summaryId,
            matchName: summary.match,
            rating: rating,
          });

          if (res.error) {
            return interaction.editReply(`❌ Error: ${res.message}`);
          }

          await interaction.editReply({
            content: `✅ **¡Voto Guardado!**\nLe diste **${rating} ⭐** a **${summary.match}**.\n📊 Promedio actual: **${res.data.newAverage}**`,
          });
        } catch (err) {
          console.error("🔥 Error ratematch:", err);
          await interaction.editReply({ content: "❌ Error procesando voto." }).catch(() => {});
        }
      }
    }
  },
};
