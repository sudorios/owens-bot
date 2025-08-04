module.exports = async (message, quinielas, apuestas) => {
    const args = message.content.trim().split(/ +/).slice(1);
    const ganIndex = args.findIndex((a) => a.toLowerCase().startsWith("ganador="));
  
    if (ganIndex === -1) {
      return message.reply("❗ Usa: `?cerrarpool ganador=<emoji>` y responde al mensaje de la encuesta.");
    }
  
    const ganadorEmoji = args[ganIndex].split("=").slice(1).join("=").trim();
  
    const ref = message.reference?.messageId;
    if (!ref) {
      return message.reply("⚠️ Debes responder al mensaje de la quiniela para cerrarla.");
    }
  
    try {
      const pollMsg = await message.channel.messages.fetch(ref);
  
      const quinielaData = [...quinielas.values()].find(([q]) => q.mensajeID === pollMsg.id);
      const quiniela = quinielaData?.[0];
  
      if (!quiniela) {
        return message.reply("❌ No se encontró una quiniela activa para este mensaje.");
      }
  
      const opcionGanadora = quiniela.opciones.find((o) => o.emoji === ganadorEmoji);
  
      if (!opcionGanadora) {
        const opcionesTexto = quiniela.opciones.map(o => `${o.emoji} ${o.text}`).join('\n');
        return message.reply(`❌ El emoji "${ganadorEmoji}" no corresponde a ninguna opción.\nOpciones válidas:\n${opcionesTexto}`);
      }
  
      await pollMsg.poll.end();
  
      const votos = apuestas.get(quiniela.mensajeID);
      if (!votos || votos.size === 0) {
        return message.channel.send("❗ No hubo votos registrados en esta quiniela.");
      }
  
      const ganadores = [...votos.entries()]
        .filter(([, opcion]) => opcion === opcionGanadora.text)
        .map(([userID]) => userID);
  
      const totalVotantes = votos.size;
  
      const listaGanadores = ganadores.length
        ? ganadores.map((id) => `<@${id}> +1 punto`).join("\n")
        : "😢 Nadie acertó.";
  
      const listaPerdedores = [...votos.entries()]
        .filter(([, opcion]) => opcion !== opcionGanadora.text)
        .map(([userID]) => `<@${userID}>`).join("\n") || "✅ Todos acertaron";
  
      await message.channel.send(`🏁 Quiniela cerrada: **${quiniela.nombre}**`);
      await message.channel.send(`🎯 Resultado oficial: ${opcionGanadora.emoji} **${opcionGanadora.text}**`);
      await message.channel.send(`👥 Total de votos: ${totalVotantes}`);
      await message.channel.send(`📌 Usuarios que acertaron:\n${listaGanadores}`);
      await message.channel.send(`📉 Usuarios que NO acertaron:\n${listaPerdedores}`);
  
      // Limpieza
      quinielas.delete(`${message.guild.id}:${quiniela.nombre}`);
      apuestas.delete(quiniela.mensajeID);
  
    } catch (err) {
      console.error("❌ Error al cerrar quiniela:", err);
      message.reply("❌ Error al cerrar la quiniela.");
    }
  };
  