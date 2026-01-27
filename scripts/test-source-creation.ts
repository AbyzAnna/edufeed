import { prisma } from "../src/lib/prisma";

async function testSourceCreation() {
  // Find a notebook to test with
  const notebook = await prisma.notebook.findFirst({
    where: { title: { contains: "APHistory" } },
    orderBy: { createdAt: "desc" },
  });
  
  if (!notebook) {
    console.log("No notebook found for testing");
    return;
  }
  
  console.log(`Testing with notebook: ${notebook.id} - "${notebook.title}"`);
  
  // Try creating a source directly via Prisma
  try {
    const testSource = await prisma.notebookSource.create({
      data: {
        id: crypto.randomUUID(),
        notebookId: notebook.id,
        type: "TEXT",
        title: "Test Direct Creation",
        content: "This is test content created directly via Prisma",
        status: "COMPLETED",
        wordCount: 8,
      },
    });
    
    console.log("\n✅ Source created successfully via Prisma:");
    console.log(testSource);
    
    // Verify it exists
    const verify = await prisma.notebookSource.findUnique({
      where: { id: testSource.id }
    });
    console.log("\n✅ Verified source exists:", verify ? "YES" : "NO");
    
    // Clean up
    await prisma.notebookSource.delete({ where: { id: testSource.id } });
    console.log("✅ Cleaned up test source");
    
  } catch (error) {
    console.error("❌ Error creating source:", error);
  }
  
  await prisma.$disconnect();
}

testSourceCreation().catch(console.error);
