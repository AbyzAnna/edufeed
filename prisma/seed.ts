import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create a demo user
  const user = await prisma.user.upsert({
    where: { email: "demo@edufeed.com" },
    update: {},
    create: {
      email: "demo@edufeed.com",
      name: "Demo User",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=demo",
    },
  });

  console.log("Created demo user:", user.email);

  // Create sample sources
  const sources = [
    {
      type: "TEXT" as const,
      title: "Introduction to Machine Learning",
      content: `Machine learning is a subset of artificial intelligence that enables computers to learn from data without being explicitly programmed.

Key concepts include:
1. Supervised Learning: Learning from labeled data
2. Unsupervised Learning: Finding patterns in unlabeled data
3. Reinforcement Learning: Learning through trial and error

Common algorithms include linear regression, decision trees, neural networks, and support vector machines. Machine learning is used in image recognition, natural language processing, recommendation systems, and autonomous vehicles.`,
    },
    {
      type: "TEXT" as const,
      title: "The Solar System",
      content: `Our solar system consists of the Sun and everything that orbits around it. There are 8 planets: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune.

Fun facts:
- Jupiter is the largest planet, with a mass 318 times that of Earth
- Saturn's rings are made mostly of ice particles
- Mars has the largest volcano in the solar system: Olympus Mons
- A day on Venus is longer than its year

The solar system formed about 4.6 billion years ago from a giant cloud of gas and dust.`,
    },
    {
      type: "URL" as const,
      title: "Web Development Basics",
      content: `Web development involves building and maintaining websites. It includes:

Frontend Development:
- HTML for structure
- CSS for styling
- JavaScript for interactivity

Backend Development:
- Server-side programming (Node.js, Python, etc.)
- Databases (PostgreSQL, MongoDB)
- APIs and web services

Modern frameworks like React, Vue, and Angular have revolutionized how we build web applications, enabling rich, interactive user experiences.`,
      originalUrl: "https://example.com/web-dev",
    },
  ];

  for (const sourceData of sources) {
    const source = await prisma.source.create({
      data: {
        userId: user.id,
        ...sourceData,
      },
    });

    // Create a completed video for each source
    await prisma.video.create({
      data: {
        userId: user.id,
        sourceId: source.id,
        title: source.title,
        description: `Learn about ${source.title} in this short educational video.`,
        status: "COMPLETED",
        generationType: "SLIDESHOW",
        duration: 60,
        script: `Welcome to this video about ${source.title}. ${source.content?.slice(0, 200)}...`,
      },
    });

    console.log("Created source and video:", source.title);
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
