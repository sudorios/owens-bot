const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function pad(str, len) {
  const s = String(str ?? '');
  return s.length >= len ? s.slice(0, len) : s + ' '.repeat(len - s.length);
}

function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

function makeCollector({ message, interaction, prefix, ttlMs = 60_000, onCollect, onEnd }) {
  const filter = (i) =>
    i.user.id === interaction.user.id &&
    i.message.id === message.id &&
    i.customId.startsWith(prefix + ':');

  const collector = message.createMessageComponentCollector({ filter, time: ttlMs });

  collector.on('collect', onCollect);
  collector.on('end', onEnd ?? (async () => {
    try { await message.edit({ components: [] }); } catch {}
  }));

  return collector;
}

function makeCid(prefix, ...parts) {
  return `${prefix}:${parts.join(':')}`;
}

/**
 * 
 * @returns {string[]|null} 
 */
function parseCid(id, expectedPrefix, expectedParts) {
  const parts = id.split(':');
  if (parts[0] !== expectedPrefix) return null;
  if (parts.length !== expectedParts + 1) return null;
  return parts.slice(1);
}

function buildPagingRowGeneric(prefix, partsPrev, partsNext, disabledPrev, disabledNext) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(makeCid(prefix, ...partsPrev))
      .setLabel('◀️ Anterior')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabledPrev),
    new ButtonBuilder()
      .setCustomId(makeCid(prefix, ...partsNext))
      .setLabel('Siguiente ▶️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabledNext)
  );
}

module.exports = {
  pad,
  clamp,
  makeCollector,
  makeCid,
  parseCid,
  buildPagingRowGeneric,
};
