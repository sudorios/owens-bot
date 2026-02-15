module.exports = {
    data: { name: 'syncoptions', type: 'prefix' },
    async execute(msg, ctx) {

        const prisma = ctx?.prisma || msg.client.prisma || msg.client.ctx?.prisma;
        if (!prisma) return msg.reply("❌ Error: No hay conexión a la BD.");

        await msg.reply("⏳ **Sincronizando opciones...** El bot está leyendo las encuestas de Discord.");

        const questions = await prisma.question.findMany({
            where: {
                question_options: { none: {} },
                message_id: { not: null },
                enabled: true
            }
        });

        if (questions.length === 0) {
            return msg.reply("✅ No encontré preguntas sin opciones. Todo parece estar al día.");
        }

        let successCount = 0;
        let errors = [];

        for (const q of questions) {
            try {
                const channel = await msg.client.channels.fetch(q.channel_id).catch(() => null);
                if (!channel) throw new Error(`Canal no encontrado (${q.channel_id})`);
                const message = await channel.messages.fetch(q.message_id).catch(() => null);
                if (!message) throw new Error(`Mensaje no encontrado (${q.message_id})`);
                if (!message.poll) throw new Error(`El mensaje no es una Poll de Discord`);
                const pollAnswers = Array.from(message.poll.answers.values());
                const dataToInsert = pollAnswers.map((ans, index) => ({
                    question_id: q.question_id,
                    index: index,
                    label: (ans.text || '').trim(),
                    created: new Date(),
                    enabled: true,
                    created_by: 'SyncCommand'
                }));
                await prisma.question_option.createMany({
                    data: dataToInsert
                });
                successCount++;
                console.log(`✅ Sincronizada Q-ID ${q.question_id} (${dataToInsert.length} opciones)`);
            } catch (err) {
                errors.push(`Q-ID ${q.question_id}: ${err.message}`);
                console.error(`❌ Error Q-ID ${q.question_id}:`, err);
            }
        }
        let reply = `🏁 **Proceso Terminado**\n✅ Éxito: ${successCount} preguntas sincronizadas.`;
        if (errors.length > 0) {
            reply += `\n⚠️ Errores (${errors.length}):\n` + errors.join('\n');
        }
        return msg.reply(reply);
    },
};