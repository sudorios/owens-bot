const PredictionRepository = require("../repository/prediction.repo");
const QuestionRepository = require("../../config/repository/question.repo");
const GuildUserRepository = require("../repository/guildUser.repo");

class PredictionService {
  constructor(prisma) {
    this.prisma = prisma;
    this.repo = new PredictionRepository(prisma);
    this.questionRepo = new QuestionRepository(prisma);
    this.guildUserRepo = new GuildUserRepository(prisma);
  }

  async ingestPollVotes({ guild, message }) {
    if (!message.poll) return { saved: 0, questionId: null, pollAnswers: [] };

    const pollAnswers = Array.from(message.poll.answers.values());
    const votes = [];

    console.log(`🔍 [Ingest] Procesando Poll con ${pollAnswers.length} opciones...`);

    for (let i = 0; i < pollAnswers.length; i++) {
      const ans = pollAnswers[i];
      const voters = await ans.fetchVoters().catch((e) => {
        console.error("Error fetching voters:", e);
        return null;
      });

      if (!voters) continue;

      for (const voter of voters.values()) {
        if (voter.bot) continue;
        votes.push({
          index: i,
          label: (ans.text || "").trim(),
          userIdStr: voter.id,
          username: voter.username ?? voter.tag ?? voter.id,
        });
      }
    }

    console.log(`🔍 [Ingest] Encontré ${votes.length} votos válidos (no bots) en Discord.`);
    if (votes.length === 0) return { saved: 0, questionId: null };

    return this.prisma.$transaction(async (tx) => {
      const q = await this.questionRepo.findQuestionByMessageId(tx, message.id);

      if (!q) {
        console.error("❌ [Ingest] No encontré la pregunta en BD con messageId:", message.id);
        throw new Error("Question no encontrada por messageId");
      }
      if (q.answer) {
        return { saved: 0, questionId: q.question_id, alreadyClosed: true };
      }

      const dbOptions = q.question_options || q.question_option || [];

      if (dbOptions.length === 0) {
        console.warn(
          "⚠️ [Ingest] ALERTA: La pregunta existe pero `dbOptions` está vacío. Verifica si el include en el Repo usa 'question_options' (plural)."
        );
      }

      let saved = 0;

      for (const v of votes) {
        const { userInternalId, guildInternalId } = await this.guildUserRepo.createGuildUser(tx, {
          guildIdStr: guild.id,
          guildName: guild.name,
          discordUserId: v.userIdStr,
          username: v.username,
        });

        let opt = dbOptions.find((o) => o.label.toLowerCase() === v.label.toLowerCase());

        if (!opt) {
          opt = dbOptions.find((o) => o.index === v.index);
        }

        if (opt) {
          await this.repo.upsertPrediction(tx, {
            questionId: q.question_id,
            eventId: q.event_id,
            guildId: guildInternalId,
            userId: userInternalId,
            optionId: opt.question_option_id,
          });
          saved++;
        } else {
          console.warn(
            `⚠️ [Ingest] No encontré match para voto: "${v.label}" (Index ${v.index}). Opciones disponibles:`,
            dbOptions.map((o) => `${o.label}(${o.index})`)
          );
        }
      }

      console.log(`✅ [Ingest] Guardadas ${saved} predicciones en la BD.`);
      return { saved, questionId: q.question_id, eventId: q.event_id };
    });
  }
}

module.exports = PredictionService;
