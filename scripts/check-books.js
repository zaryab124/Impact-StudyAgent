const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const books = await prisma.book.findMany({
    include: {
      class: true,
      subject: true,
      board: true,
    }
  });
  console.log('TOTAL BOOKS IN DB:', books.length);
  for (const b of books) {
    console.log(`- [${b.id}] "${b.title}" | Class: ${b.class?.name} (${b.class?.numericLevel}) | Subject: ${b.subject?.name} (${b.subject?.code}) | Board: ${b.board?.name}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
