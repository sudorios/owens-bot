const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const EventFacade = require("../facade/event.facade");
const { generateWinnerBanner } = require("../../../utils/ui/banner");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("close-event")
    .setDescription("Finaliza un evento y muestra el banner del ganador")
    .addIntegerOption((o) =>
      o.setName("eventid")
        .setDescription("ID del evento a finalizar")
        .setRequired(true)
    ),

  async execute(interaction, ctx) {
    if (!ctx?.prisma) return interaction.reply("❌ Error DB.");
    
    await interaction.deferReply();
    const eventId = interaction.options.getInteger("eventid", true);
    
    const facade = new EventFacade(ctx.prisma);
    const res = await facade.closeEvent(eventId);
    
    if (res.error) {
      return interaction.editReply(`❌ Error al finalizar evento: ${res.message}`);
    }
    
    const { event, winner, alreadyClosed } = res.data;
    
    if (!winner) {
      const msg = alreadyClosed
        ? `✅ El evento **${event.name}** (ID: ${event.id}) ya estaba finalizado.\nNo hubo ganadores (nadie obtuvo puntaje).`
        : `✅ El evento **${event.name}** (ID: ${event.id}) ha sido finalizado.\nNo hubo ganadores (nadie obtuvo puntaje).`;
      return interaction.editReply(msg);
    }
    
    // Crear imagen de banner extrayendo la lógica a un template
    const attachment = await generateWinnerBanner(event, winner, interaction);
    
    const titleText = alreadyClosed 
      ? `🎉 ¡Recordando al Ganador: ${event.name}! 🎉`
      : `🎉 ¡Evento Finalizado: ${event.name}! 🎉`;
      
    const descText = alreadyClosed
      ? `Este evento ya había concluido. ¡Nuevamente felicitaciones a **${winner.username}** por su victoria con **${winner.points} puntos**! 🥳`
      : `El evento ha concluido oficialmente. ¡Felicitaciones a **${winner.username}** por coronarse como el ganador indiscutible con **${winner.points} puntos**! 🥳`;
    
    const embed = new EmbedBuilder()
      .setTitle(titleText)
      .setDescription(descText)
      .setColor(0xFBBF24)
      .setImage('attachment://winner-banner.png')
      .setFooter({ text: 'Owens Bot' })
      .setTimestamp();
      
    return interaction.editReply({ embeds: [embed], files: [attachment] });
  },
};
