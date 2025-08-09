const Punto = require('../../models/Punto');
const { getOrCreateActiveSeason, getSeasonIndex } = require('../../src/utils/seasonUtils');

module.exports = async (message, quinielas, resultados) => {
    const [_, mensajeID, emojiGanador] = message.content.split(' ');

    message.delete().catch(() => { });

    if (!mensajeID || !emojiGanador) {
        return message.channel.send('Use: `?result <messageID> <emoji>`')
            .then(msg => setTimeout(() => msg.delete().catch(() => { }), 5000));
    }

    const combates = [...quinielas.values()].flat();
    const existe = combates.find(c => c.mensajeID === mensajeID);

    if (!existe) {
        return message.channel.send('That message does not belong to any registered match.')
            .then(msg => setTimeout(() => msg.delete().catch(() => { }), 5000));
    }

    resultados.set(mensajeID, emojiGanador);

    try {
        const msg = await message.channel.messages.fetch(mensajeID);

        const reaction = msg.reactions.cache.get(emojiGanador);
        if (!reaction) {
            return message.channel.send(`No one reacted with ${emojiGanador}.`)
                .then(msg => setTimeout(() => msg.delete().catch(() => { }), 5000));
        }

        const users = await reaction.users.fetch();
        const jugadores = users.filter(u => !u.bot);

        const seasonActual = await getOrCreateActiveSeason(message.guild.id);
        const seasonIndex = getSeasonIndex(seasonActual);

        for (const [userID, user] of jugadores) {
            await Punto.updateOne(
                { guildID: message.guild.id, userID },
                {
                    $set: {
                        username: `<@${userID}>`
                    },
                    $inc: {
                        [`score.${seasonIndex}`]: 1
                    }
                },
                { upsert: true }
            );
        }

        message.channel.send(`✅ ${emojiGanador} — ${jugadores.size} scored`);

    } catch (error) {
        console.error('❌ Error assigning points:', error);
        message.channel.send('❌ Error fetching reactions or updating points.')
            .then(msg => setTimeout(() => msg.delete().catch(() => { }), 5000));
    }
};
