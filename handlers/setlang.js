module.exports = (message) => {
    const args = message.content.trim().split(/\s+/);
    if (args.length < 2) return message.reply('❗ Usa: !setlang <es|en>');

    const lang = args[1].toLowerCase();
    if (!['es', 'en'].includes(lang)) return message.reply('❗ Idioma no válido. Usa "es" o "en".');

    const guildID = message.guild.id;
    message.client.guildLanguages.set(guildID, lang);

    message.reply(`✅ Idioma cambiado a ${lang === 'es' ? 'español' : 'inglés'}.`);
};
