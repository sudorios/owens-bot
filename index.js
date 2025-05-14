require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const emojiRegex = require('emoji-regex');

const quinielas = new Map();
const apuestas = new Map();
const puntos = new Map();
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
        const nombre = message.content.split(' ')[1];

        if (!nombre) return message.reply('❗ Usa: `!crearquiniela <nombre>`');

        if (quinielas.has(nombre)) {
            return message.reply('⚠️ Ya existe una quiniela con ese nombre.');
        }

        quinielas.set(nombre, []);
        return message.reply(`🗂️ Quiniela **${nombre}** creada. Ahora agrega combates con \`!combate ${nombre} <pelea>\``);
    }
    if (message.content.startsWith('!combate')) {
        const partes = message.content.split(' ');
        const nombre = partes[1];
        const contenido = partes.slice(2).join(' ');

        if (!quinielas.has(nombre)) {
            return message.reply('❗ Esa quiniela no existe. Usa `!crearquiniela` primero.');
        }

        const regex = emojiRegex();
        const emojis = [];
        let match;
        while ((match = regex.exec(contenido)) !== null) {
            emojis.push(match[0]);
        }

        try {
            const msg = await message.channel.send(`🥊 **Combate de ${nombre}**\n${contenido}`);

            for (const emoji of emojis) {
                await msg.react(emoji);
            }

            // Registrar el mensaje como combate dentro de la quiniela
            const combate = {
                mensajeID: msg.id,
                emojis: emojis
            };

            quinielas.get(nombre).push(combate);
            apuestas.set(msg.id, new Map());

            message.reply(`✅ Combate agregado a la quiniela **${nombre}**`);
        } catch (err) {
            console.error('❌ Error al publicar el combate:', err);
            message.reply('Hubo un error al agregar el combate.');
        }
    }

    if (message.content.startsWith('!resultado')) {
        const [_, mensajeID, emojiGanador] = message.content.split(' ');

        if (!mensajeID || !emojiGanador) {
            return message.reply('❗ Usa: `!resultado <mensajeID> <emoji>`');
        }

        const combates = [...quinielas.values()].flat();
        const existe = combates.find(c => c.mensajeID === mensajeID);
        if (!existe) {
            return message.reply('❌ Ese mensaje no pertenece a ningún combate registrado.');
        }

        resultados.set(mensajeID, emojiGanador);
        message.reply(`✅ Resultado guardado para el combate ${mensajeID}: ganador ${emojiGanador}`);
    }
    if (message.content.startsWith('!finalizar')) {
        const partes = message.content.split(' ');
        const nombre = partes[1];

        if (!nombre) return message.reply('❗ Usa: `!finalizar <nombre_quiniela>`');

        const combates = quinielas.get(nombre);
        if (!combates || combates.length === 0) {
            return message.reply('⚠️ Esa quiniela no existe o no tiene combates.');
        }

        const resumen = [];
        const puntajeEvento = new Map(); // usuarioID → puntos ganados en esta quiniela
        let combatesEvaluados = 0;

        for (const combate of combates) {
            const mensajeID = combate.mensajeID;
            const emojiGanador = resultados.get(mensajeID);
            const votos = apuestas.get(mensajeID);

            if (!emojiGanador) {
                resumen.push(`❓ Combate ${mensajeID} sin resultado. Usa \`!resultado ${mensajeID} <emoji>\``);
                continue;
            }

            if (!votos) {
                resumen.push(`🕳️ Combate ${mensajeID} sin apuestas registradas.`);
                continue;
            }

            let ganadores = [];

            for (const [userID, emoji] of votos.entries()) {
                if (emoji === emojiGanador) {
                    // Suma al total general
                    const total = puntos.get(userID) || 0;
                    puntos.set(userID, total + 1);

                    // Suma al evento actual
                    const prev = puntajeEvento.get(userID) || 0;
                    puntajeEvento.set(userID, prev + 1);

                    ganadores.push(`<@${userID}> (+1 pt)`);
                }
            }

            apuestas.delete(mensajeID);
            combatesEvaluados++;

            if (ganadores.length === 0) {
                resumen.push(`🔚 Combate ${mensajeID}: nadie acertó`);
            } else {
                resumen.push(`🏆 Combate ${mensajeID} - Ganadores: ${ganadores.join(', ')}`);
            }
        }

        quinielas.delete(nombre);

        // Armar ranking del evento
        const rankingEvento = [...puntajeEvento.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([userID, pts], i) => `#${i + 1} <@${userID}> — ${pts} pt${pts > 1 ? 's' : ''}`);

        const resumenFinal = [
            `🎯 Quiniela **${nombre}** finalizada`,
            `📊 Combates evaluados: ${combatesEvaluados}/${combates.length}`,
            '',
            ...resumen,
            '',
            '🏅 **Ranking del Evento:**',
            rankingEvento.length > 0 ? rankingEvento.join('\n') : 'Sin aciertos en esta quiniela.'
        ];

        message.channel.send(resumenFinal.join('\n'));
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