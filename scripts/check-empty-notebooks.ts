import { prisma } from "../src/lib/prisma";

async function checkEmptyNotebooks() {
  const emptyNotebooks = await prisma.notebook.findMany({
    where: {
      NotebookSource: { none: {} }
    },
    orderBy: { createdAt: "desc" },
  });
  
  console.log(`\n=== Notebooks with NO sources: ${emptyNotebooks.length} ===\n`);
  emptyNotebooks.forEach(n => {
    console.log(`- ${n.id}: "${n.title}" - created ${n.createdAt}`);
  });
  
  // Check specifically for the AICE notebook
  const aiceNotebook = await prisma.notebook.findFirst({
    where: {
      OR: [
        { title: { contains: "AICE", mode: "insensitive" } },
        { title: { contains: "Business", mode: "insensitive" } },
        { title: { contains: "Entrepreneurship", mode: "insensitive" } },
      ]
    },
    include: {
      NotebookSource: true
    }
  });
  
  if (aiceNotebook) {
    console.log(`\nFound related notebook: "${aiceNotebook.title}"`);
    console.log(`Sources: ${aiceNotebook.NotebookSource.length}`);
  }
  
  await prisma.$disconnect();
}

checkEmptyNotebooks().catch(console.error);
