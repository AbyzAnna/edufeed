import { prisma } from "../src/lib/prisma";

async function verifyAICESources() {
  console.log("🔍 Verifying AICE Business Notebooks and Sources\n");
  console.log("=".repeat(60));

  // Get all AICE notebooks
  const aiceNotebooks = await prisma.notebook.findMany({
    where: {
      title: { startsWith: "AICE Unit" }
    },
    include: {
      NotebookSource: true
    },
    orderBy: { title: "asc" }
  });

  console.log(`\n📓 Found ${aiceNotebooks.length} AICE notebooks:\n`);

  let totalSourcesVerified = 0;
  let totalWordCount = 0;

  for (const notebook of aiceNotebooks) {
    console.log(`\n📓 ${notebook.title}`);
    console.log(`   ID: ${notebook.id}`);
    console.log(`   Sources: ${notebook.NotebookSource.length}`);

    // Group by type
    const byType: Record<string, number> = {};
    notebook.NotebookSource.forEach(s => {
      byType[s.type] = (byType[s.type] || 0) + 1;
      totalWordCount += s.wordCount || 0;
    });
    const typeStr = Object.entries(byType).map(([k,v]) => `${k}:${v}`).join(", ");
    console.log(`   By type: ${typeStr}`);

    // Check all have content
    const withContent = notebook.NotebookSource.filter(s => s.content && s.content.length > 0);
    const completed = notebook.NotebookSource.filter(s => s.status === "COMPLETED");

    console.log(`   With content: ${withContent.length}/${notebook.NotebookSource.length}`);
    console.log(`   Completed: ${completed.length}/${notebook.NotebookSource.length}`);

    // Show source titles
    console.log("\n   Sources:");
    for (const source of notebook.NotebookSource) {
      const contentPreview = source.content ? source.content.substring(0, 50) + "..." : "(no content)";
      console.log(`     • [${source.type}] ${source.title}`);
      console.log(`       Status: ${source.status} | Words: ${source.wordCount} | Preview: ${contentPreview}`);
      totalSourcesVerified++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 VERIFICATION SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Notebooks verified: ${aiceNotebooks.length}`);
  console.log(`✅ Total sources verified: ${totalSourcesVerified}`);
  console.log(`✅ Total word count: ${totalWordCount.toLocaleString()}`);

  // Final check
  const allCompleted = aiceNotebooks.every(n =>
    n.NotebookSource.every(s => s.status === "COMPLETED" && s.content)
  );

  if (allCompleted) {
    console.log("\n🎉 ALL SOURCES VERIFIED SUCCESSFULLY!");
  } else {
    console.log("\n⚠️  Some sources may have issues - check details above");
  }

  await prisma.$disconnect();
}

verifyAICESources().catch(console.error);
