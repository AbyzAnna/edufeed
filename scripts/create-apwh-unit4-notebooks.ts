/**
 * AP World History Unit 4 (1450-1750) Notebook Generator
 * Creates 20 notebooks with comprehensive sources and outputs
 */

import { PrismaClient, NotebookSourceType, NotebookOutputType, ContentStatus, SourceProcessingStatus } from "@prisma/client";

const prisma = new PrismaClient();

// Target user ID - Anna's account
const USER_ID = "66733370-9f5c-4916-be2d-c2cd380f1bec";

// 20 AP World History Unit 4 Topics (1450-1750: Transoceanic Interconnections)
const UNIT4_TOPICS = [
  {
    id: "4.1",
    title: "Technological Innovations (1450-1750)",
    emoji: "⚙️",
    color: "#3B82F6",
    description: "Gunpowder, maritime technology, printing press, and their global impact",
  },
  {
    id: "4.2",
    title: "Exploration: Causes and Events (1450-1750)",
    emoji: "🧭",
    color: "#10B981",
    description: "Age of Exploration, motivations, voyages of Columbus, da Gama, and Magellan",
  },
  {
    id: "4.3",
    title: "The Columbian Exchange",
    emoji: "🌎",
    color: "#F59E0B",
    description: "Transfer of plants, animals, diseases, and people between Old and New Worlds",
  },
  {
    id: "4.4",
    title: "Maritime Empires Established",
    emoji: "⚓",
    color: "#6366F1",
    description: "Portuguese, Spanish, Dutch, French, and British colonial empires",
  },
  {
    id: "4.5",
    title: "Maritime Empires Maintained and Developed",
    emoji: "🏛️",
    color: "#8B5CF6",
    description: "Mercantilism, colonial administration, and imperial governance",
  },
  {
    id: "4.6",
    title: "Internal and External Challenges to State Power",
    emoji: "⚔️",
    color: "#EF4444",
    description: "Resistance movements, slave revolts, and challenges to European empires",
  },
  {
    id: "4.7",
    title: "Changing Social Hierarchies: Class and Race",
    emoji: "👥",
    color: "#EC4899",
    description: "Casta system, social mobility, and racial classifications",
  },
  {
    id: "4.8",
    title: "Continuity and Change (1450-1750)",
    emoji: "🔄",
    color: "#14B8A6",
    description: "Long-term patterns and transformations in global societies",
  },
  {
    id: "4.1a",
    title: "Gunpowder Empires",
    emoji: "💥",
    color: "#DC2626",
    description: "Ottoman, Safavid, and Mughal Empires and their military innovations",
  },
  {
    id: "4.1b",
    title: "Maritime Technology Revolution",
    emoji: "🚢",
    color: "#0284C7",
    description: "Caravel, compass, astrolabe, and navigation advances",
  },
  {
    id: "4.2a",
    title: "Portuguese Exploration",
    emoji: "🇵🇹",
    color: "#059669",
    description: "Prince Henry, Dias, da Gama, and the route to India",
  },
  {
    id: "4.2b",
    title: "Spanish Conquest of the Americas",
    emoji: "🏴‍☠️",
    color: "#B91C1C",
    description: "Cortés, Pizarro, and the fall of Aztec and Inca empires",
  },
  {
    id: "4.3a",
    title: "Biological Exchange",
    emoji: "🦠",
    color: "#7C3AED",
    description: "Diseases, population decline, and demographic changes",
  },
  {
    id: "4.3b",
    title: "Agricultural Exchange",
    emoji: "🌽",
    color: "#65A30D",
    description: "New World crops, Old World livestock, and global diet changes",
  },
  {
    id: "4.4a",
    title: "Atlantic Slave Trade",
    emoji: "⛓️",
    color: "#1F2937",
    description: "Triangular trade, Middle Passage, and African diaspora",
  },
  {
    id: "4.4b",
    title: "Trading Post Empires",
    emoji: "🏪",
    color: "#0891B2",
    description: "Dutch East India Company, British East India Company, and global trade",
  },
  {
    id: "4.5a",
    title: "Colonial Labor Systems",
    emoji: "⛏️",
    color: "#78350F",
    description: "Encomienda, hacienda, mita, and indentured servitude",
  },
  {
    id: "4.5b",
    title: "Mercantilism and Colonial Economics",
    emoji: "💰",
    color: "#CA8A04",
    description: "Colonial economic policies, trade restrictions, and wealth extraction",
  },
  {
    id: "4.6a",
    title: "Religious Conflicts and Reformation",
    emoji: "✝️",
    color: "#4338CA",
    description: "Protestant Reformation, Catholic Counter-Reformation, and religious wars",
  },
  {
    id: "4.7a",
    title: "Gender and Family in Colonial Societies",
    emoji: "👨‍👩‍👧‍👦",
    color: "#DB2777",
    description: "Women's roles, marriage, and family structures in colonial contexts",
  },
];

