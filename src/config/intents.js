const { GatewayIntentBits } = require('discord.js');

module.exports.intents = [
  GatewayIntentBits.Guilds,
  // GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildMessageReactions,
  GatewayIntentBits.GuildMessagePolls,
  GatewayIntentBits.MessageContent,
  GatewayIntentBits.GuildMessages,
];
