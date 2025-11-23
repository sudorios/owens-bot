module.exports = {
  name: 'ready',
  async execute(client) {
    console.log(`Bot conectado como ${client.user.tag}`);
  },
};