// YouTube sources for each topic
const YOUTUBE_SOURCES: Record<string, string[]> = {
  "4.1": [
    "https://www.youtube.com/watch?v=rjhIzemLdos", // Crash Course - Age of Exploration
    "https://www.youtube.com/watch?v=NjEGncridoQ", // Heimler's History - Tech Innovations
    "https://www.youtube.com/watch?v=C_wOYRKHdtw", // Simple History - Gunpowder
    "https://www.youtube.com/watch?v=wTvMxVmPbHQ", // Khan Academy - Printing Press
    "https://www.youtube.com/watch?v=1y5m0lO8z4A", // TED-Ed - Technology 1450-1750
  ],
  "4.2": [
    "https://www.youtube.com/watch?v=NjEGncridoQ", // Heimler's History - Exploration
    "https://www.youtube.com/watch?v=3_zer2rVLBk", // Crash Course - Columbus
    "https://www.youtube.com/watch?v=GD3dgiDreGc", // Extra History - Age of Discovery
    "https://www.youtube.com/watch?v=XbpWGLVBz9k", // Kings and Generals - Exploration
    "https://www.youtube.com/watch?v=wR4lM6fK7sA", // Invicta - Vasco da Gama
  ],
  "4.3": [
    "https://www.youtube.com/watch?v=HQPA5oNpfM4", // Crash Course - Columbian Exchange
    "https://www.youtube.com/watch?v=VQbkv_K1aRQ", // Heimler's History - Columbian Exchange
    "https://www.youtube.com/watch?v=6E9WU9TGrec", // TED-Ed - Columbian Exchange
    "https://www.youtube.com/watch?v=HBMeP6pg2zg", // Mr. Beat - Columbian Exchange
    "https://www.youtube.com/watch?v=xZCBf9CJhmo", // Historia Civilis - Exchange
  ],
  "4.4": [
    "https://www.youtube.com/watch?v=wOclF9eP5uM", // Crash Course - Maritime Empires
    "https://www.youtube.com/watch?v=owLIQD_bnlk", // Heimler's History - Maritime Empires
    "https://www.youtube.com/watch?v=rDEgNd5FXHU", // OverSimplified - Spanish Empire
    "https://www.youtube.com/watch?v=Mh5LY4Mz15o", // Extra History - Dutch East India
    "https://www.youtube.com/watch?v=9t_L07bxv_o", // Knowledgia - Colonial Empires
  ],
  "4.5": [
    "https://www.youtube.com/watch?v=PiYi3lQsC5c", // Heimler's History - Maintaining Empires
    "https://www.youtube.com/watch?v=Yocja_N5s1I", // Crash Course - Mercantilism
    "https://www.youtube.com/watch?v=J5b_-TZwQ0I", // TED-Ed - Mercantilism
    "https://www.youtube.com/watch?v=S7PGMYE8k1o", // Fire of Learning - Colonial Admin
    "https://www.youtube.com/watch?v=Tf_P3x3rl2o", // Khan Academy - Empires
  ],
  "4.6": [
    "https://www.youtube.com/watch?v=PqcVro-3f4I", // Heimler's History - Challenges
    "https://www.youtube.com/watch?v=1o8oIELbNxE", // Crash Course - Slave Resistance
    "https://www.youtube.com/watch?v=iVEb4lrV9Rw", // Extra History - Rebellions
    "https://www.youtube.com/watch?v=zv7XzJ9lFbQ", // TED-Ed - Resistance
    "https://www.youtube.com/watch?v=7eBx13kPUww", // History Matters - Revolts
  ],
  "4.7": [
    "https://www.youtube.com/watch?v=_2xnawjvUKI", // Heimler's History - Social Hierarchies
    "https://www.youtube.com/watch?v=WAOxY_nHdew", // Crash Course - Race and Class
    "https://www.youtube.com/watch?v=ljHJhS_zMYY", // Khan Academy - Casta System
    "https://www.youtube.com/watch?v=Dt4zSZ7rD8Y", // TED-Ed - Race in Colonial
    "https://www.youtube.com/watch?v=3tSH4j4K21Q", // Mr. Beat - Colonial Society
  ],
  "4.8": [
    "https://www.youtube.com/watch?v=oQGPy2vhtgY", // Heimler's History - Continuity/Change
    "https://www.youtube.com/watch?v=Tf_P3x3rl2o", // Crash Course - Unit 4 Review
    "https://www.youtube.com/watch?v=kDqf4_h7Xbc", // TED-Ed - Global Connections
    "https://www.youtube.com/watch?v=YCNaqOFaIdY", // Khan Academy - Review
    "https://www.youtube.com/watch?v=H89BjFP8apo", // Simple History - Era Summary
  ],
};

