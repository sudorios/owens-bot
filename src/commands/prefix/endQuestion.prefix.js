module.exports = {
  data: { name: 'endquestion', type: 'prefix' },
  async execute(msg) {
    const refId = msg.reference?.messageId;
    if (!refId) return msg.reply('⚠️ Debes responder al mensaje del bot.');

    const refMsg = await msg.channel.messages.fetch(refId).catch(() => null);
    if (!refMsg || refMsg.author?.id !== msg.client.user?.id) {
      return msg.reply('⚠️ El mensaje referenciado no es del bot.');
    }

    console.log(`messageId detectado: ${refMsg.id}`);
    //return msg.reply('✅ messageId detectado (ver consola).');
  },
};
