const path = require("path");
const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : ".env";
require("dotenv").config({ path: path.resolve(process.cwd(), envFile) });


const { Client, REST, Routes } = require("discord.js");
const { intents } = require("./config/intents");
const loadEvents = require("./config/loaders/eventLoader");

const { loadCommands } = require("./config/loaders/commandRegistry");

const { prisma } = require("./config/lib/prisma");

const client = new Client({ intents });
client.ctx = { prisma };

const commandsJson = loadCommands(client);

async function maybeRegisterCommands() {
  if (process.env.REGISTER_COMMANDS_ON_START !== "true") return;
  const appId = process.env.CLIENT_ID;
  if (!appId) {
    console.error("❌ Falta CLIENT_ID en .env para registrar comandos.");
    return;
  }
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  try {
    if (process.env.GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(appId, process.env.GUILD_ID), { body: commandsJson });
      console.log(`✅ Slash commands registrados en guild ${process.env.GUILD_ID}`);
    } else {
      await rest.put(Routes.applicationCommands(appId), { body: commandsJson });
      console.log("Slash commands registrados globalmente (propagación ~1h).");
    }
  } catch (err) {
    console.error("❌ Error registrando slash commands:", err);
  }
}

loadEvents(client);

process.on("SIGINT", async () => {
  try {
    await prisma.$disconnect();
  } catch {}
  client.destroy();
  process.exit(0);
});

// Manejo Global de Errores para que el bot no se apague (Crash)
process.on("unhandledRejection", (reason, promise) => {
  console.error("🚨 [Anti-Crash] Promesa rechazada no manejada:", promise, "Razón:", reason);
});

process.on("uncaughtException", (err, origin) => {
  console.error("🚨 [Anti-Crash] Excepción no atrapada:", err, "Origen:", origin);
});

process.on("uncaughtExceptionMonitor", (err, origin) => {
  console.error("🚨 [Anti-Crash] Monitor de excepción:", err, "Origen:", origin);
});

(async () => {
  try {
    await client.login(process.env.DISCORD_TOKEN);
    await maybeRegisterCommands();
  } catch (err) {
    console.error("❌ Error al iniciar el bot:", err);
    process.exit(1);
  }
})();
