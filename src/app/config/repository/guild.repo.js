class GuildRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async createGuild(tx, discordGuildIdStr, guildName, createdBy) {
    const guildId = BigInt(discordGuildIdStr);
    return tx.guild.upsert({
      where: { guild_id: guildId },
      update: {},
      create: {
        guild_id: guildId,
        name: guildName,
        created_by: createdBy || "system",
        created: new Date(),
        enabled: true,
      },
    });
  }

  async findByDiscordId(tx, discordGuildIdStr) {
    return tx.guild.findUnique({
      where: { guild_id: BigInt(discordGuildIdStr) },
    });
  }

  async getInternalGuildId(tx, discordGuildIdStr) {
    const guild = await this.findByDiscordId(tx, discordGuildIdStr);
    return guild ? guild.id : null;
  }
}

module.exports = GuildRepository;
