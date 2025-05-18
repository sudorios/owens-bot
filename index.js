require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');

const handleCrearQuiniela = require('./handlers/crearQuiniela');
const handleAgregarCombate = require('./handlers/agregarCombate');
const handleGuardarResultado = require('./handlers/guardarResultado');
const handleFinalizarQuiniela = require('./handlers/finalizarQuiniela');
const handleRanking = require('./handlers/ranking');

const connectDB = require('./db');
connectDB();

const quinielas = new Map();
const apuestas = new Map();
const resultados = new Map();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ]
});

client.once('ready', () => {
    console.log(`✅ Bot conectado como ${client.user.tag}`);
});


client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content.startsWith('!crearquiniela')) {
        return handleCrearQuiniela(message, quinielas);
    }

    if (message.content.startsWith('!combate')) {
        return handleAgregarCombate(message, quinielas, apuestas);
    }

    if (message.content.startsWith('!resultado')) {
        return handleGuardarResultado(message, quinielas, resultados);
    }

    if (message.content.startsWith('!finalizar')) {
        return handleFinalizarQuiniela(message, quinielas, apuestas, resultados);
    }

    if (message.content.startsWith('!ranking')) {
        return handleRanking(message);
    }

});

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;

    try {
        if (reaction.partial) await reaction.fetch();
        if (reaction.message.partial) await reaction.message.fetch();

        const message = reaction.message;
        if (message.author.id !== client.user.id) return;

        const combates = [...quinielas.values()].flat();
        const esCombate = combates.find(c => c.mensajeID === message.id);
        if (!esCombate) return;

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

    } catch (err) {
        console.error('❌ Error en reacción:', err);
    }
});


client.login(process.env.DISCORD_TOKEN);