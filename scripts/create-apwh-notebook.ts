/**
 * APWH Notebook Creation Script
 * Creates an AP World History notebook with 40 sources:
 * - 10 YouTube videos
 * - 10 PDF references
 * - 10 Website URLs
 * - 10 Pasted text entries
 *
 * Run: npx ts-node scripts/create-apwh-notebook.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// AP World History YouTube Videos (educational content)
const youtubeUrls = [
  { title: 'Ancient Mesopotamia - Crash Course World History', url: 'https://www.youtube.com/watch?v=sohXPx_XZ6Y' },
  { title: 'The Silk Road - Crash Course World History', url: 'https://www.youtube.com/watch?v=vfe-eNq-Qyg' },
  { title: 'The Roman Empire - Crash Course World History', url: 'https://www.youtube.com/watch?v=oPf27gAup9U' },
  { title: 'The Mongol Empire - Crash Course World History', url: 'https://www.youtube.com/watch?v=szxPar0BcMo' },
  { title: 'The Renaissance - Crash Course World History', url: 'https://www.youtube.com/watch?v=Vufba_ZDit0' },
  { title: 'The Age of Exploration - Crash Course World History', url: 'https://www.youtube.com/watch?v=wOclF9eP5uU' },
  { title: 'The Industrial Revolution - Crash Course World History', url: 'https://www.youtube.com/watch?v=zhL5DCizj5c' },
  { title: 'World War I - Crash Course World History', url: 'https://www.youtube.com/watch?v=_XPZQ0LAlR4' },
  { title: 'World War II - Crash Course World History', url: 'https://www.youtube.com/watch?v=Q78COTwT7nE' },
  { title: 'The Cold War - Crash Course World History', url: 'https://www.youtube.com/watch?v=y9HjvHZfCUI' },
];

// AP World History Website URLs
const websiteUrls = [
  { title: 'World History Encyclopedia - Ancient Civilizations', url: 'https://www.worldhistory.org/collection/2/ancient-civilizations/' },
  { title: 'Khan Academy - World History', url: 'https://www.khanacademy.org/humanities/world-history' },
  { title: 'AP World History Study Guide - Princeton Review', url: 'https://www.princetonreview.com/college/ap-world-history-test' },
  { title: 'BBC History - World War I', url: 'https://www.bbc.co.uk/history/worldwars/wwone/' },
  { title: 'National Geographic - Ancient Rome', url: 'https://www.nationalgeographic.com/culture/article/ancient-rome' },
  { title: 'Smithsonian - Silk Road Trade Routes', url: 'https://www.smithsonianmag.com/history/ancient-silk-road-180966722/' },
  { title: 'History.com - The Renaissance', url: 'https://www.history.com/topics/renaissance/renaissance' },
  { title: 'Encyclopedia Britannica - Mongol Empire', url: 'https://www.britannica.com/place/Mongol-empire' },
  { title: 'World History Project - Industrial Revolution', url: 'https://www.worldhistoryproject.org/topic/industrial-revolution' },
  { title: 'AP Central - World History Exam Resources', url: 'https://apcentral.collegeboard.org/courses/ap-world-history' },
];

// AP World History PDF References (using placeholder URLs - these would be actual PDFs)
const pdfUrls = [
  { title: 'AP World History Course and Exam Description', fileUrl: 'https://apcentral.collegeboard.org/pdf/ap-world-history-ced.pdf' },
  { title: 'World History Themes and Patterns', fileUrl: 'https://example.com/world-history-themes.pdf' },
  { title: 'Ancient Civilizations Overview', fileUrl: 'https://example.com/ancient-civilizations.pdf' },
  { title: 'The Columbian Exchange - Impact Analysis', fileUrl: 'https://example.com/columbian-exchange.pdf' },
  { title: 'Global Trade Networks 1450-1750', fileUrl: 'https://example.com/global-trade.pdf' },
  { title: 'Imperialism and Its Effects', fileUrl: 'https://example.com/imperialism.pdf' },
  { title: 'Revolutions Study Guide', fileUrl: 'https://example.com/revolutions.pdf' },
  { title: 'World War I Primary Sources', fileUrl: 'https://example.com/wwi-sources.pdf' },
  { title: 'Decolonization Movements', fileUrl: 'https://example.com/decolonization.pdf' },
  { title: 'Cold War Era Analysis', fileUrl: 'https://example.com/cold-war.pdf' },
];

// AP World History Pasted Text Content
const textContent = [
  {
    title: 'Unit 1: Global Prehistory to 600 BCE',
    content: `The development of agriculture fundamentally transformed human societies. The Neolithic Revolution, beginning around 10,000 BCE, marked the transition from nomadic hunter-gatherer societies to settled agricultural communities. This shift enabled population growth, the development of complex social hierarchies, and the emergence of early civilizations in river valleys including Mesopotamia, Egypt, the Indus Valley, and China. Key features of early civilizations included writing systems, organized religion, specialized labor, social stratification, and monumental architecture.`
  },
  {
    title: 'Unit 2: Organization and Reorganization of Human Societies',
    content: `From 600 BCE to 600 CE, classical empires emerged across Eurasia. The Roman Empire in the Mediterranean, Han China in East Asia, and the Maurya/Gupta Empires in South Asia developed sophisticated administrative systems, legal codes, and extensive trade networks. The Silk Road connected East and West, facilitating the exchange of goods, ideas, and religions. This era saw the spread of Buddhism, Christianity, and Hinduism, alongside the development of philosophical traditions like Confucianism and Greco-Roman thought.`
  },
  {
    title: 'Unit 3: Regional and Interregional Interactions',
    content: `The period from 600 to 1450 CE witnessed significant expansion of trade networks and the rise of new empires. The Islamic Caliphates spread from Arabia across North Africa and into Spain and Central Asia. The Mongol Empire created the largest contiguous land empire in history, facilitating unprecedented cultural exchange across Eurasia. The Indian Ocean trade network connected East Africa, the Middle East, South Asia, and Southeast Asia through maritime commerce.`
  },
  {
    title: 'Unit 4: Global Interactions 1450-1750',
    content: `The Age of Exploration transformed global connections. European maritime expeditions established new oceanic trade routes and colonial empires in the Americas, Africa, and Asia. The Columbian Exchange transferred plants, animals, diseases, and people across the Atlantic, fundamentally reshaping ecosystems and societies on both sides of the ocean. This era witnessed the rise of capitalism, the Atlantic slave trade, and the beginnings of European global hegemony.`
  },
  {
    title: 'Unit 5: Revolutions and Industrialization',
    content: `The period from 1750 to 1900 brought revolutionary changes through political revolutions (American, French, Haitian, Latin American) and the Industrial Revolution. Industrialization began in Britain and spread to Europe, North America, and Japan, transforming economies from agricultural to industrial bases. New ideologies emerged including nationalism, liberalism, socialism, and feminism. Imperialism intensified as industrialized nations sought raw materials and markets in Africa and Asia.`
  },
  {
    title: 'Unit 6: Accelerating Global Change',
    content: `The 20th century witnessed unprecedented global conflict and transformation. World War I (1914-1918) reshaped the global order, leading to the collapse of empires and the emergence of new nations. The interwar period saw the rise of totalitarian regimes and the Great Depression. World War II (1939-1945) was the deadliest conflict in human history, ending with the atomic bombing of Japan and the emergence of the Cold War between the United States and Soviet Union.`
  },
  {
    title: 'Unit 7: Global Conflict and Decolonization',
    content: `Following World War II, decolonization movements swept across Asia and Africa. India gained independence in 1947, followed by waves of independence movements across Southeast Asia, the Middle East, and Africa. The Cold War divided the world into competing spheres of influence, with proxy conflicts in Korea, Vietnam, and throughout Latin America and Africa. The non-aligned movement emerged as newly independent nations sought alternatives to superpower allegiance.`
  },
  {
    title: 'Unit 8: Contemporary Era',
    content: `The late 20th and early 21st centuries have been characterized by accelerating globalization, technological revolution, and shifting power dynamics. The end of the Cold War in 1991 marked the collapse of the Soviet Union and the emergence of the United States as the sole superpower. Economic globalization has intensified through free trade agreements, multinational corporations, and global supply chains. Digital technology has transformed communication, commerce, and culture worldwide.`
  },
  {
    title: 'Historical Thinking Skills',
    content: `AP World History emphasizes several key historical thinking skills. Causation involves understanding cause-and-effect relationships and how events lead to subsequent developments. Comparison requires analyzing similarities and differences across time periods, regions, and cultures. Contextualization places events within broader historical contexts. Continuity and Change over Time examines patterns of stability and transformation. Argument development involves constructing evidence-based historical arguments using primary and secondary sources.`
  },
  {
    title: 'Key Themes in World History',
    content: `Six major themes run throughout AP World History. Humans and the Environment explores how societies adapt to and modify their environments. Cultural Developments and Interactions examines the creation and spread of religions, philosophies, and artistic traditions. Governance analyzes the development of states, empires, and political systems. Economic Systems traces the evolution of trade, labor, and economic organization. Social Interactions considers hierarchies, gender roles, and family structures. Technology and Innovation explores how new technologies reshape societies.`
  },
];

async function createAPWHNotebook() {
  console.log('🎓 Creating APWH Notebook with 40 sources...\n');

  // Find or create a test user
  let user = await prisma.user.findFirst({
    where: { email: 'apwh-test@example.com' },
  });

  if (!user) {
    console.log('Creating test user...');
    user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email: 'apwh-test@example.com',
        name: 'APWH Test User',
        updatedAt: new Date(),
      },
    });
    console.log(`✅ Created user: ${user.id}\n`);
  } else {
    console.log(`✅ Using existing user: ${user.id}\n`);
  }

  // Create the APWH notebook
  console.log('Creating APWH notebook...');
  const notebook = await prisma.notebook.create({
    data: {
      id: crypto.randomUUID(),
      userId: user.id,
      title: 'APWH - AP World History',
      description: 'Comprehensive AP World History study notebook with 40 sources covering all units from prehistory to the contemporary era.',
      emoji: '🌍',
      color: '#4f46e5',
    },
  });
  console.log(`✅ Created notebook: ${notebook.id}\n`);

  // Add YouTube sources
  console.log('Adding 10 YouTube sources...');
  for (const yt of youtubeUrls) {
    await prisma.notebookSource.create({
      data: {
        id: crypto.randomUUID(),
        notebookId: notebook.id,
        type: 'YOUTUBE',
        title: yt.title,
        originalUrl: yt.url,
        status: 'PENDING',
      },
    });
    console.log(`  ✓ ${yt.title}`);
  }
  console.log('✅ Added 10 YouTube sources\n');

  // Add Website URL sources
  console.log('Adding 10 Website URL sources...');
  for (const web of websiteUrls) {
    await prisma.notebookSource.create({
      data: {
        id: crypto.randomUUID(),
        notebookId: notebook.id,
        type: 'URL',
        title: web.title,
        originalUrl: web.url,
        status: 'PENDING',
      },
    });
    console.log(`  ✓ ${web.title}`);
  }
  console.log('✅ Added 10 Website URL sources\n');

  // Add PDF sources
  console.log('Adding 10 PDF sources...');
  for (const pdf of pdfUrls) {
    await prisma.notebookSource.create({
      data: {
        id: crypto.randomUUID(),
        notebookId: notebook.id,
        type: 'PDF',
        title: pdf.title,
        fileUrl: pdf.fileUrl,
        status: 'PENDING',
      },
    });
    console.log(`  ✓ ${pdf.title}`);
  }
  console.log('✅ Added 10 PDF sources\n');

  // Add Text sources
  console.log('Adding 10 Pasted Text sources...');
  for (const text of textContent) {
    await prisma.notebookSource.create({
      data: {
        id: crypto.randomUUID(),
        notebookId: notebook.id,
        type: 'TEXT',
        title: text.title,
        content: text.content,
        wordCount: text.content.split(/\s+/).length,
        status: 'COMPLETED', // Text sources are immediately available
      },
    });
    console.log(`  ✓ ${text.title}`);
  }
  console.log('✅ Added 10 Pasted Text sources\n');

  // Get final count
  const sourceCount = await prisma.notebookSource.count({
    where: { notebookId: notebook.id },
  });

  console.log('═══════════════════════════════════════════');
  console.log('🎉 APWH Notebook Created Successfully!');
  console.log('═══════════════════════════════════════════');
  console.log(`📚 Notebook ID: ${notebook.id}`);
  console.log(`📖 Title: ${notebook.title}`);
  console.log(`📊 Total Sources: ${sourceCount}`);
  console.log('   - 10 YouTube videos');
  console.log('   - 10 Website URLs');
  console.log('   - 10 PDF documents');
  console.log('   - 10 Pasted text entries');
  console.log('═══════════════════════════════════════════\n');

  return { notebook, sourceCount };
}

// Run the script
createAPWHNotebook()
  .then(({ notebook, sourceCount }) => {
    console.log(`\n✅ Script completed. Notebook ${notebook.id} has ${sourceCount} sources.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
