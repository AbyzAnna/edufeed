// Test the API endpoint directly 
import { prisma } from "../src/lib/prisma";

async function testAPIFlow() {
  console.log("Testing source creation API flow...\n");
  
  // Get a notebook
  const notebook = await prisma.notebook.findFirst({
    orderBy: { createdAt: "desc" },
  });
  
  if (!notebook) {
    console.log("No notebook found");
    return;
  }
  
  // Get notebook owner
  const user = await prisma.user.findUnique({
    where: { id: notebook.userId }
  });
  
  console.log(`Notebook: ${notebook.id}`);
  console.log(`Owner: ${user?.email}`);
  
  // Check if sources exist for this notebook
  const existingSources = await prisma.notebookSource.findMany({
    where: { notebookId: notebook.id },
    select: { id: true, title: true, type: true, status: true }
  });
  
  console.log(`\nExisting sources for this notebook: ${existingSources.length}`);
  existingSources.forEach(s => {
    console.log(`  - ${s.title} (${s.type}) - ${s.status}`);
  });
  
  // Now let me test manually adding a source
  console.log("\n=== Creating test source ===");
  
  const testSource = await prisma.notebookSource.create({
    data: {
      id: crypto.randomUUID(),
      notebookId: notebook.id,
      type: "URL",
      title: "Test URL Source",
      originalUrl: "https://example.com",
      status: "PENDING",
    }
  });
  
  console.log("Created source:", testSource.id);
  
  // Now simulate what processSource does
  console.log("\nSimulating processSource...");
  
  // Update to PROCESSING
  await prisma.notebookSource.update({
    where: { id: testSource.id },
    data: { status: "PROCESSING" }
  });
  console.log("  - Set status to PROCESSING");
  
  // Simulate content extraction
  const content = "This is extracted content from the URL";
  
  // Update with content
  await prisma.notebookSource.update({
    where: { id: testSource.id },
    data: {
      content,
      wordCount: content.split(/\s+/).length,
      status: "COMPLETED"
    }
  });
  console.log("  - Set status to COMPLETED with content");
  
  // Verify
  const verified = await prisma.notebookSource.findUnique({
    where: { id: testSource.id }
  });
  
  console.log("\n✅ Final source state:", {
    id: verified?.id,
    status: verified?.status,
    wordCount: verified?.wordCount
  });
  
  // Clean up
  await prisma.notebookSource.delete({ where: { id: testSource.id } });
  console.log("✅ Cleaned up");
  
  await prisma.$disconnect();
}

testAPIFlow().catch(console.error);
