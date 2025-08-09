require('dotenv').config();

const { Client, REST, Routes } = require('discord.js');
const { intents } = require('./config/intents');                  
const loadEvents = require('./loaders/eventLoader');             
const { loadSlashCommands } = require('./loaders/commandRegistry');
const { prisma } = require('./lib/prisma');                      

const client = new Client({ intents });

client.ctx = { prisma };

const commandsJson = loadSlashCommands(client);

async function maybeRegisterCommands() {
  if (process.env.REGISTER_COMMANDS_ON_START !== 'true') return;
  const appId = process.env.CLIENT_ID;
  if (!appId) {
    console.error('❌ Falta CLIENT_ID en .env para registrar comandos.');
    return;
  }

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    if (process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(appId, process.env.GUILD_ID),
        { body: commandsJson }
      );
      console.log(`✅ Slash commands registrados en guild ${process.env.GUILD_ID}`);
    } else {
      await rest.put(Routes.applicationCommands(appId), { body: commandsJson });
      console.log('🌍 Slash commands registrados globalmente (propagación ~1h).');
    }
  } catch (err) {
    console.error('❌ Error registrando slash commands:', err);
  }
}

loadEvents(client);

client.once('ready', () => {
  console.log(`🤖 Bot conectado como ${client.user.tag}`);
});

process.on('SIGINT', async () => {
  try { await prisma.$disconnect(); } catch {}
  client.destroy();
  process.exit(0);
});

(async () => {
  try {
    await client.login(process.env.DISCORD_TOKEN);
    await maybeRegisterCommands();
  } catch (err) {
    console.error('❌ Error al iniciar el bot:', err);
    process.exit(1);
  }
})();