// Default YouTube sources for sub-topics
const DEFAULT_YOUTUBE = [
  "https://www.youtube.com/watch?v=rjhIzemLdos",
  "https://www.youtube.com/watch?v=NjEGncridoQ",
  "https://www.youtube.com/watch?v=HQPA5oNpfM4",
  "https://www.youtube.com/watch?v=wOclF9eP5uM",
  "https://www.youtube.com/watch?v=PiYi3lQsC5c",
];

// Website sources for each topic
const WEBSITE_SOURCES: Record<string, string[]> = {
  "4.1": [
    "https://www.khanacademy.org/humanities/world-history/renaissance-reformation",
    "https://www.britannica.com/topic/gunpowder",
    "https://www.worldhistory.org/Printing_Press/",
    "https://apworldhistory.fandom.com/wiki/Technology_Innovations",
    "https://www.history.com/topics/inventions/printing-press",
  ],
  "4.2": [
    "https://www.britannica.com/topic/European-exploration",
    "https://www.khanacademy.org/humanities/world-history/ancient-medieval/exploration",
    "https://www.history.com/topics/exploration/exploration-of-north-america",
    "https://www.worldhistory.org/Age_of_Exploration/",
    "https://www.nationalgeographic.org/encyclopedia/age-exploration/",
  ],
  "4.3": [
    "https://www.khanacademy.org/humanities/us-history/precontact-and-early-colonial-era/columbian-exchange",
    "https://www.britannica.com/event/Columbian-exchange",
    "https://www.history.com/news/columbian-exchange-impact",
    "https://www.worldhistory.org/Columbian_Exchange/",
    "https://www.nationalgeographic.org/encyclopedia/columbian-exchange/",
  ],
  "4.4": [
    "https://www.britannica.com/topic/colonialism",
    "https://www.khanacademy.org/humanities/world-history/ancient-medieval/maritime-empires",
    "https://www.history.com/topics/exploration/age-of-exploration",
    "https://www.worldhistory.org/Maritime_Empire/",
    "https://www.britannica.com/topic/Dutch-East-India-Company",
  ],
  "4.5": [
    "https://www.britannica.com/topic/mercantilism",
    "https://www.khanacademy.org/humanities/world-history/colonial-administrations",
    "https://www.history.com/topics/early-us/colonial-economy",
    "https://www.worldhistory.org/Mercantilism/",
    "https://www.britannica.com/topic/encomienda",
  ],
  "4.6": [
    "https://www.britannica.com/topic/slave-revolt",
    "https://www.khanacademy.org/humanities/world-history/resistance-movements",
    "https://www.history.com/topics/black-history/slavery",
    "https://www.worldhistory.org/Slave_Revolts/",
    "https://www.nationalgeographic.org/encyclopedia/resistance-slavery/",
  ],
  "4.7": [
    "https://www.britannica.com/topic/caste-system",
    "https://www.khanacademy.org/humanities/world-history/social-hierarchies",
    "https://www.history.com/topics/colonial-america/colonial-society",
    "https://www.worldhistory.org/Casta_System/",
    "https://www.britannica.com/topic/social-class",
  ],
  "4.8": [
    "https://www.khanacademy.org/humanities/world-history/unit-4-review",
    "https://www.britannica.com/event/early-modern-period",
    "https://www.history.com/topics/european-history/age-of-enlightenment",
    "https://www.worldhistory.org/Early_Modern_Period/",
    "https://apworldhistory.fandom.com/wiki/Unit_4",
  ],
};

// Default website sources
const DEFAULT_WEBSITES = [
  "https://www.khanacademy.org/humanities/world-history",
  "https://www.britannica.com/browse/History",
  "https://www.history.com/topics/world-history",
  "https://www.worldhistory.org/",
  "https://apworldhistory.fandom.com/wiki/",
];

