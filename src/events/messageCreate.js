const PREFIX = process.env.BOT_PREFIX || '!';

module.exports = {
  name: 'messageCreate',
  once: false,
  async execute(message, client) {
    if (message.author.bot) return;

    let content = message.content.replace(/^<@!?\d+>\s*/, '').trim();

    if (!content.startsWith(PREFIX)) return;

    const [name] = content.slice(PREFIX.length).trim().split(/\s+/);
    if (!name) return;

    const cmd = client.prefixCommands?.get(name.toLowerCase());
    if (!cmd) return;


    try {
      await cmd.execute(message, client);
    } catch (e) {
      console.error('[prefix] error:', e);
      await message.reply('❌ Error ejecutando el comando.');
    }
  },
};
