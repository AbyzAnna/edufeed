import { prisma } from "../src/lib/prisma";

async function debugSources() {
  console.log("=== NotebookSource Status Debug ===\n");
  
  // Get all sources
  const sources = await prisma.notebookSource.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      Notebook: { select: { title: true } },
    },
  });
  
  console.log(`Total sources found: ${sources.length}\n`);
  
  // Group by status
  const byStatus: Record<string, number> = {};
  sources.forEach(s => {
    byStatus[s.status] = (byStatus[s.status] || 0) + 1;
  });
  console.log("By status:", byStatus);
  
  // Show failed sources
  const failed = sources.filter(s => s.status === "FAILED");
  if (failed.length > 0) {
    console.log("\n=== FAILED SOURCES ===");
    failed.forEach(s => {
      console.log(`- ${s.title} (${s.type}): ${s.errorMessage}`);
    });
  }
  
  // Show pending sources
  const pending = sources.filter(s => s.status === "PENDING");
  if (pending.length > 0) {
    console.log("\n=== PENDING SOURCES ===");
    pending.forEach(s => {
      console.log(`- ${s.id}: ${s.title} (${s.type}) - created ${s.createdAt}`);
    });
  }
  
  // Show successful sources
  const completed = sources.filter(s => s.status === "COMPLETED");
  console.log(`\n=== COMPLETED: ${completed.length} ===`);
  completed.slice(0, 5).forEach(s => {
    console.log(`- ${s.title} (${s.type}) - ${s.wordCount} words`);
  });
  
  // Check all notebooks
  const notebooks = await prisma.notebook.findMany({
    include: {
      _count: { select: { NotebookSource: true } }
    }
  });
  
  console.log("\n=== NOTEBOOKS ===");
  notebooks.forEach(n => {
    console.log(`- ${n.title}: ${n._count.NotebookSource} sources`);
  });
  
  await prisma.$disconnect();
}

debugSources().catch(console.error);