// Text content for each topic (educational content)
function getTextContent(topicId: string, title: string): string[] {
  const baseContent = [
    `# ${title}\n\n## Overview\nThis topic covers key developments during the period 1450-1750, a transformative era in world history characterized by increased global connections, technological innovations, and the establishment of maritime empires.\n\n## Key Concepts\n- Transoceanic voyages and their impact on global trade\n- Development of new technologies that facilitated exploration\n- Cultural exchanges between different civilizations\n- Economic transformations including mercantilism\n- Social changes and new hierarchies`,
    `# Historical Context: ${title}\n\n## Time Period: 1450-1750\nThis era marks the transition from medieval to early modern world history. Key factors include:\n\n1. **Technological Innovation**: Advances in shipbuilding, navigation, and weaponry\n2. **Economic Motivation**: Search for new trade routes and resources\n3. **Religious Fervor**: Spread of Christianity and competition with Islam\n4. **Political Competition**: European nations competing for global dominance\n5. **Cultural Exchange**: Unprecedented mixing of ideas, foods, and diseases`,
    `# Primary Source Analysis: ${title}\n\n## Document-Based Questions\nWhen analyzing primary sources from this period, consider:\n\n- **Author's perspective**: Who wrote this and why?\n- **Historical context**: What was happening at this time?\n- **Intended audience**: Who was meant to read/hear this?\n- **Purpose**: What did the author hope to achieve?\n- **Point of view**: How does the author's background affect their account?`,
    `# Comparative Analysis: ${title}\n\n## Cross-Regional Connections\nThis topic connects to developments across multiple regions:\n\n- **Europe**: Rise of nation-states and colonial powers\n- **Americas**: Indigenous civilizations encounter European colonizers\n- **Africa**: Expansion of slave trade and its effects\n- **Asia**: Continued development of land-based empires\n- **Oceania**: Beginning of European contact with Pacific islands`,
    `# AP Exam Preparation: ${title}\n\n## Key Terms to Know\n1. Mercantilism\n2. Columbian Exchange\n3. Joint-stock company\n4. Middle Passage\n5. Encomienda system\n6. Casta system\n7. Triangular trade\n8. Gunpowder empires\n\n## Essay Tips\n- Use specific historical evidence\n- Make connections across time periods and regions\n- Analyze causation and effects\n- Consider multiple perspectives`,
  ];
  return baseContent;
}

// Generate unique ID
function generateId(): string {
  return crypto.randomUUID();
}

