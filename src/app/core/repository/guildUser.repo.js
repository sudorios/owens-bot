const GuildRepository = require("../../config/repository/guild.repo");
const UserRepository = require("../../security/repository/user.repo");

class GuildUserRepository {
  constructor(prisma) {
    this.prisma = prisma;
    this.guildRepo = new GuildRepository(prisma);
    this.userRepo = new UserRepository(prisma);
  }

  async createGuildUser(tx, { guildIdStr, guildName, discordUserId, username }) {
    const guild =
      (await this.guildRepo.findByDiscordId(tx, guildIdStr)) ??
      (await this.guildRepo.createGuild(tx, guildIdStr, guildName, username));

    const user =
      (await this.userRepo.findByDiscordId(tx, discordUserId)) ??
      (await this.userRepo.createUser(tx, discordUserId, username));

    return {
      guildInternalId: guild.id,
      userInternalId: user.id,
    };
  }

  async countGuildRanking(tx, { guildInternalId }) {
    const db = tx || this.prisma;

    return db.guild_user.count({
      where: {
        guild_id: guildInternalId,
        points: { gt: 0 },
      },
    });
  }

  async getGuildRankingPage(tx, { guildInternalId, skip, take }) {
    const db = tx || this.prisma;
    return db.vw_guild_user.findMany({
      where: {
        guild_id: guildInternalId,
        points: { gt: 0 },
      },
      orderBy: [{ points: "desc" }],
      skip,
      take,
    });
  }

  async updateGuildPositions(tx, { guildInternalId }) {
    const db = tx || this.prisma;
    const allUsers = await db.guild_user.findMany({
      where: { guild_id: guildInternalId, points: { gt: 0 } },
      orderBy: { points: "desc" },
      select: {
        guild_user_id: true,
        position: true,
      },
    });

    for (let i = 0; i < allUsers.length; i++) {
      const record = allUsers[i];
      const newPos = i + 1;

      if (record.position !== newPos) {
        await db.guild_user.update({
          where: {
            guild_user_id: record.guild_user_id,
          },
          data: {
            position: newPos,
            last_position: record.position,
          },
        });
      }
    }
  }
}

module.exports = GuildUserRepository;
