const { PrismaClient } = require("@prisma/client");
const { register } = require("../audit/audit");

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient();

if (!prisma._auditMiddlewareRegistered) {
  register(prisma);
  prisma._auditMiddlewareRegistered = true;
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

module.exports = { prisma };
