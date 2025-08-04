require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const createCommands = require('./commands');
const Calificacion = require('./models/Calificacion');
const connectDB = require('./db');
const quinielas = new Map();
const apuestas = new Map();
const resultados = new Map();

connectDB();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessagePolls
    ]
});

const commands = createCommands(quinielas, apuestas, resultados);
const prefix = process.env.PREFIX || '?';

client.once('ready', () => {
    console.log(`✅ Bot conectado como ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (commands[command]) {
        try {
            await commands[command](message);
        } catch (err) {
            console.error(`❌ Error in command ?${command}:`, err);
            message.reply('❌ There was an error executing that command.');
        }
    } else {
        message.reply(`❌ Command \`?${command}\` not recognized. Use \`!help\` to see the list of available commands.`);
    }
});

client.on('messagePollVoteAdd', async (answer, userId) => {
    try {
      const quinielaData = [...quinielas.values()].find(([q]) =>
        q.opciones.some((o) => o.text === answer.text)
      );
  
      if (!quinielaData) {
        console.warn(`⚠️ No se encontró la quiniela para el voto por "${answer.text}"`);
        return;
      }
  
      const quiniela = quinielaData[0];
      const mensajeID = quiniela.mensajeID;
  
      if (!apuestas.has(mensajeID)) apuestas.set(mensajeID, new Map());
      apuestas.get(mensajeID).set(userId, answer.text);
  
      console.log(`🗳️ ${userId} votó por "${answer.text}" en ${mensajeID}`);
    } catch (err) {
      console.error('❌ Error al procesar voto:', err);
    }
  });
  


client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;

    try {
        if (reaction.partial) await reaction.fetch();
        if (reaction.message.partial) await reaction.message.fetch();

        const { message } = reaction;

        if (message.author.id !== client.user.id) return;

        const combates = [...quinielas.values()].flat();
        const esCombate = combates.find(c => c.mensajeID === message.id);
        if (esCombate) {
            const todas = message.reactions.cache.filter(r => r.users.cache.has(user.id));
            if (todas.size > 1) {
                for (const r of todas.values()) {
                    if (r.emoji.name !== reaction.emoji.name) {
                        await r.users.remove(user.id);
                    }
                }
            }
            const votos = apuestas.get(message.id);
            if (votos) votos.set(user.id, reaction.emoji.name);
        }

        const calificacion = await Calificacion.findOne({ mensajeID: message.id });
        if (calificacion) {
            const validEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
            if (!validEmojis.includes(reaction.emoji.name)) return;

            for (const r of message.reactions.cache.values()) {
                if (r.emoji.name !== reaction.emoji.name && r.users.cache.has(user.id)) {
                    await r.users.remove(user.id);
                }
            }

            const valor = validEmojis.indexOf(reaction.emoji.name) + 1;

            const votoExistenteIndex = calificacion.votos.findIndex(v => v.userID === user.id);
            if (votoExistenteIndex !== -1) {
                calificacion.votos[votoExistenteIndex].calificacion = valor;
            } else {
                calificacion.votos.push({ userID: user.id, calificacion: valor });
            }
            await calificacion.save();
        }

    } catch (err) {
        console.error('❌ Error en reacción:', err);
    }
});

client.login(process.env.DISCORD_TOKEN);