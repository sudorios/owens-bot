require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const createCommands = require('./commands');
const Calificacion = require('./models/Calificacion');
const connectDB = require('./db');
const es = require('./languages/es_help_commands');
const en = require('./languages/en_help_commands');
const setLangHandler = require('./handlers/setlang');
const quinielas = new Map();
const apuestas = new Map();
const resultados = new Map();

connectDB();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ]
});

client.guildLanguages = new Map();

const commands = createCommands(quinielas, apuestas, resultados);


client.once('ready', () => {
    console.log(`✅ Bot conectado como ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith('!')) return;

    const args = message.content.slice(1).split(/\s+/);
    const command = args.shift().toLowerCase();

    if (command === 'setlang') return setLangHandler(message);

    const guildID = message.guild.id;
    const lang = client.guildLanguages.get(guildID) || 'es';
    const langTexts = lang === 'es' ? es : en;

    if (!langTexts[command]) {
        return message.reply(langTexts['help'] ? langTexts['help'].comandoNoEncontrado || '❌ Comando no reconocido.' : '❌ Comando no reconocido.');
    }

    try {
        await commands[command](message, langTexts);
    } catch (err) {
        console.error(err);
        message.reply(langTexts.errorAlEjecutar || '❌ Error al ejecutar el comando.');
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