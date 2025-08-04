const { PollLayoutType } = require("discord.js");

const defaultEmojis = [
  "1️⃣",
  "2️⃣",
  "3️⃣",
  "4️⃣",
  "5️⃣",
  "6️⃣",
  "7️⃣",
  "8️⃣",
  "9️⃣",
  "🔟",
];

module.exports = async (message, quinielas) => {
  message.delete().catch(() => {});

  const args = message.content.trim().split(/ +/).slice(1);
  const fullTitle = args.join(" ");

  const participantes = fullTitle
    .split(/vs/i)
    .map((p) => p.trim())
    .filter(Boolean);

  if (participantes.length < 2) {
    const msg = await message.channel.send(
      "❗ Usa el formato: `?createpool2 Luchador1 vs Luchador2 [vs Luchador3 ...]` (mínimo 2 luchadores)"
    );
    return setTimeout(() => msg.delete().catch(() => {}), 7000);
  }

  if (participantes.length > defaultEmojis.length) {
    const msg = await message.channel.send(
      `⚠️ Máximo permitido: ${defaultEmojis.length} participantes.`
    );
    return setTimeout(() => msg.delete().catch(() => {}), 7000);
  }

  const nombre = participantes.join(" vs ");
  const key = `${message.guild.id}:${nombre}`;
  if (quinielas.has(key)) {
    const msg = await message.channel.send(
      "⚠️ Ya existe una quiniela con ese nombre."
    );
    return setTimeout(() => msg.delete().catch(() => {}), 5000);
  }

  const opciones = participantes.map((nombre, i) => ({
    text: nombre,
    emoji: defaultEmojis[i],
  }));

  try {
    const pollMsg = await message.channel.send({
      poll: {
        question: { text: `${nombre}` },
        answers: opciones,
        allowMultiselect: false,
        duration: 12,
        layoutType: PollLayoutType.Default,
      },
    });
    quinielas.set(key, [{ mensajeID: pollMsg.id, nombre, opciones }]);
  } catch (err) {
    console.error("❌ Error al crear la encuesta:", err);
    const msg = await message.channel.send(
      "❌ Ocurrió un error al crear la encuesta."
    );
    setTimeout(() => msg.delete().catch(() => {}), 5000);
  }
};