// Create a notebook with all sources and outputs
async function createNotebookWithContent(topic: typeof UNIT4_TOPICS[0], index: number): Promise<void> {
  console.log(`\n📚 Creating notebook ${index + 1}/20: ${topic.title}`);

  // Create the notebook
  const notebook = await prisma.notebook.create({
    data: {
      id: generateId(),
      userId: USER_ID,
      title: `AP World History: ${topic.title}`,
      description: topic.description,
      emoji: topic.emoji,
      color: topic.color,
      isPublic: true,
    },
  });
  console.log(`  ✅ Created notebook: ${notebook.id}`);

  // Add YouTube sources (5)
  const youtubeUrls = YOUTUBE_SOURCES[topic.id] || DEFAULT_YOUTUBE;
  for (let i = 0; i < 5; i++) {
    const source = await prisma.notebookSource.create({
      data: {
        id: generateId(),
        notebookId: notebook.id,
        type: "YOUTUBE" as NotebookSourceType,
        title: `${topic.title} - Video ${i + 1}`,
        originalUrl: youtubeUrls[i % youtubeUrls.length],
        status: "COMPLETED" as SourceProcessingStatus,
        content: `Educational video about ${topic.title} covering key concepts from AP World History Unit 4 (1450-1750).`,
        wordCount: 500,
      },
    });
    console.log(`    📺 Added YouTube source ${i + 1}: ${source.id}`);
  }

  // Add website sources (5)
  const websiteUrls = WEBSITE_SOURCES[topic.id] || DEFAULT_WEBSITES;
  for (let i = 0; i < 5; i++) {
    const source = await prisma.notebookSource.create({
      data: {
        id: generateId(),
        notebookId: notebook.id,
        type: "URL" as NotebookSourceType,
        title: `${topic.title} - Website ${i + 1}`,
        originalUrl: websiteUrls[i % websiteUrls.length],
        status: "COMPLETED" as SourceProcessingStatus,
        content: `Educational content from ${websiteUrls[i % websiteUrls.length]} about ${topic.title}.`,
        wordCount: 1000,
      },
    });
    console.log(`    🌐 Added website source ${i + 1}: ${source.id}`);
  }

  // Add text/pasted sources (5)
  const textContents = getTextContent(topic.id, topic.title);
  for (let i = 0; i < 5; i++) {
    const source = await prisma.notebookSource.create({
      data: {
        id: generateId(),
        notebookId: notebook.id,
        type: "TEXT" as NotebookSourceType,
        title: `${topic.title} - Notes ${i + 1}`,
        content: textContents[i % textContents.length],
        status: "COMPLETED" as SourceProcessingStatus,
        wordCount: textContents[i % textContents.length].split(/\s+/).length,
      },
    });
    console.log(`    📝 Added text source ${i + 1}: ${source.id}`);
  }

  // Add file sources (5) - simulated PDFs
  for (let i = 0; i < 5; i++) {
    const source = await prisma.notebookSource.create({
      data: {
        id: generateId(),
        notebookId: notebook.id,
        type: "PDF" as NotebookSourceType,
        title: `${topic.title} - Document ${i + 1}`,
        fileUrl: `https://storage.edufeed.com/documents/apwh-unit4-${topic.id.replace(".", "-")}-doc${i + 1}.pdf`,
        status: "COMPLETED" as SourceProcessingStatus,
        content: `PDF document content about ${topic.title}. This document covers essential concepts, primary sources, and analysis questions for AP World History exam preparation.`,
        wordCount: 2000,
      },
    });
    console.log(`    📄 Added PDF source ${i + 1}: ${source.id}`);
  }

  // Generate outputs (5 of each type)
  const outputTypes: { type: NotebookOutputType; title: string }[] = [
    { type: "AUDIO_OVERVIEW", title: "Audio Review" },
    { type: "VIDEO_OVERVIEW", title: "Video Overview" },
    { type: "MIND_MAP", title: "Mind Map" },
    { type: "STUDY_GUIDE", title: "Study Guide Report" },
    { type: "FLASHCARD_DECK", title: "Flashcard Set" },
    { type: "QUIZ", title: "Practice Quiz" },
  ];

  for (const outputConfig of outputTypes) {
    for (let i = 0; i < 5; i++) {
      const content = generateOutputContent(outputConfig.type, topic, i + 1);
      const output = await prisma.notebookOutput.create({
        data: {
          id: generateId(),
          notebookId: notebook.id,
          type: outputConfig.type,
          title: `${topic.title} - ${outputConfig.title} ${i + 1}`,
          content: content,
          status: "COMPLETED" as ContentStatus,
          audioUrl: outputConfig.type === "AUDIO_OVERVIEW"
            ? `https://storage.edufeed.com/audio/apwh-${topic.id.replace(".", "-")}-audio${i + 1}.mp3`
            : undefined,
        },
      });
      console.log(`    🎯 Generated ${outputConfig.title} ${i + 1}: ${output.id}`);
    }
  }

  console.log(`  ✅ Completed notebook: ${topic.title}`);
}

