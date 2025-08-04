module.exports = async (msg) => {
    const ref = msg.reference?.messageId; 

    if (!ref) {
        console.log("⚠️ No se ha respondido a ningún mensaje.");
        return msg.reply("⚠️ Debes responder a una encuesta existente para obtener los resultados.");
    }

    try {
        const encuestas = [];
        let lastId = ref; 

        let continuar = true;
        let attemptCount = 0;


        const refMsg = await msg.channel.messages.fetch(ref);
        if (refMsg.poll) {
            encuestas.push(refMsg);  
        }

        while (continuar && attemptCount < 5) {
            attemptCount++;

            const messages = await msg.channel.messages.fetch({ after: lastId, limit: 100 });


            if (messages.size === 0) {
                console.log("No se encontraron más mensajes en este intento.");
                continuar = false;
            }

            for (const [, message] of messages) {
                lastId = message.id;



                if (message.poll) {
                    encuestas.push(message);  
                } 
            }

            if (messages.size < 100) continuar = false; 
        }

        if (encuestas.length === 0) {
            console.log("🔍 No se encontraron encuestas posteriores a este mensaje.");
            return msg.reply("🔍 No se encontraron encuestas posteriores a este mensaje.");
        }

        for (const encuesta of encuestas) {
            const poll = encuesta.poll;
            const opciones = poll.answers;

            if (opciones.size === 0) continue;

            let resultado;
            resultado = `**Pregunta:** ${poll.question.text}\n`;

            let totalVotos = 0;
            let detalleVotos = "";

            for (const [answerId, answer] of opciones) {
                try {
                    const voters = await poll.answers.get(answerId).fetchVoters();
                    const voteCount = voters.size;
                    totalVotos += voteCount;

                    const emoji = answer.emoji
                        ? (answer.emoji.id ? `<:${answer.emoji.name}:${answer.emoji.id}>` : answer.emoji.name)
                        : "📝";

                    detalleVotos += `\n**${emoji} ${answer.text}:** ${voteCount} voto(s)\n`;

                    if (voteCount > 0) {
                        const userList = voters.map(user => `- ${user.tag}`).join('\n');
                        detalleVotos += `${userList}\n`;
                    }
                } catch (e) {
                    console.error(`❌ Error al obtener votos para opción ${answerId}:`, e);
                    detalleVotos += `\n**${answer.text}:** Error al obtener votos\n`;
                }
            }

            resultado += `**Total de votos:** ${totalVotos}\n`;
            resultado += detalleVotos;

            console.log("✅ Resultados de la encuesta:\n", resultado);
        }

    } catch (err) {
        console.error("❌ Error en el proceso:", err);
        console.log("❌ Ocurrió un error al procesar las encuestas.");
        return msg.reply("❌ Ocurrió un error al procesar las encuestas.");
    }

    setTimeout (() => {
        msg.delete();
    }, 1000);
};
