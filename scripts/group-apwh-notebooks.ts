/**
 * Script to group all AP World History notebooks into one group
 * Run with: npx ts-node --esm scripts/group-apwh-notebooks.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Searching for AP World History notebooks...\n");

  // Find all notebooks with AP World History related content
  const apwhNotebooks = await prisma.notebook.findMany({
    where: {
      OR: [
        { title: { contains: "AP World", mode: "insensitive" } },
        { title: { contains: "APWH", mode: "insensitive" } },
        { title: { contains: "World History", mode: "insensitive" } },
        { description: { contains: "AP World", mode: "insensitive" } },
        { description: { contains: "APWH", mode: "insensitive" } },
        {
          NotebookSource: {
            some: {
              OR: [
                { title: { contains: "AP World", mode: "insensitive" } },
                { title: { contains: "APWH", mode: "insensitive" } },
                { title: { contains: "World History", mode: "insensitive" } },
              ],
            },
          },
        },
      ],
    },
    include: {
      User: { select: { id: true, email: true } },
      NotebookSource: { select: { title: true }, take: 5 },
      NotebookGroup: { select: { id: true, name: true } },
    },
  });

  console.log(`📚 Found ${apwhNotebooks.length} AP World History related notebooks:\n`);

  if (apwhNotebooks.length === 0) {
    console.log("No AP World History notebooks found.");
    return;
  }

  // Group notebooks by user
  const notebooksByUser = new Map<
    string,
    typeof apwhNotebooks
  >();

  for (const notebook of apwhNotebooks) {
    const userId = notebook.userId;
    if (!notebooksByUser.has(userId)) {
      notebooksByUser.set(userId, []);
    }
    notebooksByUser.get(userId)!.push(notebook);
  }

  console.log(`👥 Notebooks belong to ${notebooksByUser.size} user(s)\n`);

  // Process each user's notebooks
  for (const [userId, notebooks] of notebooksByUser) {
    console.log(`\n--- User: ${notebooks[0].User?.email || userId} ---`);
    console.log(`   Has ${notebooks.length} AP World History notebooks`);

    // Check if they already have an AP World History group
    let existingGroup = await prisma.notebookGroup.findFirst({
      where: {
        userId,
        OR: [
          { name: { contains: "AP World", mode: "insensitive" } },
          { name: { contains: "APWH", mode: "insensitive" } },
          { name: { contains: "World History", mode: "insensitive" } },
        ],
      },
    });

    if (existingGroup) {
      console.log(`   ✅ Already has group: "${existingGroup.name}"`);
    } else {
      // Create new group
      console.log(`   📁 Creating new AP World History group...`);
      existingGroup = await prisma.notebookGroup.create({
        data: {
          userId,
          name: "AP World History",
          description: "All AP World History study materials",
          emoji: "🌍",
          color: "#10b981",
          order: 0,
        },
      });
      console.log(`   ✅ Created group: "${existingGroup.name}" (${existingGroup.id})`);
    }

    // Assign ungrouped notebooks to this group
    const ungroupedNotebooks = notebooks.filter((n) => !n.groupId);
    console.log(`   📝 ${ungroupedNotebooks.length} notebooks need to be added to the group`);

    if (ungroupedNotebooks.length > 0) {
      const result = await prisma.notebook.updateMany({
        where: {
          id: { in: ungroupedNotebooks.map((n) => n.id) },
          userId,
        },
        data: { groupId: existingGroup.id },
      });
      console.log(`   ✅ Added ${result.count} notebooks to the group`);
    }

    // List all notebooks in this group
    const groupedNotebooks = await prisma.notebook.findMany({
      where: { groupId: existingGroup.id },
      select: { id: true, title: true, emoji: true },
    });

    console.log(`\n   📚 Notebooks in "${existingGroup.name}" group:`);
    for (const nb of groupedNotebooks) {
      console.log(`      ${nb.emoji || "📚"} ${nb.title}`);
    }
  }

  console.log("\n\n✅ All AP World History notebooks have been grouped!");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
