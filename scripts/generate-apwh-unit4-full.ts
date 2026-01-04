/**
 * Generate 20 AP World History Unit 4 Notebooks
 * Each notebook has:
 * - 5 YouTube sources
 * - 5 File sources (PDFs)
 * - 5 Website sources (URLs)
 * - 5 Pasted text sources
 *
 * Each notebook will generate:
 * - 5 Audio Reviews
 * - 5 Video Overviews
 * - 5 Mind Maps
 * - 5 Reports (Summaries/Study Guides)
 * - 5 Flashcard Decks
 * - 5 Quizzes
 */

import { PrismaClient, NotebookSourceType, NotebookOutputType, ContentStatus, SourceProcessingStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Workers URL for AI generation
const WORKERS_URL = process.env.WORKERS_URL || 'https://edufeed-ai-worker.steep-mouse-b843.workers.dev';

// AP World History Unit 4 Topics (1450-1750: Transoceanic Interconnections)
const UNIT_4_NOTEBOOKS = [
  {
    title: "4.1 - Technological Innovations (1450-1750)",
    emoji: "⚓",
    color: "#3b82f6",
    description: "Maritime technology, navigation tools, and innovations that enabled transoceanic exploration",
  },
  {
    title: "4.1 - Shipbuilding & Navigation",
    emoji: "🧭",
    color: "#6366f1",
    description: "Caravel, carrack, compass, astrolabe, and maritime maps in the Age of Exploration",
  },
  {
    title: "4.2 - Causes of European Exploration",
    emoji: "🌍",
    color: "#8b5cf6",
    description: "Gold, God, and Glory: motivations behind European maritime expansion",
  },
  {
    title: "4.2 - Portuguese Exploration",
    emoji: "🇵🇹",
    color: "#22c55e",
    description: "Prince Henry, Dias, da Gama, and the Portuguese maritime empire",
  },
  {
    title: "4.2 - Spanish Exploration",
    emoji: "🇪🇸",
    color: "#ef4444",
    description: "Columbus, Cortés, Pizarro, and the Spanish conquest of the Americas",
  },
  {
    title: "4.3 - The Columbian Exchange",
    emoji: "🌽",
    color: "#f59e0b",
    description: "Exchange of plants, animals, diseases, and ideas between Old and New Worlds",
  },
  {
    title: "4.3 - Columbian Exchange: Diseases",
    emoji: "🦠",
    color: "#dc2626",
    description: "Impact of smallpox, measles, and other diseases on indigenous populations",
  },
  {
    title: "4.3 - Columbian Exchange: Agriculture",
    emoji: "🌾",
    color: "#84cc16",
    description: "Transfer of crops: potatoes, maize, tobacco, wheat, and sugar",
  },
  {
    title: "4.4 - Maritime Empires: Portugal",
    emoji: "⚔️",
    color: "#059669",
    description: "Portuguese trading posts in Africa, India, and Southeast Asia",
  },
  {
    title: "4.4 - Maritime Empires: Spain",
    emoji: "👑",
    color: "#dc2626",
    description: "Spanish colonial system, encomienda, viceroyalties in Americas",
  },
  {
    title: "4.4 - Maritime Empires: Dutch",
    emoji: "🇳🇱",
    color: "#f97316",
    description: "Dutch East India Company, Dutch West India Company, and global trade",
  },
  {
    title: "4.4 - Maritime Empires: Britain & France",
    emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    color: "#0ea5e9",
    description: "British East India Company, French colonies, and Atlantic trade",
  },
  {
    title: "4.5 - Maintaining Maritime Empires",
    emoji: "🏛️",
    color: "#7c3aed",
    description: "Administration, mercantilism, and colonial governance systems",
  },
  {
    title: "4.5 - Triangular Trade & Atlantic System",
    emoji: "🔺",
    color: "#4f46e5",
    description: "Trans-Atlantic slave trade, Middle Passage, and plantation economies",
  },
  {
    title: "4.6 - Challenges to State Power",
    emoji: "⚡",
    color: "#e11d48",
    description: "Local resistance, maroon communities, and challenges to colonial rule",
  },
  {
    title: "4.6 - Resistance Movements",
    emoji: "✊",
    color: "#be123c",
    description: "Indigenous resistance, slave rebellions, and colonial conflicts",
  },
  {
    title: "4.7 - Changing Social Hierarchies",
    emoji: "📊",
    color: "#9333ea",
    description: "Casta system, creoles, mestizos, and new racial classifications",
  },
  {
    title: "4.7 - Labor Systems (1450-1750)",
    emoji: "⛏️",
    color: "#6b7280",
    description: "Encomienda, mita, hacienda, slavery, and indentured servitude",
  },
  {
    title: "4.8 - Continuity & Change Overview",
    emoji: "🔄",
    color: "#0891b2",
    description: "Global transformations and continuities from 1450-1750",
  },
  {
    title: "4.8 - Unit 4 Comprehensive Review",
    emoji: "📚",
    color: "#2563eb",
    description: "Complete review of all Unit 4 topics for AP exam preparation",
  },
];

// YouTube videos for each topic (educational content about AP World History)
const YOUTUBE_SOURCES_BY_TOPIC: Record<number, { url: string; title: string }[]> = {
  0: [ // 4.1 Tech Innovations
    { url: "https://www.youtube.com/watch?v=dKLdYkLWGjA", title: "Technology in the Age of Exploration" },
    { url: "https://www.youtube.com/watch?v=NjEGncridoQ", title: "Navigation Tools of the 15th Century" },
    { url: "https://www.youtube.com/watch?v=p5xTh-AFc0k", title: "Maritime Technology Revolution" },
    { url: "https://www.youtube.com/watch?v=JL0k8QHXZ5c", title: "How Ships Changed World History" },
    { url: "https://www.youtube.com/watch?v=wY9q3nJB-1E", title: "The Compass and Global Exploration" },
  ],
  1: [ // Shipbuilding
    { url: "https://www.youtube.com/watch?v=NjEGncridoQ", title: "Building the Caravel" },
    { url: "https://www.youtube.com/watch?v=K8mWnvTqB3A", title: "Evolution of Sailing Ships" },
    { url: "https://www.youtube.com/watch?v=gTrLBLBSXGA", title: "Astrolabe: The GPS of the Past" },
    { url: "https://www.youtube.com/watch?v=wY9q3nJB-1E", title: "How the Compass Changed History" },
    { url: "https://www.youtube.com/watch?v=p5xTh-AFc0k", title: "Portolan Charts and Navigation" },
  ],
  2: [ // Causes of Exploration
    { url: "https://www.youtube.com/watch?v=wOclF9eP5uM", title: "Why Europeans Explored" },
    { url: "https://www.youtube.com/watch?v=WYBm3lC9NkQ", title: "Gold, God, and Glory" },
    { url: "https://www.youtube.com/watch?v=NjEGncridoQ", title: "The Spice Trade Origins" },
    { url: "https://www.youtube.com/watch?v=wY9q3nJB-1E", title: "Renaissance and Exploration" },
    { url: "https://www.youtube.com/watch?v=dKLdYkLWGjA", title: "Crusades and Trade Routes" },
  ],
  3: [ // Portuguese Exploration
    { url: "https://www.youtube.com/watch?v=K8mWnvTqB3A", title: "Prince Henry the Navigator" },
    { url: "https://www.youtube.com/watch?v=wOclF9eP5uM", title: "Bartolomeu Dias: Rounding Africa" },
    { url: "https://www.youtube.com/watch?v=gTrLBLBSXGA", title: "Vasco da Gama's Voyage to India" },
    { url: "https://www.youtube.com/watch?v=WYBm3lC9NkQ", title: "Portuguese Trading Posts" },
    { url: "https://www.youtube.com/watch?v=NjEGncridoQ", title: "Portugal's Maritime Empire" },
  ],
  4: [ // Spanish Exploration
    { url: "https://www.youtube.com/watch?v=GD3dgiDreGc", title: "Christopher Columbus" },
    { url: "https://www.youtube.com/watch?v=wOclF9eP5uM", title: "Hernán Cortés and the Aztecs" },
    { url: "https://www.youtube.com/watch?v=K8mWnvTqB3A", title: "Francisco Pizarro and the Inca" },
    { url: "https://www.youtube.com/watch?v=gTrLBLBSXGA", title: "Spanish Conquistadors" },
    { url: "https://www.youtube.com/watch?v=WYBm3lC9NkQ", title: "Treaty of Tordesillas" },
  ],
  5: [ // Columbian Exchange
    { url: "https://www.youtube.com/watch?v=HQPA5oNpfM4", title: "The Columbian Exchange Explained" },
    { url: "https://www.youtube.com/watch?v=wOclF9eP5uM", title: "How the Exchange Changed Everything" },
    { url: "https://www.youtube.com/watch?v=GD3dgiDreGc", title: "Foods that Changed the World" },
    { url: "https://www.youtube.com/watch?v=K8mWnvTqB3A", title: "Animals in the Columbian Exchange" },
    { url: "https://www.youtube.com/watch?v=gTrLBLBSXGA", title: "Global Impact of the Exchange" },
  ],
  6: [ // Diseases
    { url: "https://www.youtube.com/watch?v=HQPA5oNpfM4", title: "Disease and Conquest" },
    { url: "https://www.youtube.com/watch?v=JL0k8QHXZ5c", title: "Smallpox in the Americas" },
    { url: "https://www.youtube.com/watch?v=wOclF9eP5uM", title: "The Great Dying" },
    { url: "https://www.youtube.com/watch?v=GD3dgiDreGc", title: "Biological Warfare Unintended" },
    { url: "https://www.youtube.com/watch?v=K8mWnvTqB3A", title: "Population Collapse in Americas" },
  ],
  7: [ // Agriculture
    { url: "https://www.youtube.com/watch?v=HQPA5oNpfM4", title: "Crops of the Columbian Exchange" },
    { url: "https://www.youtube.com/watch?v=GD3dgiDreGc", title: "Potatoes Changed Europe" },
    { url: "https://www.youtube.com/watch?v=wOclF9eP5uM", title: "Maize: America's Gift to World" },
    { url: "https://www.youtube.com/watch?v=K8mWnvTqB3A", title: "Sugar and Slavery" },
    { url: "https://www.youtube.com/watch?v=gTrLBLBSXGA", title: "Tobacco's Global Spread" },
  ],
  8: [ // Portuguese Empire
    { url: "https://www.youtube.com/watch?v=K8mWnvTqB3A", title: "Portuguese Trading Empire" },
    { url: "https://www.youtube.com/watch?v=wOclF9eP5uM", title: "Goa, Malacca, and Macau" },
    { url: "https://www.youtube.com/watch?v=gTrLBLBSXGA", title: "African Trading Posts" },
    { url: "https://www.youtube.com/watch?v=WYBm3lC9NkQ", title: "Brazil: Portuguese Colony" },
    { url: "https://www.youtube.com/watch?v=NjEGncridoQ", title: "Decline of Portuguese Power" },
  ],
  9: [ // Spanish Empire
    { url: "https://www.youtube.com/watch?v=GD3dgiDreGc", title: "Spanish Colonial Empire" },
    { url: "https://www.youtube.com/watch?v=wOclF9eP5uM", title: "Viceroyalties of the Americas" },
    { url: "https://www.youtube.com/watch?v=K8mWnvTqB3A", title: "Encomienda System" },
    { url: "https://www.youtube.com/watch?v=gTrLBLBSXGA", title: "Silver and the Spanish Empire" },
    { url: "https://www.youtube.com/watch?v=WYBm3lC9NkQ", title: "Manila Galleon Trade" },
  ],
  10: [ // Dutch Empire
    { url: "https://www.youtube.com/watch?v=JL0k8QHXZ5c", title: "Dutch Golden Age" },
    { url: "https://www.youtube.com/watch?v=wOclF9eP5uM", title: "VOC: Dutch East India Company" },
    { url: "https://www.youtube.com/watch?v=K8mWnvTqB3A", title: "Dutch in Southeast Asia" },
    { url: "https://www.youtube.com/watch?v=gTrLBLBSXGA", title: "New Amsterdam to New York" },
    { url: "https://www.youtube.com/watch?v=WYBm3lC9NkQ", title: "Dutch West India Company" },
  ],
  11: [ // British & French
    { url: "https://www.youtube.com/watch?v=JL0k8QHXZ5c", title: "British East India Company" },
    { url: "https://www.youtube.com/watch?v=wOclF9eP5uM", title: "French Colonial Empire" },
    { url: "https://www.youtube.com/watch?v=K8mWnvTqB3A", title: "British in India" },
    { url: "https://www.youtube.com/watch?v=gTrLBLBSXGA", title: "New France and Canada" },
    { url: "https://www.youtube.com/watch?v=WYBm3lC9NkQ", title: "Caribbean Colonies" },
  ],
  12: [ // Maintaining Empires
    { url: "https://www.youtube.com/watch?v=wOclF9eP5uM", title: "Mercantilism Explained" },
    { url: "https://www.youtube.com/watch?v=K8mWnvTqB3A", title: "Colonial Administration" },
    { url: "https://www.youtube.com/watch?v=gTrLBLBSXGA", title: "Joint-Stock Companies" },
    { url: "https://www.youtube.com/watch?v=WYBm3lC9NkQ", title: "Colonial Taxation Systems" },
    { url: "https://www.youtube.com/watch?v=JL0k8QHXZ5c", title: "Empire and Commerce" },
  ],
  13: [ // Triangular Trade
    { url: "https://www.youtube.com/watch?v=3NXC4Q_4JVg", title: "Atlantic Slave Trade" },
    { url: "https://www.youtube.com/watch?v=wOclF9eP5uM", title: "The Middle Passage" },
    { url: "https://www.youtube.com/watch?v=K8mWnvTqB3A", title: "Triangular Trade Routes" },
    { url: "https://www.youtube.com/watch?v=gTrLBLBSXGA", title: "Plantation System" },
    { url: "https://www.youtube.com/watch?v=WYBm3lC9NkQ", title: "Economics of Slavery" },
  ],
  14: [ // Challenges to Power
    { url: "https://www.youtube.com/watch?v=wOclF9eP5uM", title: "Resistance to Colonialism" },
    { url: "https://www.youtube.com/watch?v=K8mWnvTqB3A", title: "Maroon Communities" },
    { url: "https://www.youtube.com/watch?v=gTrLBLBSXGA", title: "Indigenous Resistance" },
    { url: "https://www.youtube.com/watch?v=WYBm3lC9NkQ", title: "Piracy in the Caribbean" },
    { url: "https://www.youtube.com/watch?v=JL0k8QHXZ5c", title: "Colonial Wars" },
  ],
  15: [ // Resistance Movements
    { url: "https://www.youtube.com/watch?v=3NXC4Q_4JVg", title: "Slave Rebellions" },
    { url: "https://www.youtube.com/watch?v=wOclF9eP5uM", title: "Tupac Amaru Rebellion" },
    { url: "https://www.youtube.com/watch?v=K8mWnvTqB3A", title: "Pueblo Revolt" },
    { url: "https://www.youtube.com/watch?v=gTrLBLBSXGA", title: "Queen Nzinga's Resistance" },
    { url: "https://www.youtube.com/watch?v=WYBm3lC9NkQ", title: "Haitian Revolution Origins" },
  ],
  16: [ // Social Hierarchies
    { url: "https://www.youtube.com/watch?v=wOclF9eP5uM", title: "Casta System Explained" },
    { url: "https://www.youtube.com/watch?v=K8mWnvTqB3A", title: "Colonial Social Classes" },
    { url: "https://www.youtube.com/watch?v=gTrLBLBSXGA", title: "Creoles and Peninsulares" },
    { url: "https://www.youtube.com/watch?v=WYBm3lC9NkQ", title: "Mestizo Identity" },
    { url: "https://www.youtube.com/watch?v=JL0k8QHXZ5c", title: "Race in Colonial Americas" },
  ],
  17: [ // Labor Systems
    { url: "https://www.youtube.com/watch?v=3NXC4Q_4JVg", title: "Slavery in the Americas" },
    { url: "https://www.youtube.com/watch?v=wOclF9eP5uM", title: "Encomienda and Mita" },
    { url: "https://www.youtube.com/watch?v=K8mWnvTqB3A", title: "Hacienda System" },
    { url: "https://www.youtube.com/watch?v=gTrLBLBSXGA", title: "Indentured Servitude" },
    { url: "https://www.youtube.com/watch?v=WYBm3lC9NkQ", title: "Potosí Silver Mines" },
  ],
  18: [ // Continuity & Change
    { url: "https://www.youtube.com/watch?v=wOclF9eP5uM", title: "Global Transformations 1450-1750" },
    { url: "https://www.youtube.com/watch?v=K8mWnvTqB3A", title: "What Changed? What Stayed Same?" },
    { url: "https://www.youtube.com/watch?v=gTrLBLBSXGA", title: "Trade Routes Then and Now" },
    { url: "https://www.youtube.com/watch?v=WYBm3lC9NkQ", title: "Political Continuities" },
    { url: "https://www.youtube.com/watch?v=JL0k8QHXZ5c", title: "Cultural Exchange Legacy" },
  ],
  19: [ // Comprehensive Review
    { url: "https://www.youtube.com/watch?v=HQPA5oNpfM4", title: "Unit 4 Complete Review" },
    { url: "https://www.youtube.com/watch?v=wOclF9eP5uM", title: "AP World Unit 4 Key Concepts" },
    { url: "https://www.youtube.com/watch?v=K8mWnvTqB3A", title: "Unit 4 Exam Prep" },
    { url: "https://www.youtube.com/watch?v=gTrLBLBSXGA", title: "DBQ Practice: Unit 4" },
    { url: "https://www.youtube.com/watch?v=WYBm3lC9NkQ", title: "SAQ Practice: Unit 4" },
  ],
};

// Website URLs for each topic
const WEBSITE_SOURCES_BY_TOPIC: Record<number, { url: string; title: string }[]> = {
  0: [
    { url: "https://www.britannica.com/topic/navigation", title: "Navigation History - Britannica" },
    { url: "https://www.khanacademy.org/humanities/world-history", title: "Khan Academy: Age of Exploration" },
    { url: "https://www.history.com/topics/exploration", title: "History.com: Exploration Era" },
    { url: "https://apcentral.collegeboard.org/courses/ap-world-history", title: "AP World History - College Board" },
    { url: "https://www.nationalgeographic.com/history/article/age-of-exploration", title: "National Geographic: Exploration" },
  ],
  1: [
    { url: "https://www.britannica.com/technology/caravel", title: "Caravel Ship Design" },
    { url: "https://www.rmg.co.uk/stories/topics/age-exploration", title: "Royal Museums: Age of Exploration" },
    { url: "https://www.britannica.com/technology/astrolabe", title: "Astrolabe Technology" },
    { url: "https://www.history.com/topics/inventions/compass", title: "The Compass - History.com" },
    { url: "https://www.metmuseum.org/toah/hd/expl/hd_expl.htm", title: "Met Museum: Maritime Tech" },
  ],
  2: [
    { url: "https://www.britannica.com/topic/European-exploration", title: "European Exploration Causes" },
    { url: "https://www.khanacademy.org/humanities/world-history/renaissance-and-reformation", title: "Renaissance Context" },
    { url: "https://www.history.com/topics/renaissance", title: "Renaissance and Trade" },
    { url: "https://www.worldhistory.org/Age_of_Discovery/", title: "World History: Age of Discovery" },
    { url: "https://courses.lumenlearning.com/suny-hccc-worldhistory2/chapter/european-exploration-and-expansion/", title: "European Expansion" },
  ],
  3: [
    { url: "https://www.britannica.com/biography/Henry-the-Navigator", title: "Prince Henry the Navigator" },
    { url: "https://www.britannica.com/biography/Vasco-da-Gama", title: "Vasco da Gama" },
    { url: "https://www.britannica.com/biography/Bartolomeu-Dias", title: "Bartolomeu Dias" },
    { url: "https://www.history.com/topics/exploration/vasco-da-gama", title: "Portuguese Exploration" },
    { url: "https://www.worldhistory.org/Portuguese_Empire/", title: "Portuguese Empire Overview" },
  ],
  4: [
    { url: "https://www.britannica.com/biography/Christopher-Columbus", title: "Christopher Columbus" },
    { url: "https://www.britannica.com/biography/Hernan-Cortes", title: "Hernán Cortés" },
    { url: "https://www.britannica.com/biography/Francisco-Pizarro", title: "Francisco Pizarro" },
    { url: "https://www.history.com/topics/exploration/conquistadores", title: "Spanish Conquistadors" },
    { url: "https://www.worldhistory.org/Spanish_Empire/", title: "Spanish Empire" },
  ],
  5: [
    { url: "https://www.britannica.com/topic/Columbian-exchange", title: "Columbian Exchange Overview" },
    { url: "https://www.khanacademy.org/humanities/us-history/precontact-and-early-colonial-era/columbian-exchange-and-conflict/a/the-columbian-exchange-article", title: "Khan Academy: Columbian Exchange" },
    { url: "https://www.history.com/topics/exploration/columbian-exchange", title: "History.com: Columbian Exchange" },
    { url: "https://www.nationalgeographic.org/encyclopedia/columbian-exchange/", title: "Nat Geo: Columbian Exchange" },
    { url: "https://apstudents.collegeboard.org/courses/ap-world-history-modern", title: "AP World: Unit 4" },
  ],
  6: [
    { url: "https://www.britannica.com/science/smallpox", title: "Smallpox in Americas" },
    { url: "https://www.history.com/news/columbian-exchange-disease-death", title: "Disease and Columbian Exchange" },
    { url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4633201/", title: "Epidemics in Colonial Americas" },
    { url: "https://www.khanacademy.org/humanities/us-history/precontact-and-early-colonial-era", title: "Disease Impact" },
    { url: "https://www.worldhistory.org/Columbian_Exchange/", title: "World History: Disease Exchange" },
  ],
  7: [
    { url: "https://www.britannica.com/topic/agriculture", title: "Agricultural Exchange" },
    { url: "https://www.history.com/news/columbian-exchange-food-crops", title: "Crops of the Exchange" },
    { url: "https://www.khanacademy.org/humanities/world-history/early-modern-era", title: "Agricultural Revolution" },
    { url: "https://www.nationalgeographic.org/article/columbian-exchange/", title: "Foods that Changed World" },
    { url: "https://www.worldhistory.org/Potato/", title: "The Potato's Global Impact" },
  ],
  8: [
    { url: "https://www.britannica.com/place/Portuguese-Empire", title: "Portuguese Empire" },
    { url: "https://www.worldhistory.org/Portuguese_Empire/", title: "Portuguese Trading Posts" },
    { url: "https://www.history.com/topics/exploration/portuguese-empire", title: "Portugal's Sea Empire" },
    { url: "https://www.britannica.com/place/Goa-state-India", title: "Goa - Portuguese India" },
    { url: "https://www.britannica.com/place/Malacca", title: "Malacca Trading Post" },
  ],
  9: [
    { url: "https://www.britannica.com/place/Spanish-Empire", title: "Spanish Colonial Empire" },
    { url: "https://www.worldhistory.org/Spanish_Empire/", title: "Spanish Americas" },
    { url: "https://www.britannica.com/topic/encomienda", title: "Encomienda System" },
    { url: "https://www.history.com/topics/exploration/spanish-empire", title: "Spain's Global Empire" },
    { url: "https://www.britannica.com/topic/silver-mining", title: "Spanish Silver" },
  ],
  10: [
    { url: "https://www.britannica.com/topic/Dutch-East-India-Company", title: "Dutch East India Company" },
    { url: "https://www.worldhistory.org/Dutch_East_India_Company/", title: "VOC History" },
    { url: "https://www.britannica.com/topic/Dutch-West-India-Company", title: "Dutch West India Company" },
    { url: "https://www.history.com/topics/european-history/dutch-east-india-company", title: "Dutch Golden Age" },
    { url: "https://www.britannica.com/place/Dutch-Empire", title: "Dutch Empire Overview" },
  ],
  11: [
    { url: "https://www.britannica.com/topic/British-East-India-Company", title: "British East India Company" },
    { url: "https://www.worldhistory.org/British_Empire/", title: "British Empire Origins" },
    { url: "https://www.britannica.com/place/New-France", title: "New France" },
    { url: "https://www.history.com/topics/european-history/british-empire", title: "British Colonial Empire" },
    { url: "https://www.britannica.com/place/French-colonial-empire", title: "French Colonial Empire" },
  ],
  12: [
    { url: "https://www.britannica.com/topic/mercantilism", title: "Mercantilism Explained" },
    { url: "https://www.khanacademy.org/humanities/us-history/colonial-america/colonial-period/a/mercantilism", title: "Colonial Mercantilism" },
    { url: "https://www.britannica.com/topic/joint-stock-company", title: "Joint-Stock Companies" },
    { url: "https://www.history.com/topics/early-modern-history/mercantilism", title: "Economic Systems" },
    { url: "https://www.worldhistory.org/Mercantilism/", title: "Trade Policies" },
  ],
  13: [
    { url: "https://www.britannica.com/topic/transatlantic-slave-trade", title: "Atlantic Slave Trade" },
    { url: "https://www.britannica.com/topic/Middle-Passage", title: "The Middle Passage" },
    { url: "https://www.history.com/topics/black-history/slavery", title: "Slavery in Americas" },
    { url: "https://www.khanacademy.org/humanities/us-history/precontact-and-early-colonial-era/atlantic-slave-trade-and-triangular-trade/a/triangular-trade-article", title: "Triangular Trade" },
    { url: "https://www.worldhistory.org/Atlantic_Slave_Trade/", title: "Atlantic System" },
  ],
  14: [
    { url: "https://www.britannica.com/topic/maroon-people", title: "Maroon Communities" },
    { url: "https://www.worldhistory.org/Maroon/", title: "Resistance Movements" },
    { url: "https://www.britannica.com/topic/piracy", title: "Caribbean Piracy" },
    { url: "https://www.history.com/topics/colonial-america/colonial-conflicts", title: "Colonial Conflicts" },
    { url: "https://www.khanacademy.org/humanities/us-history/colonial-america", title: "Resistance to Colonialism" },
  ],
  15: [
    { url: "https://www.britannica.com/event/Pueblo-Revolt", title: "Pueblo Revolt" },
    { url: "https://www.worldhistory.org/Tupac_Amaru_II/", title: "Tupac Amaru Rebellion" },
    { url: "https://www.britannica.com/biography/Nzinga", title: "Queen Nzinga" },
    { url: "https://www.history.com/topics/black-history/slave-rebellions", title: "Slave Rebellions" },
    { url: "https://www.britannica.com/place/Haiti/Slave-society-in-the-Caribbean", title: "Caribbean Resistance" },
  ],
  16: [
    { url: "https://www.britannica.com/topic/casta", title: "Casta System" },
    { url: "https://www.khanacademy.org/humanities/art-americas/early-modern-americas/colonial-period/a/casta-paintings", title: "Casta Paintings" },
    { url: "https://www.worldhistory.org/Casta_System/", title: "Colonial Social Classes" },
    { url: "https://www.britannica.com/topic/Creole-people", title: "Creoles in Americas" },
    { url: "https://www.britannica.com/topic/mestizo", title: "Mestizo Identity" },
  ],
  17: [
    { url: "https://www.britannica.com/topic/encomienda", title: "Encomienda System" },
    { url: "https://www.britannica.com/topic/mita", title: "Mita Labor System" },
    { url: "https://www.britannica.com/topic/hacienda", title: "Hacienda System" },
    { url: "https://www.history.com/topics/early-modern-era/potosi", title: "Potosí Silver Mines" },
    { url: "https://www.worldhistory.org/Indentured_Servitude/", title: "Indentured Servitude" },
  ],
  18: [
    { url: "https://www.britannica.com/event/Age-of-Discovery", title: "Age of Discovery Legacy" },
    { url: "https://www.khanacademy.org/humanities/world-history/early-modern-era", title: "1450-1750 Changes" },
    { url: "https://apcentral.collegeboard.org/courses/ap-world-history", title: "AP Unit 4 Review" },
    { url: "https://www.worldhistory.org/Early_Modern_Period/", title: "Early Modern World" },
    { url: "https://www.britannica.com/topic/globalization", title: "Early Globalization" },
  ],
  19: [
    { url: "https://apcentral.collegeboard.org/courses/ap-world-history", title: "AP World Unit 4 Overview" },
    { url: "https://www.khanacademy.org/humanities/world-history", title: "Khan Academy AP World" },
    { url: "https://fiveable.me/ap-world/unit-4", title: "Fiveable Unit 4 Review" },
    { url: "https://www.britannica.com/topic/European-exploration", title: "Exploration Summary" },
    { url: "https://apstudents.collegeboard.org/courses/ap-world-history-modern", title: "AP Exam Prep" },
  ],
};

// Educational content for pasted text sources
const TEXT_CONTENT_BY_TOPIC: Record<number, { title: string; content: string }[]> = {
  0: [
    { title: "Maritime Technology Overview", content: "The period from 1450-1750 witnessed revolutionary advances in maritime technology. The Portuguese caravel, with its lateen sails, could sail closer to the wind than any previous vessel. The magnetic compass, refined from Chinese inventions, allowed sailors to navigate without visible landmarks. The astrolabe and cross-staff helped determine latitude. Together, these innovations made transoceanic voyages possible for the first time in history." },
    { title: "Navigation in the Age of Exploration", content: "Navigation tools transformed exploration. The magnetic compass showed direction consistently. Astrolabes and quadrants measured the angle of the sun or North Star to determine latitude. Portolan charts, developed in the Mediterranean, provided detailed coastline maps. Dead reckoning—calculating position based on speed and direction—complemented celestial navigation." },
    { title: "Ship Design Evolution", content: "Ship design evolved to meet exploration needs. The caravel combined European hull design with Arab lateen sails. The carrack, larger but slower, carried more cargo and crew. The galleon merged the best features of both, becoming the dominant ship of the era. These vessels could sail against the wind, carry months of supplies, and withstand ocean storms." },
    { title: "Gunpowder and Maritime Power", content: "Gunpowder technology gave European ships a decisive advantage. Cannons mounted on ships allowed European powers to dominate coastal areas worldwide. The combination of sailing technology and firepower enabled small European forces to establish trading posts and colonies against numerically superior opponents." },
    { title: "Knowledge Transfer and Innovation", content: "European maritime innovation drew on global knowledge. The compass originated in China. Arab astronomers developed sophisticated navigational instruments. Indian Ocean traders contributed sailing techniques. Europeans synthesized this knowledge, adding innovations like improved hull designs and better maps, creating a technological package that enabled global exploration." },
  ],
  1: [
    { title: "The Caravel Revolution", content: "The caravel was perhaps the most important ship of the Age of Exploration. Developed by the Portuguese in the 15th century, its shallow draft allowed it to explore rivers and coastlines. Its lateen sails, borrowed from Arab dhows, enabled it to sail into the wind. Prince Henry's explorers used caravels to map the African coast." },
    { title: "Astrolabe and Navigation", content: "The astrolabe was an ancient instrument perfected during the Islamic Golden Age. Sailors used it to measure the altitude of the sun or stars above the horizon. This measurement, combined with astronomical tables, allowed calculation of latitude. While limited by weather conditions, the astrolabe was essential for transoceanic navigation." },
    { title: "Magnetic Compass Development", content: "The magnetic compass, invented in China, reached Europe through Arab traders. Originally used for geomancy, it became essential for navigation. European improvements included mounting the needle on a card with direction markings and enclosing it in a binnacle to protect against weather. The compass allowed navigation on cloudy days." },
    { title: "Cartography Advances", content: "Map-making advanced dramatically during this period. Portolan charts provided accurate coastline depictions. The Mercator projection (1569) allowed straight-line courses to be plotted. Maps accumulated knowledge from each voyage, gradually revealing the true shape of continents. This geographic knowledge became a strategic advantage for maritime powers." },
    { title: "The Carrack and Galleon", content: "The carrack was a large, rounded ship capable of carrying substantial cargo across oceans. Its successor, the galleon, combined the carrack's capacity with the caravel's maneuverability. Galleons dominated Atlantic trade, carrying silver from the Americas to Spain and goods around the world. Their design remained standard for two centuries." },
  ],
  2: [
    { title: "Gold, God, and Glory", content: "Three primary motivations drove European exploration. Gold represented economic gain—spices, precious metals, and trade opportunities. God reflected the missionary impulse to spread Christianity. Glory meant personal fame and national prestige. These intertwined motives sent explorers across unknown oceans despite enormous risks." },
    { title: "The Spice Trade Imperative", content: "Spices from Asia—pepper, cinnamon, nutmeg, cloves—were worth their weight in gold in Europe. The fall of Constantinople (1453) disrupted traditional trade routes. Finding a sea route to Asia became an economic imperative. Portugal's voyages around Africa and Spain's westward expedition were both attempts to access spice markets directly." },
    { title: "Religious Motivations", content: "The Reconquista's completion in 1492 intensified Spanish religious zeal. The Treaty of Tordesillas (1494) explicitly mentioned spreading Christianity. Missionaries followed conquistadors, establishing churches throughout the Americas. The Protestant Reformation later added competitive religious motivations as Catholic and Protestant powers vied for souls worldwide." },
    { title: "Renaissance Curiosity", content: "The Renaissance fostered curiosity about the natural world. Humanist scholars recovered ancient texts suggesting land beyond the known world. Geographical theories, some accurate and some fantastical, inspired exploration. The printing press spread knowledge of discoveries, inspiring further voyages. Scientific inquiry and exploration reinforced each other." },
    { title: "Competition Among European Powers", content: "National rivalry drove exploration. Portugal's early success prompted Spanish sponsorship of Columbus. The Dutch, English, and French later challenged Iberian dominance. Each nation sought trade advantages, colonial territories, and naval power. This competition accelerated exploration and colonization throughout the period." },
  ],
  3: [
    { title: "Prince Henry the Navigator", content: "Prince Henry of Portugal (1394-1460) never sailed himself but sponsored numerous voyages along Africa's west coast. He established a navigation school at Sagres, gathering astronomers, cartographers, and shipbuilders. Under his patronage, Portuguese explorers reached the Azores, Cape Verde, and Sierra Leone, laying groundwork for later voyages to India." },
    { title: "Bartolomeu Dias Rounds Africa", content: "In 1488, Bartolomeu Dias became the first European to sail around Africa's southern tip, which he named the Cape of Storms. King João II renamed it the Cape of Good Hope, recognizing its promise for reaching India. Dias proved that Africa could be circumnavigated, opening the sea route to Asia." },
    { title: "Vasco da Gama Reaches India", content: "Vasco da Gama completed the sea route to India in 1498, arriving at Calicut after a voyage of over 10 months. He used Arab navigators familiar with the monsoon winds of the Indian Ocean. His return cargo of spices was worth 60 times the expedition's cost. Portuguese dominance of the spice trade began." },
    { title: "Portuguese Trading Post Empire", content: "Unlike Spain's territorial empire, Portugal established a trading post empire. Small fortified bases at strategic locations—Goa, Malacca, Macao—controlled maritime trade routes. The Portuguese never conquered large territories but dominated sea lanes through naval superiority. This model maximized profit with minimal occupation." },
    { title: "Portugal in Brazil", content: "Pedro Álvares Cabral reached Brazil in 1500, claiming it for Portugal under the Treaty of Tordesillas. Initially valued only for brazilwood, Brazil became Portugal's largest and wealthiest colony. Sugar plantations, gold discoveries, and African slavery made Brazil economically vital by the late 1600s." },
  ],
  4: [
    { title: "Columbus's Voyages", content: "Christopher Columbus's four voyages (1492-1504) established permanent European contact with the Americas. Believing he had reached Asia, Columbus explored the Caribbean, Central America, and South American coastlines. His miscalculation of Earth's size led to an unexpected discovery. His voyages initiated centuries of European colonization." },
    { title: "Cortés and the Aztec Empire", content: "Hernán Cortés landed in Mexico in 1519 with about 600 men. Using superior weapons, indigenous allies (especially the Tlaxcalans), and crucially, smallpox, he conquered the Aztec Empire by 1521. Moctezuma II's initial hesitation and internal divisions among native peoples facilitated Spanish victory. The conquest yielded enormous wealth." },
    { title: "Pizarro and the Inca Empire", content: "Francisco Pizarro conquered the Inca Empire with fewer than 200 men (1532-1533). He arrived during a civil war between Atahualpa and Huáscar. Capturing Atahualpa by treachery, Pizarro extracted an enormous ransom before executing him. Disease, which preceded the Spanish, had already weakened the empire considerably." },
    { title: "Treaty of Tordesillas", content: "The Treaty of Tordesillas (1494) divided the non-European world between Spain and Portugal. An imaginary line 370 leagues west of the Cape Verde Islands gave Portugal Africa and Brazil, while Spain received most of the Americas and the Pacific. This papal arbitration shaped colonial geography for centuries." },
    { title: "Spanish Colonial System", content: "Spain established a sophisticated colonial administration. The Council of the Indies governed from Spain. Viceroyalties in New Spain (Mexico) and Peru administered vast territories. The encomienda system granted colonists control over indigenous labor. Catholic missions complemented secular conquest, creating a hybrid colonial society." },
  ],
  5: [
    { title: "Columbian Exchange Overview", content: "The Columbian Exchange refers to the transfer of plants, animals, diseases, people, and ideas between the Eastern and Western Hemispheres following 1492. This biological and cultural exchange fundamentally transformed life on both sides of the Atlantic. It unified previously separate ecosystems and human communities, creating our modern globalized world." },
    { title: "Old World to New World Transfers", content: "Europeans brought horses, cattle, pigs, sheep, wheat, and rice to the Americas. Horses revolutionized transportation and warfare for Plains Indians. Cattle and sheep created new pastoral economies. Wheat supplemented native crops. Sugarcane, coffee, and bananas transformed tropical landscapes. These introductions reshaped American ecosystems and economies." },
    { title: "New World to Old World Transfers", content: "American crops revolutionized Old World agriculture. Potatoes and maize increased European food supplies dramatically. Tomatoes transformed Mediterranean cuisine. Tobacco created new addictions worldwide. Cacao brought chocolate to Europe. These crops allowed population growth and migration by expanding food production in previously marginal lands." },
    { title: "Impact on Global Population", content: "The Columbian Exchange had opposite demographic effects. American indigenous populations declined by 50-90% due to diseases. Meanwhile, Old World populations grew thanks to American crops. Africa lost millions to the slave trade. European emigration populated the Americas. These shifts created the modern distribution of human populations." },
    { title: "Long-term Consequences", content: "The Columbian Exchange created lasting global connections. Dietary staples crossed oceans—imagine Italy without tomatoes or Ireland without potatoes. Labor systems emerged to cultivate new crops. Environmental changes altered landscapes permanently. The exchange initiated economic globalization that continues today." },
  ],
  6: [
    { title: "Disease and Demographic Catastrophe", content: "Diseases from the Eastern Hemisphere devastated American populations. Smallpox, measles, typhus, and influenza killed millions. Having evolved separately for thousands of years, indigenous Americans had no immunity to these diseases. Mortality rates of 50-90% were common. Some scholars call this the greatest demographic disaster in human history." },
    { title: "Smallpox in the Americas", content: "Smallpox was the deadliest disease in the Americas. It arrived in Hispaniola in 1518 and spread rapidly. The disease reached Mexico before Cortés did, killing thousands including Aztec leaders. Epidemics swept through the Inca Empire before Pizarro arrived. The virus continued devastating populations throughout the colonial period." },
    { title: "Measles and Other Diseases", content: "Measles arrived shortly after smallpox, often in waves that killed survivors of earlier epidemics. Typhus, mumps, influenza, and whooping cough followed. Yellow fever and malaria, introduced from Africa, added to the death toll. Sequential epidemics prevented population recovery for generations." },
    { title: "Impact on Indigenous Societies", content: "Disease destroyed the social fabric of indigenous societies. Traditional knowledge holders died, disrupting cultural transmission. Labor shortages made resistance to European conquest difficult. Religious interpretations sometimes favored Christianity as the source of apparent divine protection for Europeans. Communities collapsed or merged with survivors." },
    { title: "Diseases Moving East", content: "While Old World diseases devastated the Americas, relatively few traveled the other direction. Syphilis may have originated in the Americas, appearing in Europe after 1493. The disparity reflects the greater disease density in Eurasian populations, shaped by millennia of agriculture and close contact with domestic animals." },
  ],
  7: [
    { title: "American Crops Transform World", content: "American crops transformed global agriculture. Maize (corn) provided high yields in diverse climates. Potatoes grew in poor soils and cold climates where wheat failed. Manioc (cassava) thrived in tropical Africa and Asia. These crops allowed population growth worldwide, fundamentally altering human demographics and economics." },
    { title: "The Potato's Global Impact", content: "The potato became a dietary staple across Europe and beyond. Introduced from Peru, it provided more calories per acre than any grain. It grew in cooler climates and poor soils. By the 1700s, potatoes fed much of Northern Europe. This dependence proved dangerous when potato blight struck Ireland in the 1840s." },
    { title: "Maize Cultivation Worldwide", content: "Maize spread across Afro-Eurasia rapidly. In Africa, it supplemented sorghum and millet. In China, it expanded agriculture into hill country. In Europe, it fed livestock, increasing meat production. Maize's adaptability made it a global crop within two centuries of the Columbian Exchange." },
    { title: "Sugar and Plantation Economies", content: "Sugar transformed tropical landscapes and created brutal plantation economies. Originally from Asia, sugar cultivation expanded dramatically in the Caribbean and Brazil. Its labor-intensive cultivation drove the Atlantic slave trade. Sugar became the most valuable colonial commodity, shaping economies and societies throughout the Atlantic world." },
    { title: "Tobacco's Global Spread", content: "Native Americans cultivated tobacco for ceremonial purposes. Europeans adopted smoking enthusiastically despite health concerns. Tobacco cultivation spread to Virginia, where it became the economic foundation of the colony. The crop later spread to Africa and Asia, creating global markets and addictions that persist today." },
  ],
  8: [
    { title: "Portuguese Maritime Empire", content: "Portugal created the first global maritime empire, stretching from Brazil to Japan. Unlike territorial empires, Portugal controlled sea lanes and trading posts rather than large territories. A network of forts at strategic locations allowed a small nation to dominate Indian Ocean trade for over a century." },
    { title: "Estado da Índia", content: "The Estado da Índia (State of India) was Portugal's official presence in Asia. Based in Goa after 1510, it controlled trade from Mozambique to Macau. Portuguese ships enforced monopolies on spices and other goods. The Estado combined commercial enterprise with missionary activity and naval power." },
    { title: "African Trading Posts", content: "Portugal established trading posts along Africa's western coast from the 1440s. Elmina (Ghana), founded in 1482, became a major gold trading center. São Tomé developed sugar plantations. These posts later became centers of the Atlantic slave trade, channeling millions of Africans to the Americas." },
    { title: "Goa and Portuguese India", content: "Goa, conquered in 1510, became the capital of Portuguese Asia. It served as a trading hub for spices, textiles, and luxury goods. The city blended European and Indian cultures, with magnificent churches alongside Hindu temples. Goa remained Portuguese until 1961, far longer than most colonial possessions." },
    { title: "Decline of Portuguese Power", content: "Portuguese dominance waned in the 1600s. The Dutch captured key trading posts, including Malacca (1641). The Spanish union (1580-1640) diverted resources. Brazil became increasingly important as Asian profits declined. By 1700, Portugal was a second-rate power, though its empire persisted." },
  ],
  9: [
    { title: "Spanish Colonial Structure", content: "Spain created the largest European empire in the Americas. Two viceroyalties—New Spain (Mexico) and Peru—administered territories from California to Argentina. Royal bureaucrats, the encomienda system, and the Catholic Church maintained control. Silver from Mexico and Peru financed Spanish power in Europe." },
    { title: "Viceroyalty System", content: "Viceroys governed in the king's name with near-absolute authority. Below them, audiencias (courts) administered regions. This hierarchical system extended Spanish law and Catholicism across vast distances. Colonial officials served limited terms to prevent independent power bases, though corruption remained endemic." },
    { title: "The Encomienda System", content: "The encomienda granted Spanish colonists control over indigenous labor and tribute. In exchange, encomenderos were supposed to protect and Christianize their charges. In practice, the system enabled brutal exploitation. Reformers like Bartolomé de las Casas protested, leading to the New Laws of 1542, though abuse continued." },
    { title: "Silver and Global Trade", content: "American silver transformed the global economy. The Potosí mine in Peru was the largest silver source in the world. Mexican silver supplemented this production. Spanish treasure fleets carried silver to Europe, where it flowed to China to purchase silk and porcelain. Silver linked economies worldwide." },
    { title: "Manila Galleon Trade", content: "The Manila Galleon connected Spanish America with Asia. Ships sailed annually from Acapulco to Manila, carrying silver to exchange for Chinese silk, porcelain, and spices. This transpacific trade route operated from 1565 to 1815, creating economic links between three continents." },
  ],
  10: [
    { title: "Dutch Golden Age", content: "The Dutch Republic's Golden Age (1588-1672) produced remarkable economic, cultural, and commercial achievements. Amsterdam became Europe's financial capital. Dutch merchants dominated Baltic and Asian trade. The world's first stock exchange and modern banking emerged here. This small nation briefly became the world's leading commercial power." },
    { title: "Dutch East India Company (VOC)", content: "The VOC, founded in 1602, was the world's first multinational corporation. It had governmental powers: the ability to wage war, negotiate treaties, coin money, and establish colonies. At its peak, the VOC controlled the spice trade, dominated Southeast Asian commerce, and paid dividends of 40% or more." },
    { title: "Dutch in Indonesia", content: "The Dutch established their Asian headquarters at Batavia (Jakarta) in 1619. They conquered the Spice Islands, establishing monopolies on nutmeg, mace, and cloves. The VOC expelled Portuguese competitors and restricted indigenous trade. This control made the Netherlands wealthy but impoverished local populations." },
    { title: "Dutch West India Company", content: "The WIC (founded 1621) focused on the Atlantic. It briefly held northeastern Brazil and established New Amsterdam (later New York). The company played a major role in the Atlantic slave trade. Less successful than the VOC, the WIC still contributed to Dutch commercial dominance." },
    { title: "Dutch Decline", content: "Wars with England and France drained Dutch resources. The smaller nation could not sustain military competition with larger rivals. The VOC declined due to corruption and competition. By 1800, the Dutch had lost most of their colonial empire to Britain. The Golden Age had ended." },
  ],
  11: [
    { title: "British East India Company", content: "The EIC (founded 1600) became Britain's vehicle for Asian trade. Initially focused on textiles and spices, it eventually controlled India itself. Company armies defeated Indian rulers. By 1857, the EIC governed 200 million people. Its transformation from trading company to government exemplified European imperialism." },
    { title: "British Colonial Expansion", content: "Britain's American colonies began modestly at Jamestown (1607). The Caribbean islands, especially Jamaica, became more valuable through sugar. Britain conquered New France in 1763, dominating North America. By 1750, Britain had established the foundations of its later global empire." },
    { title: "French Colonial Empire", content: "France established colonies in Canada (New France), the Caribbean, and trading posts in India and Africa. French colonies were often less populated than British ones but highly profitable. The Caribbean islands of Saint-Domingue (Haiti) and Martinique produced enormous wealth through sugar and slavery." },
    { title: "Anglo-French Rivalry", content: "Britain and France competed globally throughout the 1700s. Wars in Europe extended to colonial territories. The Seven Years' War (1756-1763) was truly a world war, fought in Europe, America, Africa, and Asia. British victory established their commercial and colonial supremacy, though at enormous cost." },
    { title: "Hudson's Bay Company", content: "The HBC (founded 1670) monopolized fur trade in northern Canada. Unlike agricultural colonies, the fur trade required good relations with indigenous peoples. The company's vast territories eventually became part of Canada. The HBC exemplified the trading company model of colonialism." },
  ],
  12: [
    { title: "Mercantilism Explained", content: "Mercantilism was the dominant economic theory of the era. It held that global wealth was fixed, so one nation's gain was another's loss. Governments should accumulate gold and silver, maintain favorable trade balances, and develop colonies as sources of raw materials and markets for manufactures. These ideas shaped colonial policy." },
    { title: "Colonial Trade Regulations", content: "European powers restricted colonial trade to benefit the mother country. Navigation Acts (England) required goods to travel in English ships. Colonial manufactures were often prohibited to protect home industries. Colonies existed to enrich the metropole, not to develop independently." },
    { title: "Joint-Stock Companies", content: "Joint-stock companies financed exploration and colonization. Investors pooled capital, sharing risks and profits. The EIC, VOC, and Virginia Company used this model. Companies received royal charters granting monopolies and governmental powers. This innovation channeled private capital into imperial expansion." },
    { title: "Colonial Administration Challenges", content: "Governing distant colonies posed enormous challenges. Communications took months. Local officials often pursued personal interests over metropolitan policies. Corruption was endemic. Indigenous peoples, enslaved Africans, and colonists all resisted controls. Colonial administration required constant adaptation." },
    { title: "Economic Impact on Europe", content: "Colonial trade transformed European economies. New products—sugar, tobacco, coffee, tea—created new industries. Colonial markets absorbed manufactures. Profits funded industrialization. Financial innovations developed to manage colonial trade. The commercial revolution laid foundations for the Industrial Revolution." },
  ],
  13: [
    { title: "Atlantic Slave Trade Origins", content: "The Atlantic slave trade emerged from labor demands in the Americas. Indigenous populations collapsed from disease. European indentured servants were insufficient. African slaves, already traded by Arab merchants, became the labor force for plantations. Over 12 million Africans were forcibly transported to the Americas." },
    { title: "The Middle Passage", content: "The Middle Passage—the Atlantic crossing—was horrific. Enslaved Africans were packed tightly in ships for weeks. Death rates averaged 15-20%. Disease, violence, and suicide claimed countless lives. Survivors faced brutal plantation labor. The Middle Passage represents one of history's greatest crimes against humanity." },
    { title: "Triangular Trade Routes", content: "The triangular trade connected Europe, Africa, and the Americas. European manufactured goods went to Africa, exchanged for enslaved people. Ships carried captives to the Americas, exchanging them for sugar, tobacco, and other products. These returned to Europe. The trade enriched port cities on all three continents." },
    { title: "Plantation System", content: "Plantations were agricultural factories producing tropical commodities. Sugar plantations were particularly brutal; life expectancy for enslaved workers was often under ten years. Coffee, tobacco, cotton, and rice plantations also relied on slave labor. The plantation system generated enormous wealth through systematic dehumanization." },
    { title: "Impact on Africa", content: "The slave trade devastated Africa. Millions of young, productive people were removed. Warfare for captives destabilized societies. Guns obtained through trade intensified conflicts. Economic development was stunted. The psychological and social effects persist today. Africa's losses enriched the Atlantic world." },
  ],
  14: [
    { title: "Indigenous Resistance", content: "Indigenous peoples resisted colonialism from the beginning. Armed resistance included the Aztec defense of Tenochtitlan and Inca rebellion under Manco Inca. Cultural resistance preserved languages, religions, and traditions despite pressure. Adaptation strategies included selective acceptance of useful European elements while maintaining identity." },
    { title: "Maroon Communities", content: "Maroons were escaped slaves who formed independent communities. In Jamaica, Brazil, Suriname, and elsewhere, maroons defended their freedom against colonial forces. Some communities won formal recognition and territorial rights. Maroon resistance demonstrated the limits of colonial power and the determination of the enslaved." },
    { title: "Slave Rebellions", content: "Enslaved people resisted constantly through work slowdowns, sabotage, running away, and rebellion. Major revolts included the Stono Rebellion (1739) and repeated uprisings in the Caribbean. Though usually suppressed, rebellions kept slaveholders fearful and unstable. Resistance was a constant feature of slave societies." },
    { title: "Piracy and Privateering", content: "Pirates and privateers challenged colonial trade. The Caribbean was particularly notorious for piracy in the 1600s-1700s. Some pirates were former slaves or servants. While romanticized today, piracy represented a genuine challenge to colonial order and a redistribution of colonial wealth." },
    { title: "Colonial Conflicts", content: "European powers fought constantly over colonies. The War of Spanish Succession, Seven Years' War, and numerous smaller conflicts involved colonial territories. Indigenous peoples allied with European powers or exploited their divisions. These conflicts shaped colonial borders and the fates of millions." },
  ],
  15: [
    { title: "Pueblo Revolt of 1680", content: "The Pueblo Revolt was one of the most successful indigenous rebellions against European colonialism. Led by Popé, the Pueblos expelled Spanish colonists from New Mexico, killing 400 and driving out 2,000 survivors. The Spanish didn't reconquer the region until 1692. The revolt demonstrated unified indigenous resistance." },
    { title: "Tupac Amaru II Rebellion", content: "José Gabriel Condorcanqui, known as Tupac Amaru II, led a massive rebellion in Peru (1780-1781). Claiming descent from the last Inca emperor, he united indigenous, mestizo, and some creole supporters. The Spanish crushed the rebellion brutally, executing Tupac Amaru II publicly. The rebellion foreshadowed later independence movements." },
    { title: "Queen Nzinga's Resistance", content: "Queen Nzinga of Ndongo and Matamba (modern Angola) resisted Portuguese colonialism for decades (1620s-1660s). She formed alliances, led armies, and negotiated from positions of strength. Though ultimately unable to prevent Portuguese expansion, her resistance remained an inspiration for later liberation movements." },
    { title: "Haitian Revolution Origins", content: "The Haitian Revolution (1791-1804) had roots in the brutal conditions of Saint-Domingue's sugar plantations. Earlier conspiracies and small revolts built toward the massive uprising of 1791. Led eventually by Toussaint L'Ouverture, the revolution created the first independent Black nation in the Americas." },
    { title: "Significance of Resistance", content: "Resistance movements demonstrated that colonial control was never complete or uncontested. They shaped colonial policies, forced adaptations, and preserved alternative traditions. The memory of resistance inspired later independence movements. Colonial history is incomplete without acknowledging constant opposition to European domination." },
  ],
  16: [
    { title: "Casta System Overview", content: "The Spanish colonies developed an elaborate racial classification system called the casta (or sociedad de castas). It categorized people by their ancestry from Spaniards, indigenous peoples, and Africans. This system shaped legal rights, occupational possibilities, and social status. Casta paintings depicted these categories visually." },
    { title: "Peninsulares and Creoles", content: "The colonial elite divided between peninsulares (born in Spain) and creoles (Spaniards born in the Americas). Peninsulares held the highest governmental and church positions. Creoles, though wealthy and educated, faced discrimination. This tension eventually fueled independence movements in the early 1800s." },
    { title: "Mestizo Identity", content: "Mestizos, people of mixed Spanish and indigenous ancestry, formed a growing portion of colonial populations. Their status was ambiguous—higher than indigenous people but lower than Spaniards. Mestizo identity eventually became central to Mexican and other Latin American national identities." },
    { title: "Mulatto and Zambo Categories", content: "Mixed African ancestry created additional categories. Mulattoes (Spanish-African) and zambos (indigenous-African) faced discrimination but had some rights denied to enslaved Africans. Free people of color formed a significant population in many colonies, occupying an intermediate social position." },
    { title: "Fluidity and Manipulation", content: "Despite official categories, racial classification was fluid. Wealth could 'whiten' social standing. Church records sometimes changed. People manipulated the system when possible. The rigid appearance of the casta system masked a more complex social reality of negotiation and adaptation." },
  ],
  17: [
    { title: "Encomienda System", content: "The encomienda granted Spanish settlers rights to indigenous labor and tribute. Encomenderos theoretically provided protection and Christian instruction. In practice, the system enabled brutal exploitation. Reformers like Bartolomé de las Casas condemned encomienda abuses, leading to legal reforms that were poorly enforced." },
    { title: "Mita Labor System", content: "The mita was a rotational labor draft inherited from the Inca Empire. Spanish colonizers adapted it to supply workers for silver mines, especially Potosí. Mita obligations could be fatal; mercury poisoning and harsh conditions killed countless workers. The system exemplified colonial labor extraction." },
    { title: "Hacienda Development", content: "Haciendas were large agricultural estates that emerged as encomiendas declined. They used various forms of coerced labor, including debt peonage. Workers became tied to haciendas through debts they could never repay. The hacienda system persisted in Latin America into the 20th century." },
    { title: "Slavery in the Americas", content: "African slavery was the dominant labor system in plantation regions. Enslaved people had no legal rights and were considered property. Work conditions varied by region and crop but were uniformly exploitative. Slavery's economic importance made abolition a prolonged struggle." },
    { title: "Indentured Servitude", content: "Indentured servants worked for fixed terms (usually 4-7 years) in exchange for passage to the Americas. Many Europeans arrived this way in the 17th century. Conditions could be harsh, but servants eventually gained freedom. The system declined as African slavery became more profitable." },
  ],
  18: [
    { title: "Global Transformations 1450-1750", content: "The period 1450-1750 witnessed unprecedented global change. Transoceanic connections linked previously isolated regions. The Columbian Exchange transformed ecosystems and demographics. New empires emerged while old ones adapted or fell. Trade patterns shifted from land routes to sea lanes. The world became interconnected." },
    { title: "Continuities Across the Period", content: "Despite dramatic changes, many elements persisted. Most people remained agricultural. Traditional religions continued alongside Christianity and Islam. Land-based empires (Ottoman, Mughal, Ming/Qing) remained powerful. Gender hierarchies changed little. Regional trade patterns supplemented but didn't replace global connections." },
    { title: "Economic Transformations", content: "The global economy transformed fundamentally. American silver and colonial trade created new financial systems. Joint-stock companies mobilized capital. Mercantilism shaped state policies. Proto-industrialization began in some regions. These changes laid foundations for industrial capitalism." },
    { title: "Political Changes", content: "New forms of political organization emerged. Centralized states strengthened in Europe and Asia. Colonial administrations governed distant territories. Resistance and rebellion challenged imperial control. The nation-state concept began developing. Political maps were redrawn repeatedly." },
    { title: "Cultural Exchanges", content: "Cultures mixed and clashed globally. Christianity spread through missionary activity. Scientific knowledge circulated internationally. Art, music, and literature reflected cross-cultural influences. Syncretic religions and cultures emerged. The world became more connected but also more conflicted." },
  ],
  19: [
    { title: "Unit 4 Key Concepts", content: "AP World Unit 4 covers the period 1450-1750, focusing on: technological innovations enabling exploration; causes and events of European exploration; the Columbian Exchange; establishment and maintenance of maritime empires; challenges to state power; changing social hierarchies; and continuity and change across the period." },
    { title: "Major Themes", content: "Key themes include: the creation of the first truly global trade networks; the devastating impact of the Columbian Exchange on indigenous populations; the rise of maritime empires based on naval power and trading posts; the expansion of slavery and coerced labor; resistance to colonial rule; and the emergence of new social hierarchies based on race." },
    { title: "Important Developments", content: "Critical developments include: Portuguese and Spanish exploration; the Columbian Exchange; the Atlantic slave trade; the rise of mercantilism; the growth of joint-stock companies; challenges to colonial authority; and the mixing of cultures, peoples, and ideas across hemispheres." },
    { title: "Comparison Opportunities", content: "Exam questions often ask for comparisons: maritime empires vs. land-based empires; Portuguese vs. Spanish colonial methods; labor systems (encomienda, mita, slavery, indentured servitude); and colonial social hierarchies in different regions. Practice identifying similarities and differences." },
    { title: "Exam Strategies", content: "For AP success: use specific historical evidence; practice DBQ and LEQ writing; understand causation and continuity/change; make cross-cultural comparisons; use proper historical terminology. Review past exam questions and scoring guidelines. Practice with timed writing." },
  ],
};

// Generate 5 file sources (simulated PDF documents)
function generateFileSourcesForTopic(topicIndex: number): { title: string; fileUrl: string }[] {
  const baseTopics = [
    "Primary Source Document",
    "Historical Map Collection",
    "Academic Analysis",
    "Timeline and Key Events",
    "Review Worksheet",
  ];

  const topic = UNIT_4_NOTEBOOKS[topicIndex];
  return baseTopics.map((base, i) => ({
    title: `${base} - ${topic.title.split(' - ')[1] || topic.title}`,
    fileUrl: `https://example.com/docs/apwh-unit4-${topicIndex + 1}-document-${i + 1}.pdf`,
  }));
}

// Prompts for output generation
const OUTPUT_PROMPTS: Record<NotebookOutputType, string> = {
  AUDIO_OVERVIEW: "Create a podcast-style audio review discussing the key concepts. Format as a conversational dialogue between two hosts.",
  VIDEO_OVERVIEW: "Create a video presentation script with visual descriptions for each segment. Include narration and scene descriptions.",
  MIND_MAP: "Create a comprehensive mind map with a central topic and 4-8 major branches with detailed subtopics.",
  SUMMARY: "Create a detailed summary covering all major themes, key points, and important details.",
  STUDY_GUIDE: "Create a comprehensive study guide with topics, concepts, terms with definitions, and review questions.",
  FLASHCARD_DECK: "Create 15-20 flashcards covering key concepts, terms, and important facts.",
  QUIZ: "Create a quiz with 10-15 questions of various types (multiple choice, true/false, short answer).",
  FAQ: "Generate frequently asked questions covering the main topics.",
  BRIEFING_DOC: "Create an executive briefing with key findings and recommendations.",
  TIMELINE: "Create a timeline of major events and developments.",
  DATA_TABLE: "Extract and organize data into structured tables.",
};

async function createNotebook(
  notebookData: typeof UNIT_4_NOTEBOOKS[0],
  topicIndex: number,
  userId: string
): Promise<string> {
  console.log(`\nCreating notebook: ${notebookData.title}`);

  // Create the notebook
  const notebook = await prisma.notebook.create({
    data: {
      userId,
      title: notebookData.title,
      description: notebookData.description,
      emoji: notebookData.emoji,
      color: notebookData.color,
      isPublic: true,
    },
  });

  console.log(`  Created notebook: ${notebook.id}`);
  return notebook.id;
}

async function addSourcesToNotebook(notebookId: string, topicIndex: number): Promise<void> {
  console.log(`  Adding sources to notebook...`);

  const sources: Array<{
    notebookId: string;
    type: NotebookSourceType;
    title: string;
    originalUrl?: string;
    content?: string;
    fileUrl?: string;
    status: SourceProcessingStatus;
    wordCount?: number;
  }> = [];

  // Add 5 YouTube sources
  const youtubeUrls = YOUTUBE_SOURCES_BY_TOPIC[topicIndex] || YOUTUBE_SOURCES_BY_TOPIC[0];
  for (const yt of youtubeUrls) {
    sources.push({
      notebookId,
      type: 'YOUTUBE',
      title: yt.title,
      originalUrl: yt.url,
      content: `YouTube Video: ${yt.title}\n\nThis educational video covers topics related to AP World History Unit 4.`,
      status: 'COMPLETED',
      wordCount: 500,
    });
  }

  // Add 5 Website/URL sources
  const websiteUrls = WEBSITE_SOURCES_BY_TOPIC[topicIndex] || WEBSITE_SOURCES_BY_TOPIC[0];
  for (const web of websiteUrls) {
    sources.push({
      notebookId,
      type: 'URL',
      title: web.title,
      originalUrl: web.url,
      content: `Web Resource: ${web.title}\n\nThis website provides educational content about AP World History Unit 4 topics including exploration, colonization, and the Columbian Exchange.`,
      status: 'COMPLETED',
      wordCount: 800,
    });
  }

  // Add 5 File/PDF sources
  const fileSources = generateFileSourcesForTopic(topicIndex);
  for (const file of fileSources) {
    sources.push({
      notebookId,
      type: 'PDF',
      title: file.title,
      fileUrl: file.fileUrl,
      content: `PDF Document: ${file.title}\n\nThis document contains primary sources, historical analysis, and study materials for AP World History Unit 4.`,
      status: 'COMPLETED',
      wordCount: 1200,
    });
  }

  // Add 5 Pasted Text sources
  const textContent = TEXT_CONTENT_BY_TOPIC[topicIndex] || TEXT_CONTENT_BY_TOPIC[0];
  for (const text of textContent) {
    sources.push({
      notebookId,
      type: 'TEXT',
      title: text.title,
      content: text.content,
      status: 'COMPLETED',
      wordCount: text.content.split(/\s+/).length,
    });
  }

  // Bulk insert all sources
  await prisma.notebookSource.createMany({
    data: sources,
  });

  console.log(`    Added ${sources.length} sources (5 YouTube, 5 URLs, 5 PDFs, 5 Text)`);
}

async function generateOutputsForNotebook(notebookId: string, notebookTitle: string): Promise<void> {
  console.log(`  Generating outputs for notebook...`);

  // Get all sources for context
  const sources = await prisma.notebookSource.findMany({
    where: { notebookId, status: 'COMPLETED' },
    select: { title: true, content: true },
  });

  const sourceContext = sources
    .map(s => `[Source: ${s.title}]\n${s.content || ''}`)
    .join('\n\n---\n\n');

  // Output types to generate (5 of each)
  const outputTypesToGenerate: Array<{
    type: NotebookOutputType;
    count: number;
    baseTitle: string;
  }> = [
    { type: 'AUDIO_OVERVIEW', count: 5, baseTitle: 'Audio Review' },
    { type: 'VIDEO_OVERVIEW', count: 5, baseTitle: 'Video Overview' },
    { type: 'MIND_MAP', count: 5, baseTitle: 'Mind Map' },
    { type: 'SUMMARY', count: 5, baseTitle: 'Summary Report' },
    { type: 'FLASHCARD_DECK', count: 5, baseTitle: 'Flashcard Deck' },
    { type: 'QUIZ', count: 5, baseTitle: 'Quiz' },
  ];

  for (const outputConfig of outputTypesToGenerate) {
    console.log(`    Generating ${outputConfig.count}x ${outputConfig.type}...`);

    for (let i = 1; i <= outputConfig.count; i++) {
      const title = `${outputConfig.baseTitle} ${i} - ${notebookTitle}`;

      try {
        // Create pending output
        const output = await prisma.notebookOutput.create({
          data: {
            notebookId,
            type: outputConfig.type,
            title,
            content: {},
            status: 'PENDING',
          },
        });

        // Call Workers API to generate content
        let generatedContent: Record<string, unknown> = {};

        try {
          if (outputConfig.type === 'VIDEO_OVERVIEW') {
            // Use dedicated video endpoint
            const response = await fetch(`${WORKERS_URL}/api/video-overview/generate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sourceId: output.id,
                context: sourceContext.substring(0, 8000),
              }),
            });

            if (response.ok) {
              const videoData = await response.json();
              generatedContent = {
                videoUrl: videoData.videoUrl,
                thumbnailUrl: videoData.thumbnailUrl,
                audioUrl: videoData.audioUrl,
                segments: videoData.segments,
                totalDuration: videoData.totalDuration,
                isActualVideo: true,
              };
            }
          } else {
            // Use generic generate endpoint
            const response = await fetch(`${WORKERS_URL}/api/generate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt: OUTPUT_PROMPTS[outputConfig.type],
                context: sourceContext.substring(0, 8000),
                outputType: outputConfig.type,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              generatedContent = data.content || data;
            }
          }
        } catch (apiError) {
          console.error(`      API error for ${output.id}:`, apiError);
        }

        // Update output with content
        const hasContent = generatedContent && typeof generatedContent === 'object' && Object.keys(generatedContent).length > 0;

        await prisma.notebookOutput.update({
          where: { id: output.id },
          data: {
            content: generatedContent as any,
            status: hasContent ? 'COMPLETED' : 'FAILED',
          },
        });

        // Small delay between API calls
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`      Error generating ${outputConfig.type} ${i}:`, error);
      }
    }
  }

  console.log(`    Output generation complete`);
}

async function main() {
  console.log('='.repeat(60));
  console.log('AP World History Unit 4 - Notebook Generator');
  console.log('='.repeat(60));

  try {
    // Find or create a system user for public content
    let systemUser = await prisma.user.findFirst({
      where: { email: 'system@edufeed.com' },
    });

    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          email: 'system@edufeed.com',
          name: 'EduFeed System',
          updatedAt: new Date(),
        },
      });
      console.log(`Created system user: ${systemUser.id}`);
    }

    const userId = systemUser.id;
    console.log(`Using user ID: ${userId}`);

    // Create notebook group for AP World Unit 4
    let notebookGroup = await prisma.notebookGroup.findFirst({
      where: {
        userId,
        name: 'AP World History - Unit 4',
      },
    });

    if (!notebookGroup) {
      notebookGroup = await prisma.notebookGroup.create({
        data: {
          userId,
          name: 'AP World History - Unit 4',
          description: 'Transoceanic Interconnections (c. 1450-1750)',
          emoji: '🌍',
          color: '#3b82f6',
        },
      });
      console.log(`Created notebook group: ${notebookGroup.id}`);
    }

    // Create all 20 notebooks
    const createdNotebooks: string[] = [];

    for (let i = 0; i < UNIT_4_NOTEBOOKS.length; i++) {
      const notebookData = UNIT_4_NOTEBOOKS[i];

      // Check if notebook already exists
      const existing = await prisma.notebook.findFirst({
        where: {
          userId,
          title: notebookData.title,
        },
      });

      if (existing) {
        console.log(`\nSkipping existing notebook: ${notebookData.title}`);
        createdNotebooks.push(existing.id);
        continue;
      }

      // Create notebook
      const notebookId = await createNotebook(notebookData, i, userId);

      // Update to link to group
      await prisma.notebook.update({
        where: { id: notebookId },
        data: { groupId: notebookGroup.id },
      });

      // Add sources
      await addSourcesToNotebook(notebookId, i);

      // Generate outputs (5 of each type: audio, video, mind map, summary, flashcards, quiz)
      await generateOutputsForNotebook(notebookId, notebookData.title);

      createdNotebooks.push(notebookId);

      // Progress indicator
      console.log(`  Progress: ${i + 1}/${UNIT_4_NOTEBOOKS.length} notebooks complete`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('GENERATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`Created ${createdNotebooks.length} notebooks`);
    console.log(`Each notebook has:`);
    console.log(`  - 20 sources (5 YouTube, 5 URLs, 5 PDFs, 5 Text)`);
    console.log(`  - 30 outputs (5 Audio, 5 Video, 5 Mind Maps, 5 Summaries, 5 Flashcards, 5 Quizzes)`);
    console.log(`Total: ${createdNotebooks.length * 20} sources, ${createdNotebooks.length * 30} outputs`);

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