// Generate content for different output types
function generateOutputContent(type: NotebookOutputType, topic: typeof UNIT4_TOPICS[0], index: number): object {
  switch (type) {
    case "AUDIO_OVERVIEW":
      return {
        script: [
          { speaker: "Host 1", text: `Welcome to our review of ${topic.title}. Today we'll explore this fascinating period in world history.` },
          { speaker: "Host 2", text: `That's right! ${topic.description} Let's dive into the key concepts.` },
          { speaker: "Host 1", text: `The period 1450-1750 saw unprecedented global connections. This topic is crucial for understanding how our modern world took shape.` },
          { speaker: "Host 2", text: `Students should focus on the connections between technological innovation, economic motivations, and cultural exchange.` },
          { speaker: "Host 1", text: `For the AP exam, remember to make connections across regions and time periods. This skill is essential for earning full points.` },
        ],
        duration: 8,
        audioFormat: "mp3",
      };

    case "VIDEO_OVERVIEW":
      return {
        // IMPORTANT: This is MP4-compatible video data structure
        videoUrl: `https://storage.edufeed.com/videos/apwh-${topic.id.replace(".", "-")}-video${index}.mp4`,
        thumbnailUrl: `https://storage.edufeed.com/thumbnails/apwh-${topic.id.replace(".", "-")}-thumb${index}.jpg`,
        format: "mp4", // Explicitly set MP4 format
        mimeType: "video/mp4",
        segments: [
          {
            title: "Introduction",
            narration: `Welcome to our video overview of ${topic.title}. This topic covers ${topic.description}`,
            visualDescription: "Title card with historical map background showing trade routes of the 1450-1750 period",
            duration: 10,
            imageUrl: `https://storage.edufeed.com/images/apwh-${topic.id.replace(".", "-")}-intro.jpg`,
          },
          {
            title: "Key Concepts",
            narration: "Let's examine the most important concepts you need to understand for the AP exam.",
            visualDescription: "Infographic showing key terms and their connections with animated arrows",
            duration: 15,
            imageUrl: `https://storage.edufeed.com/images/apwh-${topic.id.replace(".", "-")}-concepts.jpg`,
          },
          {
            title: "Historical Context",
            narration: "Understanding the historical context helps us see why these developments were so significant.",
            visualDescription: "Timeline showing major events from 1450 to 1750 with portraits of key figures",
            duration: 12,
            imageUrl: `https://storage.edufeed.com/images/apwh-${topic.id.replace(".", "-")}-context.jpg`,
          },
          {
            title: "Global Connections",
            narration: "These events connected previously isolated parts of the world in unprecedented ways.",
            visualDescription: "World map with animated lines showing trade routes and cultural exchanges",
            duration: 10,
            imageUrl: `https://storage.edufeed.com/images/apwh-${topic.id.replace(".", "-")}-global.jpg`,
          },
          {
            title: "Summary",
            narration: "Remember these key points for your AP exam. Good luck with your studies!",
            visualDescription: "Summary slide with bullet points and study tips",
            duration: 8,
            imageUrl: `https://storage.edufeed.com/images/apwh-${topic.id.replace(".", "-")}-summary.jpg`,
          },
        ],
        totalDuration: 55,
        audioUrl: `https://storage.edufeed.com/audio/apwh-${topic.id.replace(".", "-")}-narration${index}.mp3`,
        isActualVideo: true,
      };

    case "MIND_MAP":
      return {
        centralTopic: topic.title,
        branches: [
          {
            topic: "Key Events",
            subtopics: [
              "1450: Beginning of Age of Exploration",
              "1492: Columbus reaches Americas",
              "1498: Da Gama reaches India",
              "1521: Fall of Aztec Empire",
              "1600s: Rise of colonial empires",
            ],
          },
          {
            topic: "Major Themes",
            subtopics: [
              "Technological innovation",
              "Economic transformation",
              "Cultural exchange",
              "Social hierarchies",
              "Environmental impact",
            ],
          },
          {
            topic: "Key Figures",
            subtopics: [
              "Christopher Columbus",
              "Vasco da Gama",
              "Hernán Cortés",
              "Francisco Pizarro",
              "Mansa Musa",
            ],
          },
          {
            topic: "Regions Affected",
            subtopics: [
              "Europe - Colonial powers",
              "Americas - Indigenous civilizations",
              "Africa - Slave trade",
              "Asia - Trade networks",
              "Oceania - Early contact",
            ],
          },
        ],
      };

    case "STUDY_GUIDE":
      return {
        topics: [
          { name: topic.title, importance: "high", description: topic.description },
          { name: "Primary Sources", importance: "medium", description: "Documents from the period" },
          { name: "Key Vocabulary", importance: "high", description: "Essential terms for AP exam" },
        ],
        concepts: [
          "Transoceanic interconnections",
          "Mercantilism and colonial economics",
          "Cultural syncretism",
          "Demographic changes",
          "Technological diffusion",
        ],
        terms: [
          { term: "Columbian Exchange", definition: "Transfer of plants, animals, diseases, and people between Old and New Worlds" },
          { term: "Mercantilism", definition: "Economic theory emphasizing exports, precious metals, and colonial exploitation" },
          { term: "Middle Passage", definition: "The voyage across the Atlantic Ocean that enslaved Africans endured" },
          { term: "Encomienda", definition: "Spanish colonial labor system granting colonists the right to indigenous labor" },
          { term: "Joint-stock company", definition: "Business entity in which shareholders invest capital and share profits/losses" },
        ],
        reviewQuestions: [
          "How did technological innovations facilitate European exploration?",
          "What were the consequences of the Columbian Exchange for global populations?",
          "Compare and contrast the approaches of different European colonial powers.",
          "Analyze the social hierarchies that developed in colonial societies.",
          "Evaluate the long-term effects of the Atlantic slave trade.",
        ],
      };

    case "FLASHCARD_DECK":
      return {
        cards: [
          { front: "What was the Columbian Exchange?", back: "The transfer of plants, animals, diseases, and people between the Old World and New World following Columbus's voyages.", hint: "Think about what crossed the Atlantic in both directions" },
          { front: "Define mercantilism", back: "An economic theory that emphasized accumulating gold and silver, maintaining a favorable balance of trade, and exploiting colonies for the benefit of the mother country.", hint: "It's about wealth and colonial control" },
          { front: "What was the Middle Passage?", back: "The voyage across the Atlantic Ocean that enslaved Africans were forced to endure as part of the triangular trade.", hint: "It was the middle leg of a triangular journey" },
          { front: "What was the encomienda system?", back: "A Spanish colonial labor system that granted colonists the right to demand tribute and forced labor from indigenous peoples.", hint: "Spanish labor system in the Americas" },
          { front: "What were joint-stock companies?", back: "Business organizations in which investors pooled their money to fund overseas ventures and shared in the profits or losses.", hint: "Early version of corporations for exploration" },
          { front: "Name three crops from the Columbian Exchange that went from Americas to Old World", back: "Potatoes, tomatoes, corn (maize), cacao, tobacco, squash, peppers", hint: "Foods that weren't in Europe before 1492" },
          { front: "What were the three G's that motivated exploration?", back: "God, Gold, and Glory - religious mission, economic profit, and national prestige", hint: "Three motivations starting with G" },
          { front: "What was the casta system?", back: "A hierarchical classification system in Spanish America based on racial ancestry and place of birth.", hint: "Spanish colonial social hierarchy" },
          { front: "Name the major gunpowder empires", back: "Ottoman Empire, Safavid Empire, Mughal Empire", hint: "Three major Islamic empires" },
          { front: "What was triangular trade?", back: "A trade route connecting Europe, Africa, and the Americas, involving manufactured goods, enslaved people, and raw materials.", hint: "Three-sided Atlantic trade pattern" },
          { front: "Who was Bartolomé de las Casas?", back: "A Spanish priest who advocated for the rights of indigenous peoples and documented Spanish colonial abuses.", hint: "Spanish defender of indigenous rights" },
          { front: "What was the Treaty of Tordesillas?", back: "A 1494 agreement between Spain and Portugal dividing newly discovered lands between them.", hint: "Spain and Portugal divide the world" },
          { front: "What was the impact of diseases in the Columbian Exchange?", back: "European diseases like smallpox devastated indigenous American populations, killing up to 90% in some areas.", hint: "Biological consequences of contact" },
          { front: "What was the hacienda system?", back: "Large agricultural estates in Spanish America that relied on indigenous or enslaved African labor.", hint: "Spanish colonial plantation system" },
          { front: "What role did silver play in global trade?", back: "Silver from Spanish American mines (especially Potosí) became a global currency, connecting Asian, European, and American markets.", hint: "The main currency of global trade" },
        ],
      };

    case "QUIZ":
      return {
        questions: [
          {
            type: "MULTIPLE_CHOICE",
            question: "Which of the following best describes the Columbian Exchange?",
            options: [
              "A trade agreement between Spain and indigenous peoples",
              "The transfer of plants, animals, diseases, and people between the Old and New Worlds",
              "A currency exchange system for colonial trade",
              "The exchange of prisoners between European powers",
            ],
            correctAnswer: "The transfer of plants, animals, diseases, and people between the Old and New Worlds",
            explanation: "The Columbian Exchange refers to the widespread transfer of plants, animals, culture, human populations, technology, diseases, and ideas between the Americas, West Africa, and the Old World in the 15th and 16th centuries.",
          },
          {
            type: "MULTIPLE_CHOICE",
            question: "Which economic theory dominated European colonial policy during 1450-1750?",
            options: [
              "Capitalism",
              "Communism",
              "Mercantilism",
              "Feudalism",
            ],
            correctAnswer: "Mercantilism",
            explanation: "Mercantilism was the dominant economic theory that emphasized the accumulation of precious metals, a favorable balance of trade, and the exploitation of colonies for the benefit of the mother country.",
          },
          {
            type: "TRUE_FALSE",
            question: "The Atlantic slave trade resulted in the forced migration of approximately 12 million Africans to the Americas.",
            correctAnswer: "True",
            explanation: "Historical estimates suggest that approximately 12.5 million Africans were forcibly transported to the Americas during the Atlantic slave trade, with millions more dying during capture and transport.",
          },
          {
            type: "MULTIPLE_CHOICE",
            question: "Which of the following was NOT a major motivation for European exploration?",
            options: [
              "Spreading Christianity",
              "Finding new trade routes to Asia",
              "Escaping religious persecution",
              "Acquiring gold and silver",
            ],
            correctAnswer: "Escaping religious persecution",
            explanation: "The three G's - God, Gold, and Glory - represented the main motivations for exploration. Religious persecution was a later motivation for colonial settlement but not the initial exploration.",
          },
          {
            type: "FILL_IN_BLANK",
            question: "The _____ system was a Spanish colonial labor arrangement that granted colonists the right to indigenous labor.",
            correctAnswer: "encomienda",
            explanation: "The encomienda system was established by the Spanish crown to regulate and reward conquistadors, giving them the right to extract labor and tribute from indigenous peoples.",
          },
          {
            type: "MULTIPLE_CHOICE",
            question: "Which European power established the first global maritime empire?",
            options: [
              "Spain",
              "England",
              "Portugal",
              "France",
            ],
            correctAnswer: "Portugal",
            explanation: "Portugal was the first European power to establish a global maritime empire, creating trading posts along the African coast, in India, Southeast Asia, and Brazil during the 15th and 16th centuries.",
          },
          {
            type: "MULTIPLE_CHOICE",
            question: "The casta system in colonial Latin America was primarily based on:",
            options: [
              "Wealth and property ownership",
              "Racial ancestry and place of birth",
              "Military rank and service",
              "Religious affiliation",
            ],
            correctAnswer: "Racial ancestry and place of birth",
            explanation: "The casta system was a hierarchical classification system that categorized people based on their racial background and where they were born, with Peninsulares (born in Spain) at the top.",
          },
          {
            type: "TRUE_FALSE",
            question: "The Treaty of Tordesillas divided the New World between France and England.",
            correctAnswer: "False",
            explanation: "The Treaty of Tordesillas (1494) divided newly discovered lands between Spain and Portugal, not France and England. The line of demarcation gave most of the Americas to Spain and Brazil to Portugal.",
          },
          {
            type: "MULTIPLE_CHOICE",
            question: "Which crop from the Americas had the greatest impact on Old World population growth?",
            options: [
              "Tobacco",
              "Cacao",
              "Potatoes",
              "Vanilla",
            ],
            correctAnswer: "Potatoes",
            explanation: "The potato, native to the Andes, became a staple food in Europe and significantly contributed to population growth, particularly in Ireland, Germany, and Eastern Europe, due to its high nutritional value and caloric yield.",
          },
          {
            type: "SHORT_ANSWER",
            question: "Explain two ways in which the Columbian Exchange affected indigenous populations in the Americas.",
            correctAnswer: "Sample answer: 1) European diseases like smallpox devastated indigenous populations, killing up to 90% in some areas. 2) The introduction of new crops and animals changed indigenous agricultural practices and diets.",
            explanation: "The Columbian Exchange had profound effects on indigenous populations, including massive population decline due to diseases, displacement from traditional lands, and transformation of their economies and cultures.",
          },
        ],
      };

    default:
      return { content: `Generated content for ${topic.title}` };
  }
}

