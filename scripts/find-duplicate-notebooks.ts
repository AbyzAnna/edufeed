import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findDuplicateNotebooks() {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: 'abyzovann@icloud.com' },
  });

  if (!user) {
    console.log('User not found: abyzovann@icloud.com');
    return;
  }

  console.log(`Found user: ${user.name || user.email} (ID: ${user.id})`);

  // Get all notebooks for this user with their sources
  const notebooks = await prisma.notebook.findMany({
    where: { userId: user.id },
    include: {
      NotebookSource: {
        select: {
          id: true,
          type: true,
          title: true,
          originalUrl: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`\nTotal notebooks: ${notebooks.length}\n`);

  // Group notebooks by their source signature
  const sourceSignatureMap = new Map<string, typeof notebooks>();

  for (const notebook of notebooks) {
    // Create a signature based on sources
    const sourceSignature = notebook.NotebookSource
      .map(s => `${s.type}:${s.originalUrl || s.title}`)
      .sort()
      .join('|');

    if (!sourceSignatureMap.has(sourceSignature)) {
      sourceSignatureMap.set(sourceSignature, []);
    }
    sourceSignatureMap.get(sourceSignature)!.push(notebook);
  }

  // Find duplicates (groups with more than one notebook)
  const duplicateGroups: typeof notebooks[] = [];

  for (const [signature, group] of sourceSignatureMap) {
    if (group.length > 1) {
      duplicateGroups.push(group);
    }
  }

  console.log(`\n=== DUPLICATE NOTEBOOKS (${duplicateGroups.length} groups) ===\n`);

  const notebooksToDelete: string[] = [];

  for (let i = 0; i < duplicateGroups.length; i++) {
    const group = duplicateGroups[i];
    console.log(`\n--- Group ${i + 1} (${group.length} duplicates) ---`);
    console.log(`Sources: ${group[0].NotebookSource.map(s => s.title || s.originalUrl).join(', ')}`);

    for (let j = 0; j < group.length; j++) {
      const nb = group[j];
      const keepLabel = j === 0 ? ' [KEEP - oldest]' : ' [DELETE]';
      console.log(`  ${j + 1}. "${nb.title}" (ID: ${nb.id}, created: ${nb.createdAt.toISOString()})${keepLabel}`);

      if (j > 0) {
        notebooksToDelete.push(nb.id);
      }
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total notebooks: ${notebooks.length}`);
  console.log(`Duplicate groups: ${duplicateGroups.length}`);
  console.log(`Notebooks to delete: ${notebooksToDelete.length}`);
  console.log(`Notebooks to keep: ${notebooks.length - notebooksToDelete.length}`);

  if (notebooksToDelete.length > 0) {
    console.log(`\nNotebook IDs to delete:`);
    console.log(JSON.stringify(notebooksToDelete, null, 2));
  }

  await prisma.$disconnect();
}

findDuplicateNotebooks().catch(console.error);
