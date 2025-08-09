require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
console.log('creating PrismaClient...');
const prisma = new PrismaClient();

(async () => {
  try {
    await prisma.$connect();
    console.log('✅ Prisma conectó OK');
  } catch (e) {
    console.error('❌ Prisma no conectó:', e);
  } finally {
    await prisma.$disconnect();
  }
})();
