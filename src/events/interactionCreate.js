module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    const cmd = client.commands?.get(interaction.commandName);
    if (!cmd) {
      return interaction.reply({ content: 'Comando no encontrado.', ephemeral: true });
    }

    try {
      await cmd.execute(interaction, client.ctx); 
    } catch (err) {
      console.error(err);
      const msg = '❌ Ocurrió un error ejecutando el comando.';
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: msg, ephemeral: true });
      } else {
        await interaction.reply({ content: msg, ephemeral: true });
      }
    }
  },
};