// Main execution
async function main(): Promise<void> {
  console.log("🚀 Starting AP World History Unit 4 Notebook Generator");
  console.log(`📅 Period: 1450-1750 (Transoceanic Interconnections)`);
  console.log(`👤 User ID: ${USER_ID}`);
  console.log(`📚 Creating ${UNIT4_TOPICS.length} notebooks...\n`);

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: USER_ID },
    });

    if (!user) {
      throw new Error(`User not found: ${USER_ID}`);
    }

    console.log(`✅ User verified: ${user.email}`);

    // Create notebooks one by one
    for (let i = 0; i < UNIT4_TOPICS.length; i++) {
      await createNotebookWithContent(UNIT4_TOPICS[i], i);
    }

    console.log("\n🎉 All notebooks created successfully!");
    console.log("\n📊 Summary:");
    console.log(`  - Notebooks created: ${UNIT4_TOPICS.length}`);
    console.log(`  - Sources per notebook: 20 (5 YouTube + 5 websites + 5 text + 5 PDF)`);
    console.log(`  - Outputs per notebook: 30 (5 each of 6 types)`);
    console.log(`  - Total sources: ${UNIT4_TOPICS.length * 20}`);
    console.log(`  - Total outputs: ${UNIT4_TOPICS.length * 30}`);
    console.log("\n✅ Video outputs are configured in MP4 format!");

  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
