class UserRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async findByDiscordId(tx, discordUserIdStr) {
    return tx.usuario.findUnique({
      where: {
        user_id: BigInt(discordUserIdStr),
      },
    });
  }

  async createUser(tx, discordUserIdStr, username = "Unknown") {
    return tx.usuario.create({
      data: {
        user_id: BigInt(discordUserIdStr),
        username,
      },
    });
  }
}

module.exports = UserRepository;
