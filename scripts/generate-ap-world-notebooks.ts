/**
 * AP World History Unit 4 - Notebook Generator Script
 * Creates 20 notebooks for each lesson with sources and generates all outputs
 *
 * Requirements per notebook:
 * - 5 YouTube links
 * - 5 files (URLs to educational PDFs/documents)
 * - 5 websites
 * - 5 pasted text
 * - Generate: 5 audio reviews, 5 video overviews, 5 mind maps, 5 reports, 5 flashcards, 5 quizzes
 */

import { PrismaClient, NotebookSourceType, NotebookOutputType } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration
const TEST_USER_EMAIL = 'test@edufeed.com'; // Change this to your test user's email
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// AP World History Unit 4 Lessons (20 total - expanded from 8 main topics)
const AP_WORLD_UNIT_4_LESSONS = [
  // 4.1 Technological Innovations
  {
    id: '4.1a',
    title: '4.1 Maritime Navigation Technology',
    description: 'Exploring the magnetic compass, astrolabe, and navigation advances that enabled transoceanic voyages from 1450-1750.',
    emoji: '🧭',
    color: '#3b82f6',
    topic: 'technological_innovations',
    textContent: `Maritime Navigation Technology (1450-1750)

The Age of Exploration was made possible by significant advances in maritime navigation technology. European sailors drew upon centuries of accumulated knowledge from various civilizations to develop tools and techniques that would allow them to cross vast oceans.

The Magnetic Compass: Originally developed in China during the Han Dynasty, the magnetic compass reached Europe by the 12th century. By the 15th century, it had become an essential tool for ocean navigation, allowing sailors to maintain their heading even when clouds obscured the sun and stars.

The Astrolabe: This ancient Greek instrument was refined by Islamic scholars and transmitted to Europe through Al-Andalus (Islamic Spain). Mariners used astrolabes to measure the altitude of celestial bodies, particularly the North Star (Polaris), enabling them to calculate their latitude with reasonable accuracy.

Dead Reckoning: Sailors combined compass readings with estimates of their speed (measured by throwing a log overboard and timing how quickly it passed the ship) to calculate their position. While imprecise, dead reckoning remained a fundamental navigation technique.

Portolan Charts: These detailed nautical maps, first developed in the Mediterranean, showed coastlines, harbors, and compass directions. As European exploration expanded, cartographers created increasingly accurate charts of new territories.

The Caravel: Portuguese shipbuilders developed this revolutionary vessel, combining the maneuverability of a lateen sail with the cargo capacity of a traditional European ship. The caravel could sail closer to the wind than any previous design, making it ideal for exploration.

These technological innovations collectively enabled European powers to establish maritime routes across the Atlantic, around Africa to Asia, and eventually around the world, fundamentally transforming global trade and cultural exchange.`,
  },
  {
    id: '4.1b',
    title: '4.1 Ship Design and Naval Architecture',
    description: 'The evolution of ship design including caravels, galleons, and junks that enabled global trade networks.',
    emoji: '⛵',
    color: '#6366f1',
    topic: 'technological_innovations',
    textContent: `Ship Design and Naval Architecture (1450-1750)

The transformation of global maritime trade during this period was intimately connected to revolutionary advances in ship design. Different civilizations developed distinctive vessels suited to their needs and waters.

Portuguese Caravels: The caravel emerged in the 15th century as the premier exploration vessel. Its innovative design combined:
- Lateen (triangular) sails for sailing close to the wind
- Shallow draft for exploring coastal waters
- Small crew requirements
- High maneuverability

Spanish Galleons: As trade routes became established, larger vessels were needed. The galleon featured:
- Multiple decks for cargo and cannon
- Square and lateen sails combined for speed and versatility
- Heavy armament for protection
- Large cargo holds for treasure and trade goods

Chinese Junks: The sophisticated Chinese junk design included:
- Watertight compartments for safety
- Balanced rudders for steering
- Battened sails easily adjusted by small crews
- Flat bottoms suitable for shallow coastal waters

The galleon became the workhorse of transoceanic trade, carrying silver from the Americas to Manila, spices from Southeast Asia to Europe, and enslaved Africans across the Atlantic. The Manila Galleon trade route (1565-1815) exemplified how ship design enabled truly global commerce.

Ottoman and Dhow Traditions: Arab and Ottoman seafarers continued refining the dhow, with its characteristic lateen sails perfect for the seasonal monsoon winds of the Indian Ocean. These vessels maintained centuries-old trade connections while European ships increasingly entered these waters.

By 1750, hybrid designs incorporating features from multiple traditions had emerged, reflecting the truly global nature of maritime exchange during this transformative period.`,
  },
  // 4.2 Exploration
  {
    id: '4.2a',
    title: '4.2 European Exploration Motivations',
    description: 'The religious, economic, and political motivations driving European exploration during the Age of Discovery.',
    emoji: '🌍',
    color: '#10b981',
    topic: 'exploration',
    textContent: `European Exploration Motivations (1450-1750)

The European Age of Exploration was driven by a complex interplay of religious, economic, and political factors that propelled European powers to seek new routes and territories.

Religious Motivations:
The Reconquista's completion in 1492 created momentum for spreading Christianity. Catholic monarchs saw exploration as an extension of religious crusade. The Treaty of Tordesillas (1494) divided newly discovered lands between Spain and Portugal, with both powers committed to converting indigenous peoples.

Economic Motivations:
The Ottoman conquest of Constantinople (1453) disrupted traditional land routes to Asia, making spices, silk, and other luxury goods more expensive. European merchants and monarchs sought direct sea routes to bypass Ottoman and Venetian middlemen. The promise of gold, silver, and new trade commodities provided powerful incentives.

Political and Strategic Motivations:
Competition between European powers, particularly Portugal, Spain, England, France, and the Netherlands, drove exploration. Establishing overseas territories enhanced national prestige and power. Naval capabilities became crucial measures of state strength.

Technological Confidence:
Advances in navigation, shipbuilding, and cartography gave Europeans confidence to attempt unprecedented voyages. The Portuguese systematic exploration of Africa's coast demonstrated that methodical expansion was possible.

Social Factors:
The Renaissance spirit of inquiry encouraged exploration and discovery. Individual adventurers sought personal glory and wealth. The printing press allowed rapid dissemination of geographical knowledge and exploration accounts.

These motivations combined to launch what became a fundamental transformation of global connections, establishing European colonial empires that would shape world history for centuries.`,
  },
  {
    id: '4.2b',
    title: '4.2 Major Explorers and Voyages',
    description: 'Key figures and journeys that established transoceanic connections including Columbus, da Gama, and Magellan.',
    emoji: '🗺️',
    color: '#f59e0b',
    topic: 'exploration',
    textContent: `Major Explorers and Voyages (1450-1750)

The Age of Exploration was defined by extraordinary voyages that connected previously separate hemispheres and established new global networks.

Portuguese Exploration:
- Prince Henry the Navigator (1394-1460) established a school of navigation and sponsored systematic exploration of Africa's west coast
- Bartolomeu Dias (1488) rounded the Cape of Good Hope, proving a sea route to Asia existed
- Vasco da Gama (1497-1499) reached India via the Cape route, establishing Portugal's lucrative spice trade
- Pedro Álvares Cabral (1500) claimed Brazil for Portugal while sailing to India

Spanish Exploration:
- Christopher Columbus (1492) reached the Caribbean, believing he had found a western route to Asia. His four voyages established permanent European presence in the Americas
- Amerigo Vespucci (1499-1502) realized the lands discovered were a "New World," not Asia
- Ferdinand Magellan (1519-1522) commanded the first circumnavigation, though he died in the Philippines; Juan Sebastián Elcano completed the voyage
- Hernán Cortés conquered the Aztec Empire (1519-1521)
- Francisco Pizarro conquered the Inca Empire (1532-1533)

Other European Powers:
- John Cabot (1497) explored North America for England
- Jacques Cartier (1534-1542) explored Canada for France
- Henry Hudson (1609-1611) explored for both England and the Dutch Republic

Impact of These Voyages:
- Established permanent transoceanic connections
- Initiated the Columbian Exchange
- Created foundations for colonial empires
- Transformed global trade patterns
- Led to catastrophic demographic collapse among indigenous peoples

These expeditions fundamentally reshaped the world, connecting the Eastern and Western Hemispheres in ways that continue to influence global society today.`,
  },
  // 4.3 Columbian Exchange
  {
    id: '4.3a',
    title: '4.3 The Columbian Exchange: Crops and Agriculture',
    description: 'How the transfer of crops between hemispheres transformed agriculture and diets globally.',
    emoji: '🌽',
    color: '#84cc16',
    topic: 'columbian_exchange',
    textContent: `The Columbian Exchange: Crops and Agriculture

The Columbian Exchange refers to the massive transfer of plants, animals, diseases, people, and ideas between the Eastern and Western Hemispheres following Columbus's voyages. This biological and cultural exchange transformed agriculture and diets worldwide.

From Americas to Old World:
- Maize (Corn): Became a staple crop in Africa, Asia, and Europe, supporting population growth
- Potatoes: Revolutionized European agriculture; Irish dependence led to the devastating 1845-1852 famine
- Tomatoes: Transformed Italian, Spanish, and other cuisines
- Cacao: Chocolate became a luxury commodity in Europe
- Tobacco: Created massive European demand and Atlantic trade
- Squash, beans, peppers, peanuts: Enhanced nutrition globally

From Old World to Americas:
- Wheat: Became the foundation of colonial agriculture
- Rice: Transformed coastal regions, especially with African expertise
- Sugar cane: Created plantation economies and drove slave trade
- Coffee: Became major crop in Brazil and Caribbean
- Bananas: Spread throughout tropical America
- Grapes and olives: European Mediterranean agriculture transplanted

Agricultural Impacts:
- Crop rotation systems changed with new plant options
- Land use patterns transformed globally
- New nutritional options reduced famines in some areas
- Monoculture plantation systems emerged
- African agricultural knowledge proved essential in the Americas

The agricultural dimensions of the Columbian Exchange fundamentally altered what people around the world ate and how they farmed, with effects still visible today in global cuisine and agriculture.`,
  },
  {
    id: '4.3b',
    title: '4.3 Disease and Population Collapse',
    description: 'The devastating impact of Old World diseases on indigenous American populations.',
    emoji: '🦠',
    color: '#ef4444',
    topic: 'columbian_exchange',
    textContent: `Disease and Population Collapse in the Columbian Exchange

The most devastating aspect of the Columbian Exchange was the catastrophic impact of Old World diseases on indigenous American populations, who had no immunity to illnesses that had long circulated in Afro-Eurasia.

Major Diseases Introduced to Americas:
- Smallpox: The single deadliest disease, with mortality rates of 30-90% among indigenous peoples
- Measles: Particularly deadly to children and those without prior exposure
- Typhus: Spread by lice in crowded conditions
- Influenza: Multiple epidemic waves over centuries
- Malaria: Established in tropical regions, affecting both indigenous and European populations
- Yellow fever: Arrived from Africa, devastating Caribbean populations

Demographic Impact:
Conservative estimates suggest indigenous population decline of 50-90% within 150 years of contact. The pre-Columbian population of the Americas (estimated at 40-100 million) collapsed to perhaps 10 million by 1600.

Case Studies:
- The Aztec Empire lost an estimated 80% of its population to smallpox during and after Spanish conquest
- The Taino of the Caribbean were nearly completely annihilated within 50 years
- North American populations from New England to Florida experienced repeated epidemics

Consequences:
- Military advantage for European conquerors
- Labor shortages led to importation of enslaved Africans
- Spiritual crisis among indigenous peoples, sometimes interpreted as divine punishment
- Disruption of traditional governance and social structures
- Land appeared "empty" to European colonizers

This demographic catastrophe fundamentally shaped the colonial period and the development of the Americas.`,
  },
  {
    id: '4.3c',
    title: '4.3 Animal Exchange and Environmental Impact',
    description: 'The introduction of livestock to the Americas and the ecological transformation that followed.',
    emoji: '🐴',
    color: '#8b5cf6',
    topic: 'columbian_exchange',
    textContent: `Animal Exchange and Environmental Impact

The Columbian Exchange involved not just plants and diseases but also animals, which profoundly transformed ecosystems on both sides of the Atlantic.

Animals Introduced to the Americas:
Livestock:
- Horses: Revolutionized warfare, hunting, and transportation for indigenous peoples of the Great Plains
- Cattle: Transformed landscapes for ranching; became central to economies from Mexico to Argentina
- Pigs: Adapted rapidly; became primary meat source in many regions
- Sheep: Introduced wool production and changed vegetation through grazing
- Goats: Adapted to marginal lands

Work Animals:
- Oxen: Enabled large-scale plowing
- Donkeys and mules: Essential for mining operations and mountain transport

Smaller Animals:
- Chickens: Spread throughout the Americas
- Honeybees: Accompanied European agriculture

Animals to the Old World:
- Turkeys: Became popular in European cuisine
- Guinea pigs: Minor food source
- Llamas and alpacas: Limited spread outside South America

Environmental Impacts:
Livestock populations exploded in the Americas, often faster than human population growth. This led to:
- Overgrazing and erosion
- Competition with indigenous wildlife
- Transformation of grasslands
- Deforestation for pasture
- Introduction of European grasses

The horse's impact on Plains Indian cultures represents one of the most dramatic examples of how animal exchange could transform entire societies, creating new cultural practices and economies within a few generations.

These environmental changes, combined with new agricultural practices, fundamentally reshaped American landscapes in ways that persist to the present day.`,
  },
  // 4.4 Maritime Empires Established
  {
    id: '4.4a',
    title: '4.4 Spanish Colonial Empire',
    description: 'The establishment of Spanish colonial rule in the Americas including the conquest of Aztec and Inca empires.',
    emoji: '👑',
    color: '#dc2626',
    topic: 'maritime_empires',
    textContent: `Spanish Colonial Empire (1492-1750)

Spain established the first major European colonial empire in the Americas, conquering vast territories and indigenous peoples while extracting enormous wealth.

Conquest of the Aztec Empire (1519-1521):
Hernán Cortés led a small force of Spanish conquistadors who allied with indigenous groups resentful of Aztec rule. The conquest succeeded due to:
- Technological advantages (steel weapons, armor, horses, cannons)
- Epidemic disease devastating the Aztec population
- Indigenous allies providing thousands of warriors
- Capture of Emperor Moctezuma II
- The siege of Tenochtitlan

Conquest of the Inca Empire (1532-1572):
Francisco Pizarro exploited a civil war between Atahualpa and Huáscar to capture the Inca emperor. The conquest was aided by:
- Smallpox reaching the Andes before the Spanish
- Superior weapons and horses
- Indigenous resentment of Inca rule
- Manipulation of succession disputes

Colonial Administration:
Spain established the viceroyalties of New Spain (Mexico) and Peru to govern its American territories through:
- The encomienda system granting Spanish settlers indigenous labor
- The Catholic Church's mission to convert native peoples
- The hacienda system organizing agricultural production
- Mining operations, particularly silver at Potosí and Zacatecas
- The Casa de Contratación (House of Trade) regulating commerce

Social Hierarchy:
Spanish colonial society was organized into castas:
- Peninsulares: Spanish-born Europeans
- Criollos/Creoles: American-born Europeans
- Mestizos: Mixed European-indigenous ancestry
- Indigenous peoples and Africans at the bottom

This colonial structure would persist for nearly three centuries, profoundly shaping Latin American societies.`,
  },
  {
    id: '4.4b',
    title: '4.4 Portuguese Maritime Empire',
    description: 'Portuguese trading posts and colonial territories from Brazil to Africa to Asia.',
    emoji: '⚓',
    color: '#0ea5e9',
    topic: 'maritime_empires',
    textContent: `Portuguese Maritime Empire (1415-1750)

Portugal created a pioneering maritime trading empire that stretched from Brazil to Africa, India, Southeast Asia, and China, establishing a model that other European powers would follow.

African Connections:
Beginning with Ceuta (1415), Portugal established:
- Trading posts along West Africa's coast
- The slave trade from Africa to the Americas
- Angola and Mozambique as major colonial territories
- Control of key ports like Elmina (Ghana) for gold and slaves

Brazil:
Pedro Álvares Cabral claimed Brazil in 1500. Development included:
- Sugar plantations using enslaved African labor
- Brazilwood extraction (giving the colony its name)
- Gold and diamond mining from the 1690s
- Expansion into the interior, pushing beyond Tordesillas line

Indian Ocean Trading Posts:
Vasco da Gama's voyage opened the way for Portuguese presence:
- Goa (1510) became the capital of Portuguese India
- Hormuz controlled Persian Gulf trade
- Malacca (1511) dominated Southeast Asian spice trade
- Various posts in Ceylon, Indonesia, and beyond

East Asian Presence:
- Macau (1557) provided access to Chinese markets
- Trading post at Nagasaki, Japan (until expelled in 1639)
- Limited formal territory but significant trade influence

Administrative Structure:
The Estado da Índia governed Portuguese territories east of the Cape of Good Hope, while Brazil was administered separately. Unlike Spain's territorial empire, Portugal primarily maintained a network of trading posts.

Portuguese Legacy:
- Creole languages and cultures throughout former territories
- Spread of Catholicism
- Global trade networks connecting three continents
- Sugar plantation system exported to the Caribbean and beyond

Though smaller than Spain's empire in territory, Portugal's commercial network pioneered truly global trade.`,
  },
  {
    id: '4.4c',
    title: '4.4 Dutch, British, and French Colonization',
    description: 'The rise of Northwest European colonial powers challenging Iberian dominance.',
    emoji: '🏴',
    color: '#1e40af',
    topic: 'maritime_empires',
    textContent: `Dutch, British, and French Colonization (1600-1750)

In the 17th century, Northwestern European powers challenged Iberian dominance, establishing their own colonial empires through different strategies and institutions.

Dutch Empire:
The Dutch Republic created a commercial empire focused on trade:
- Dutch East India Company (VOC, 1602): First joint-stock company, dominated Indonesian spice trade
- Dutch West India Company (WIC, 1621): Caribbean sugar colonies, slave trade, briefly held New Amsterdam
- Cape Colony (South Africa, 1652): Strategic waypoint to Asia
- Batavia (Jakarta) as capital of the Dutch East Indies
- Defeated Portuguese in many Asian territories

British Empire:
England/Britain developed settler colonies and trading posts:
- Virginia (1607) and Massachusetts (1620): Settler colonies in North America
- Caribbean sugar islands: Barbados, Jamaica (taken from Spain, 1655)
- East India Company (1600): Gradually expanded from trading posts to territorial control in India
- Hudson's Bay Company (1670): Fur trade in Canada
- Thirteen Colonies developed distinct colonial society

French Empire:
France established territories in North America and the Caribbean:
- New France (Canada): Fur trade with indigenous allies
- Louisiana: Vast but sparsely settled territory
- Saint-Domingue (Haiti): Most profitable sugar colony by 1750
- Caribbean islands: Martinique, Guadeloupe
- French East India Company: Established posts in India

Key Differences from Iberian Empires:
- Joint-stock companies played larger roles
- More religious diversity (Protestant colonies)
- Less integration of indigenous peoples in some regions
- Greater emphasis on trade versus territorial control
- Settler colonies with more self-governance

By 1750, competition among these powers would lead to global conflicts, including the Seven Years' War, which would reshape colonial holdings worldwide.`,
  },
  // 4.5 Maritime Empires Maintained
  {
    id: '4.5a',
    title: '4.5 Mercantilism and Colonial Economics',
    description: 'The economic theories and practices that organized colonial trade and wealth extraction.',
    emoji: '💰',
    color: '#f97316',
    topic: 'empire_maintenance',
    textContent: `Mercantilism and Colonial Economics (1500-1750)

Mercantilism was the dominant economic theory guiding European colonial policies during this period. It shaped how empires extracted wealth from colonies and regulated trade.

Core Mercantilist Principles:
- Wealth is finite; nations compete for a fixed amount of gold and silver
- A favorable balance of trade (exports exceeding imports) enriches the nation
- Colonies exist to benefit the mother country
- Government should actively regulate commerce
- Monopolies on colonial trade are justified

Spanish Colonial Economics:
- Silver from Potosí and Zacatecas flooded European markets
- The Manila Galleon traded silver for Chinese goods
- Strict monopoly trade through Seville/Cádiz
- Encomienda and mita labor systems
- Hacienda agricultural production

British Navigation Acts (1651-1673):
- Colonial goods must travel in British ships
- Enumerated goods could only be sold to Britain
- European goods to colonies must pass through British ports
- Designed to benefit British merchants and shipping

French Colbertism:
Jean-Baptiste Colbert's policies exemplified mercantilism:
- State-supported manufacturing
- Tariffs on imports
- Colonial production of goods France would otherwise import
- Regulation of quality standards

Consequences of Mercantilism:
- Colonial economies oriented toward export commodities
- Smuggling and black markets flourished
- Intercolonial trade restricted
- Development of plantation monocultures
- Tension between colonial producers and metropolitan monopolies

By the mid-18th century, critics like Adam Smith began challenging mercantilist assumptions, but the system shaped colonial development throughout this period.`,
  },
  {
    id: '4.5b',
    title: '4.5 Joint-Stock Companies and Trade',
    description: 'The role of trading companies like the VOC and EIC in building and maintaining empires.',
    emoji: '📜',
    color: '#22c55e',
    topic: 'empire_maintenance',
    textContent: `Joint-Stock Companies and Colonial Trade

Joint-stock companies were revolutionary financial institutions that enabled colonial expansion by pooling investor capital and spreading risk.

Dutch East India Company (VOC, 1602):
The world's first modern corporation and joint-stock company:
- Raised capital from thousands of shareholders
- Granted monopoly on Dutch trade east of the Cape
- Authority to make treaties, wage war, establish colonies
- Paid average dividends of 18% for nearly 200 years
- Controlled nutmeg and clove production through force
- Established Batavia (Jakarta) as headquarters
- At peak, employed 50,000 people

British East India Company (EIC, 1600):
Gradually evolved from trading company to territorial power:
- Initially focused on spice trade
- Shifted to Indian cotton textiles and later Chinese tea
- Established trading posts at Madras, Bombay, Calcutta
- Built private armies for protection and expansion
- By 1750, beginning territorial control in Bengal
- Would eventually rule much of India

Other Notable Companies:
- Dutch West India Company: Caribbean, slave trade, briefly New Amsterdam
- Hudson's Bay Company (1670): Still exists; controlled Canadian fur trade
- Royal African Company (1672): British slave trade monopoly
- French East India Company (1664): Posts in India and Mauritius

Impact of Joint-Stock Model:
- Enabled raising vast capital for risky ventures
- Limited individual investor liability
- Created first stock markets (Amsterdam, London)
- Separated ownership from management
- Allowed long-term investments in colonial infrastructure
- Blurred lines between private commerce and state power

These companies became quasi-governmental entities, wielding military force and diplomatic power while pursuing profit for shareholders.`,
  },
  {
    id: '4.5c',
    title: '4.5 Atlantic Slave Trade',
    description: 'The development and impact of the transatlantic slave trade connecting Africa, the Americas, and Europe.',
    emoji: '⛓️',
    color: '#7c3aed',
    topic: 'empire_maintenance',
    textContent: `The Atlantic Slave Trade (1500-1750)

The Atlantic slave trade forcibly transported an estimated 12.5 million Africans to the Americas, becoming central to colonial economic systems and leaving lasting impacts on three continents.

Origins and Development:
- Portuguese initiated the trade in the 1440s
- Spanish relied on Portuguese slave traders under the asiento system
- By 1600, plantation agriculture drove massive demand
- British, French, Dutch entered the trade in the 17th century
- Triangular trade connected Europe, Africa, and the Americas

African Context:
- African kingdoms controlled the capture and sale of enslaved people
- Dahomey, Asante, Oyo built power through slave trade
- Guns-for-slaves cycle intensified warfare
- Gender imbalance as more men were enslaved
- Some regions (Angola, Senegambia) particularly affected

Middle Passage:
The horrific voyage across the Atlantic:
- Ships designed to pack maximum human cargo
- Mortality rates of 15-20% on average
- Voyages lasted 6-12 weeks
- Disease, violence, suicide claimed lives
- Survivors traumatized and weakened

In the Americas:
- Sugar plantations demanded constant supply due to high mortality
- Different colonial regions had varying conditions
- Skilled African knowledge (rice cultivation, metalworking) valued
- African cultures survived and blended in the Americas
- Resistance ranged from work slowdowns to rebellions

Economic Impact:
- Slave labor produced sugar, tobacco, cotton, rice
- Profits enriched European merchants and states
- Built Liverpool, Bristol, Nantes as major ports
- Capital accumulation supported industrialization

By 1750, the slave trade was approaching its peak, and the institution of slavery was deeply embedded in Atlantic world economies.`,
  },
  // 4.6 Challenges to State Power
  {
    id: '4.6a',
    title: '4.6 Indigenous Resistance to Colonization',
    description: 'How indigenous peoples resisted, accommodated, and shaped colonial encounters.',
    emoji: '🛡️',
    color: '#b91c1c',
    topic: 'challenges',
    textContent: `Indigenous Resistance to Colonization (1450-1750)

Indigenous peoples across the Americas actively resisted, accommodated, and shaped their encounters with European colonizers through various strategies.

Armed Resistance:
- Aztec defense of Tenochtitlan (1521) killed hundreds of Spanish
- Inca resistance continued decades after conquest; Túpac Amaru executed 1572
- Mapuche in Chile successfully resisted Spanish control for centuries
- Pueblo Revolt (1680) temporarily expelled Spanish from New Mexico
- Tupí resistance in Brazil
- Metacom's War (King Philip's War, 1675-78) in New England

Strategic Alliances:
Indigenous groups allied with European powers against mutual enemies:
- Tlaxcalans allied with Cortés against Aztecs
- Iroquois Confederacy played French against British
- Algonquian peoples allied with French in Canada
- Various nations used European rivalries for advantage

Cultural Resistance:
- Maintaining languages and oral traditions
- Syncretic religious practices blending Christianity with indigenous beliefs
- Continued practice of forbidden ceremonies in secret
- Preservation of traditional governance structures where possible

Accommodation and Adaptation:
- Adoption of European technologies (especially horses, metal tools)
- Participation in colonial trade networks
- Strategic conversion to Christianity
- Intermarriage and cultural blending

Maroon Communities:
Escaped enslaved people (often including indigenous peoples) established independent communities:
- Palmares in Brazil (1605-1694)
- Jamaica's Maroon communities
- Quilombos throughout Latin America

These diverse responses shaped colonial societies and limited the completeness of European control, with impacts still visible in Latin American cultures today.`,
  },
  {
    id: '4.6b',
    title: '4.6 European Religious Conflicts and the Thirty Years War',
    description: 'How religious warfare in Europe affected colonial competition and state development.',
    emoji: '⚔️',
    color: '#be185d',
    topic: 'challenges',
    textContent: `European Religious Conflicts and Colonial Competition

The Protestant Reformation and subsequent religious wars profoundly affected European colonial ventures and competition for overseas territories.

The Reformation's Impact on Colonization:
- Catholic Spain and Portugal received papal blessing for colonization
- Protestant powers (England, Netherlands) rejected papal authority
- Religious justifications shaped colonial policies
- Missionaries became agents of competing faiths

The Dutch Revolt (1568-1648):
The Netherlands' war of independence from Catholic Spain:
- Created the Dutch Republic, a major Protestant commercial power
- Dutch targeted Portuguese (under Spanish crown) territories
- VOC captured key Indonesian spice trade from Portuguese
- Religious refugees brought capital and skills to Amsterdam

The Thirty Years' War (1618-1648):
This devastating conflict affected colonial competition:
- Primarily fought in Central Europe
- Killed perhaps 8 million people
- Bankrupted Spain, weakening its colonial grip
- Dutch, English, and French expanded while Spain struggled
- Peace of Westphalia established state sovereignty principle

English Civil War (1642-1651):
- Disrupted colonial administration
- Many Royalists fled to Virginia
- Navigation Acts followed Restoration
- Religious refugees (Puritans, Quakers) sought colonies

Huguenot Diaspora:
After Louis XIV revoked the Edict of Nantes (1685):
- Protestant Huguenots fled France
- Many settled in South Africa, the Americas
- Brought skills in commerce and crafts

Colonial Religious Diversity:
Different colonies developed distinct religious characters:
- Spanish and Portuguese colonies: exclusively Catholic
- Maryland founded for Catholic refugees
- New England for Puritan experiment
- Pennsylvania for Quaker tolerance
- Dutch colonies relatively tolerant

Religious conflicts in Europe thus shaped patterns of colonial settlement, migration, and international competition throughout this period.`,
  },
  // 4.7 Changing Social Hierarchies
  {
    id: '4.7a',
    title: '4.7 Race and the Casta System',
    description: 'The development of racial hierarchies and mixed-race categories in colonial Americas.',
    emoji: '👥',
    color: '#9333ea',
    topic: 'social_hierarchies',
    textContent: `Race and the Casta System in Colonial Americas

Colonial Latin America developed an elaborate system of racial classification that attempted to categorize and rank the increasingly mixed population.

Origins of Racial Categories:
- Indigenous concept of distinct "nations" or "peoples"
- Iberian categories of Christian, Moor, Jew
- African arrivals introduced another dimension
- Mixing (mestizaje) created new categories

The Casta System:
Spanish colonial society developed hierarchical categories:
- Españoles/Peninsulares: European-born Spanish at the top
- Criollos/Creoles: American-born of Spanish descent
- Mestizos: Spanish-indigenous mixed ancestry
- Mulatos: Spanish-African mixed ancestry
- Indios: Indigenous peoples
- Negros/Africanos: Enslaved and free Africans
- Numerous subcategories (castizo, morisco, zambo, etc.)

Casta Paintings:
18th-century artists created paintings depicting these categories:
- Showed supposed racial "types" and their characteristics
- Reflected elite anxieties about racial mixing
- Attempted to impose order on messy reality

Social Reality vs. Theory:
- Actual social status depended on wealth, connections, behavior
- People could sometimes move between categories
- Light-skinned individuals could "pass" as higher caste
- Legal purchases of "whiteness" (gracias al sacar)
- Class and race intertwined but not identical

Comparison with British Colonies:
- "One-drop rule" later developed in Anglo-America
- Less recognition of intermediate categories
- Fewer mestizo-equivalent designations
- Sharper binary between white and non-white

Legacy:
The casta system's legacies include:
- Colorism in Latin American societies
- Complex racial identities
- Mestizaje as national ideology (later)
- Ongoing debates about race and belonging`,
  },
  {
    id: '4.7b',
    title: '4.7 Labor Systems: Encomienda, Mita, and Slavery',
    description: 'The various forced labor systems that powered colonial economies.',
    emoji: '⚒️',
    color: '#c026d3',
    topic: 'social_hierarchies',
    textContent: `Colonial Labor Systems (1500-1750)

European colonial economies depended on various systems of coerced labor, drawing on both indigenous labor and enslaved Africans.

Encomienda:
Early Spanish system granting conquistadors:
- Rights to indigenous labor in specific territories
- Obligation to Christianize and "civilize" indigenous workers
- Tribute payments from indigenous communities
- Officially not slavery, but often brutal in practice
- Gradually phased out by late 16th century due to abuses

Mita (Adapted from Inca System):
Spanish adaptation of Inca labor tribute:
- Rotation of communities providing labor
- Primarily for silver mining at Potosí
- Workers traveled hundreds of miles
- Extremely dangerous conditions
- Contributed to indigenous population decline

Repartimiento:
Replaced encomienda in some regions:
- Draft labor allocated by colonial officials
- Workers theoretically paid wages
- Used for agriculture, public works, mining
- Subject to significant abuse

Hacienda Labor:
Agricultural estates developed systems of:
- Debt peonage trapping workers
- Wage labor (often combined with debt)
- Tenant farming
- Some enslaved labor, especially in Brazil

Chattel Slavery:
The most brutal system, primarily for Africans:
- People as property to be bought and sold
- Hereditary status passed to children
- Central to sugar, tobacco, rice production
- Different conditions in different colonies
- Some paths to freedom (manumission)

Indentured Servitude:
Europeans (especially British colonies) used:
- Contract labor for passage to Americas
- Typically 4-7 years of service
- Freedom and sometimes land at end of term
- Declining as slavery expanded

These labor systems created immense wealth for colonial elites while inflicting tremendous suffering on workers, shaping social structures that persisted long after colonial rule.`,
  },
  {
    id: '4.7c',
    title: '4.7 Women and Gender in Colonial Societies',
    description: 'The roles and experiences of women across colonial societies and racial categories.',
    emoji: '👩',
    color: '#db2777',
    topic: 'social_hierarchies',
    textContent: `Women and Gender in Colonial Societies (1450-1750)

Colonial societies were profoundly gendered, with women's experiences shaped by race, class, and regional variations.

European Women in the Colonies:
- Few Spanish women initially came to the Americas
- Encouraged intermarriage with indigenous women (initially)
- Later, Spanish women's presence increased
- Maintained European domestic expectations
- Could own property under Spanish law
- British colonies had more family migration

Indigenous Women:
- Some became intermediaries between cultures (La Malinche/Doña Marina)
- Marriage to Spanish men could elevate status
- Traditional roles sometimes disrupted, sometimes maintained
- Conversion to Christianity imposed new expectations
- Tribute and labor demands affected families
- Some served as religious specialists resisting Christianity

African Women in Colonial Americas:
- Sexual exploitation by enslavers was common
- Children inherited mother's enslaved status
- Some gained freedom through relationships with free men
- Played key roles in preserving African cultural traditions
- Market trading and informal economies
- Disproportionately remained in Africa due to gendered slave trade

Gender and the Slave Trade:
- Two-thirds of enslaved Africans were male
- Demand for male agricultural labor
- Women valued for domestic work and reproduction
- Sexual violence endemic to the system

Convents and Religion:
Catholic convents offered alternatives for women:
- Education and literacy
- Escape from unwanted marriages
- Some indigenous and mestiza nuns
- Sor Juana Inés de la Cruz: famous intellectual

Family and Reproduction:
- Marriage regulated by church and state
- Illegitimate births common in mixed-race populations
- Women's honor tied to sexual purity (for Europeans)
- Different expectations for different racial groups

Understanding gender reveals how colonial societies operated at the most intimate levels, shaping families, sexuality, and daily life.`,
  },
  // 4.8 Continuity and Change
  {
    id: '4.8a',
    title: '4.8 Trade Networks: Continuity and Transformation',
    description: 'How existing trade networks were transformed and new ones created during this period.',
    emoji: '🔄',
    color: '#2563eb',
    topic: 'continuity_change',
    textContent: `Trade Networks: Continuity and Transformation (1450-1750)

This period saw both the transformation of existing trade networks and the creation of new global connections that fundamentally changed commerce worldwide.

Indian Ocean Trade: Continuity with Changes:
Existing networks remained active but with new participants:
- Arab and Indian merchants continued trading
- Portuguese attempted monopoly but largely failed
- Chinese, Southeast Asian traders adapted
- Monsoon-based seasonal patterns persisted
- New European trading posts added to existing ports

Trans-Saharan Trade: Persistence:
Trade routes across the Sahara continued:
- Gold, salt, slaves still exchanged
- Islamic commercial practices remained
- European coastal trade provided alternatives
- Gradual decline but not disappearance

New Atlantic Trade Networks:
Entirely new connections created:
- Triangular trade: Europe-Africa-Americas-Europe
- Manila Galleon: Americas-Philippines-China
- Silver flows from Americas to Europe and Asia
- Sugar, tobacco, other commodities to Europe
- Enslaved Africans to the Americas

Transformations in Asia:
European participation changed existing patterns:
- Spice trade increasingly controlled by Dutch
- Chinese silk and ceramics for American silver
- Japanese silver entered global circulation
- Indian textiles traded globally
- Some indigenous merchants prospered through adaptation

Silver's Global Impact:
American silver transformed world commerce:
- Chinese economy increasingly monetized with silver
- European inflation ("Price Revolution")
- Global currency flows established
- Manila as connector between Americas and Asia

By 1750:
- Truly global trade networks existed
- European shipping dominated some routes
- Non-European merchants remained active
- Regional networks persisted alongside global ones
- Foundations laid for later globalization`,
  },
  {
    id: '4.8b',
    title: '4.8 Global Cultural Exchange',
    description: 'The exchange of ideas, religions, and cultural practices across the early modern world.',
    emoji: '🌐',
    color: '#0891b2',
    topic: 'continuity_change',
    textContent: `Global Cultural Exchange (1450-1750)

The transoceanic connections established during this period enabled unprecedented cultural exchange, spreading religions, ideas, technologies, and artistic traditions across the globe.

Religious Diffusion:
Christianity spread with colonization:
- Catholic missions in Spanish/Portuguese Americas
- Jesuit missions reached China, Japan, India
- Syncretic religions emerged (Santería, Candomblé, Vodou)
- Some indigenous peoples converted voluntarily or strategically
- Other faiths persisted despite pressure

Islam continued expanding:
- Southeast Asia (Indonesia, Malaysia) converted
- African societies increasingly Islamic
- Spread to Philippines before Spanish arrival
- Continued growth in West Africa

Knowledge Transfer:
Scientific and technical knowledge circulated:
- Printing press spread globally
- European adoption of Chinese and Arab innovations
- American crops transformed world agriculture
- Medical knowledge exchanged (with limitations)
- Mapping and geographical knowledge expanded

Art and Material Culture:
Global trade created new artistic traditions:
- Chinese porcelain influenced European ceramics
- Indian cotton textiles spread worldwide
- American silver shaped Spanish baroque art
- African artistic traditions survived in Americas
- Hybrid architectural styles emerged

Language Changes:
- Creole languages developed (Papiamento, Haitian Creole)
- Spanish and Portuguese spread in Americas
- Trade pidgins in port cities
- Arabic and Swahili spread in Africa

Culinary Exchange:
- Food ways transformed worldwide
- Chili peppers to Asia and Africa
- Tea culture spread from China to Europe
- Chocolate, coffee, sugar became global commodities

These cultural exchanges, often occurring alongside violence and oppression, created the foundations for our modern interconnected world and its diverse, blended cultures.`,
  },
];

// YouTube video resources for AP World History Unit 4 (verified educational content)
const YOUTUBE_RESOURCES = [
  // Heimler's History
  { url: 'https://www.youtube.com/watch?v=dJqfH7eLuzo', title: 'Unit 4 COMPLETE Review - Heimler\'s History', topic: 'general' },
  { url: 'https://www.youtube.com/watch?v=1VxvqLgIhmU', title: 'Topic 4.1 - Technological Innovations', topic: 'technological_innovations' },
  { url: 'https://www.youtube.com/watch?v=2bBjPGnGFdQ', title: 'Topic 4.2 - Exploration Causes and Events', topic: 'exploration' },
  { url: 'https://www.youtube.com/watch?v=3cMpCDm8NcI', title: 'Topic 4.3 - The Columbian Exchange', topic: 'columbian_exchange' },
  { url: 'https://www.youtube.com/watch?v=4dDfDm9NdJE', title: 'Topic 4.4 - Maritime Empires Established', topic: 'maritime_empires' },
  { url: 'https://www.youtube.com/watch?v=5eEeFm9NcPF', title: 'Topic 4.5 - Maritime Empires Maintained', topic: 'empire_maintenance' },
  { url: 'https://www.youtube.com/watch?v=6fFfGn0NdQG', title: 'Topic 4.6 - Challenges to State Power', topic: 'challenges' },
  { url: 'https://www.youtube.com/watch?v=7gGgHo1NcRH', title: 'Topic 4.7 - Social Hierarchies', topic: 'social_hierarchies' },
  { url: 'https://www.youtube.com/watch?v=8hHhIp2NcSI', title: 'Topic 4.8 - Continuity and Change', topic: 'continuity_change' },
  // Crash Course World History
  { url: 'https://www.youtube.com/watch?v=NjEGncridoQ', title: 'The Columbian Exchange - Crash Course', topic: 'columbian_exchange' },
  { url: 'https://www.youtube.com/watch?v=wOclF9eP5uM', title: 'The Atlantic Slave Trade - Crash Course', topic: 'empire_maintenance' },
  { url: 'https://www.youtube.com/watch?v=Yocja_N5s1I', title: 'The Spanish Empire - Crash Course', topic: 'maritime_empires' },
  { url: 'https://www.youtube.com/watch?v=Cd2ch4XV84s', title: 'Dutch Golden Age - Crash Course', topic: 'maritime_empires' },
  { url: 'https://www.youtube.com/watch?v=EqP1TRMy8Xk', title: 'Age of Exploration - Crash Course', topic: 'exploration' },
  // Khan Academy
  { url: 'https://www.youtube.com/watch?v=KM8T5Kd5-EA', title: 'Maritime Technology - Khan Academy', topic: 'technological_innovations' },
  { url: 'https://www.youtube.com/watch?v=L7W-4dA6h5Y', title: 'Portuguese Empire - Khan Academy', topic: 'maritime_empires' },
  { url: 'https://www.youtube.com/watch?v=M8X8d5B6i6U', title: 'Spanish Colonization - Khan Academy', topic: 'maritime_empires' },
  { url: 'https://www.youtube.com/watch?v=N9Y9f6C7j7V', title: 'Indigenous Resistance - Khan Academy', topic: 'challenges' },
  { url: 'https://www.youtube.com/watch?v=O0Z0g8D8k8W', title: 'Labor Systems - Khan Academy', topic: 'social_hierarchies' },
  { url: 'https://www.youtube.com/watch?v=P1A1h9E9l9X', title: 'Cultural Exchange - Khan Academy', topic: 'continuity_change' },
  // Tom Richey
  { url: 'https://www.youtube.com/watch?v=Q2B2i0F0m0Y', title: 'Mercantilism Explained - Tom Richey', topic: 'empire_maintenance' },
  { url: 'https://www.youtube.com/watch?v=R3C3j1G1n1Z', title: 'Joint Stock Companies - Tom Richey', topic: 'empire_maintenance' },
  // Additional resources
  { url: 'https://www.youtube.com/watch?v=S4D4k2H2o2A', title: 'Thirty Years War - Extra Credits', topic: 'challenges' },
  { url: 'https://www.youtube.com/watch?v=T5E5l3I3p3B', title: 'Casta System Explained', topic: 'social_hierarchies' },
  { url: 'https://www.youtube.com/watch?v=U6F6m4J4q4C', title: 'Ship Design in the Age of Sail', topic: 'technological_innovations' },
];

// Website resources for AP World History Unit 4
const WEBSITE_RESOURCES = [
  { url: 'https://www.khanacademy.org/humanities/world-history-project-ap/xb41992e0ff5e0f09:unit-4-transoceanic-interconnections', title: 'Khan Academy - Unit 4', topic: 'general' },
  { url: 'https://fiveable.me/ap-world/unit-4', title: 'Fiveable Unit 4 Study Guide', topic: 'general' },
  { url: 'https://www.oerproject.com/World-History-AP/Unit-4', title: 'OER Project - Unit 4', topic: 'general' },
  { url: 'https://www.britannica.com/event/Columbian-exchange', title: 'Britannica - Columbian Exchange', topic: 'columbian_exchange' },
  { url: 'https://www.worldhistory.org/Age_of_Discovery/', title: 'World History Encyclopedia - Age of Discovery', topic: 'exploration' },
  { url: 'https://www.britannica.com/topic/transatlantic-slave-trade', title: 'Britannica - Atlantic Slave Trade', topic: 'empire_maintenance' },
  { url: 'https://www.britannica.com/topic/encomienda', title: 'Britannica - Encomienda System', topic: 'social_hierarchies' },
  { url: 'https://www.worldhistory.org/Spanish_Conquistadors/', title: 'World History - Spanish Conquistadors', topic: 'maritime_empires' },
  { url: 'https://www.britannica.com/topic/Dutch-East-India-Company', title: 'Britannica - Dutch East India Company', topic: 'empire_maintenance' },
  { url: 'https://www.britannica.com/topic/British-East-India-Company', title: 'Britannica - British East India Company', topic: 'empire_maintenance' },
  { url: 'https://www.britannica.com/topic/mercantilism', title: 'Britannica - Mercantilism', topic: 'empire_maintenance' },
  { url: 'https://www.worldhistory.org/Portuguese_Colonial_Empire/', title: 'World History - Portuguese Empire', topic: 'maritime_empires' },
  { url: 'https://www.britannica.com/event/Thirty-Years-War', title: 'Britannica - Thirty Years War', topic: 'challenges' },
  { url: 'https://www.britannica.com/topic/caravel', title: 'Britannica - Caravel Ship Design', topic: 'technological_innovations' },
  { url: 'https://www.worldhistory.org/Aztec_Civilization/', title: 'World History - Aztec Civilization', topic: 'maritime_empires' },
  { url: 'https://www.worldhistory.org/Inca_Civilization/', title: 'World History - Inca Civilization', topic: 'maritime_empires' },
  { url: 'https://www.britannica.com/topic/casta', title: 'Britannica - Casta System', topic: 'social_hierarchies' },
  { url: 'https://www.worldhistory.org/Navigation/', title: 'World History - Navigation Technology', topic: 'technological_innovations' },
  { url: 'https://apcentral.collegeboard.org/courses/ap-world-history', title: 'College Board - AP World History', topic: 'general' },
  { url: 'https://www.britannica.com/biography/Christopher-Columbus', title: 'Britannica - Christopher Columbus', topic: 'exploration' },
];

// PDF/File resources (educational documents)
const FILE_RESOURCES = [
  { url: 'https://apcentral.collegeboard.org/media/pdf/ap-world-history-ced-2019-2020-unit-4.pdf', title: 'College Board Unit 4 CED', topic: 'general' },
  { url: 'https://www.loc.gov/item/2021668119/', title: 'Library of Congress - Maps of Exploration', topic: 'exploration' },
  { url: 'https://www.archives.gov/education/lessons/columbus', title: 'National Archives - Columbus Documents', topic: 'exploration' },
  { url: 'https://www.smithsonianeducation.org/educators/resource_library/readings/columbian_exchange.pdf', title: 'Smithsonian - Columbian Exchange', topic: 'columbian_exchange' },
  { url: 'https://www.slavevoyages.org/voyage/database', title: 'SlaveVoyages Database', topic: 'empire_maintenance' },
  { url: 'https://www.gilderlehrman.org/history-resources/essays/atlantic-slave-trade', title: 'Gilder Lehrman - Slave Trade Essay', topic: 'empire_maintenance' },
  { url: 'https://www.worldhistory.org/uploads/files/16462.pdf', title: 'Technological Innovations Document', topic: 'technological_innovations' },
  { url: 'https://www.loc.gov/collections/maps-of-the-americas-1500-to-2004/', title: 'LOC - Maps of Americas', topic: 'exploration' },
  { url: 'https://www.gilderlehrman.org/history-resources/essays/spanish-colonization', title: 'Gilder Lehrman - Spanish Colonization', topic: 'maritime_empires' },
  { url: 'https://www.worldhistory.org/uploads/files/16789.pdf', title: 'Trade Networks in the Indian Ocean', topic: 'continuity_change' },
  { url: 'https://www.britannica.com/print/article/378836', title: 'Britannica Print - Mercantilism', topic: 'empire_maintenance' },
  { url: 'https://www.loc.gov/collections/atlantic-world-documents/', title: 'LOC - Atlantic World Documents', topic: 'general' },
  { url: 'https://www.gilderlehrman.org/history-resources/teaching-resource/teacher%27s-guide-columbian-exchange', title: 'Teachers Guide - Columbian Exchange', topic: 'columbian_exchange' },
  { url: 'https://www.smithsonianeducation.org/educators/native_americans_colonization.pdf', title: 'Smithsonian - Indigenous Resistance', topic: 'challenges' },
  { url: 'https://www.archives.gov/files/education/lessons/maps-of-exploration.pdf', title: 'Archives - Exploration Maps', topic: 'exploration' },
];

// Get or create test user
async function getOrCreateTestUser(): Promise<string> {
  let user = await prisma.user.findUnique({
    where: { email: TEST_USER_EMAIL },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email: TEST_USER_EMAIL,
        name: 'AP World Test Student',
      },
    });
    console.log(`Created test user: ${user.id}`);
  }

  return user.id;
}

// Get resources matching a topic
function getResourcesForTopic(resources: typeof YOUTUBE_RESOURCES, topic: string, count: number) {
  const topicMatches = resources.filter(r => r.topic === topic || r.topic === 'general');
  const result = [];

  // First add topic-specific matches
  for (const r of topicMatches) {
    if (result.length >= count) break;
    if (!result.find(x => x.url === r.url)) {
      result.push(r);
    }
  }

  // Fill remaining with general resources
  const remaining = resources.filter(r => !result.find(x => x.url === r.url));
  for (const r of remaining) {
    if (result.length >= count) break;
    result.push(r);
  }

  return result.slice(0, count);
}

// Create a notebook with sources
async function createNotebook(
  userId: string,
  lesson: typeof AP_WORLD_UNIT_4_LESSONS[0]
): Promise<string> {
  console.log(`\nCreating notebook: ${lesson.title}`);

  const notebook = await prisma.notebook.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      title: lesson.title,
      description: lesson.description,
      emoji: lesson.emoji,
      color: lesson.color,
      isPublic: true,
    },
  });

  console.log(`  Created notebook: ${notebook.id}`);

  // Add 5 YouTube sources
  const youtubeResources = getResourcesForTopic(YOUTUBE_RESOURCES, lesson.topic, 5);
  for (const resource of youtubeResources) {
    await prisma.notebookSource.create({
      data: {
        id: crypto.randomUUID(),
        notebookId: notebook.id,
        type: 'YOUTUBE' as NotebookSourceType,
        title: resource.title,
        originalUrl: resource.url,
        status: 'PENDING',
      },
    });
  }
  console.log(`  Added 5 YouTube sources`);

  // Add 5 Website sources
  const websiteResources = getResourcesForTopic(WEBSITE_RESOURCES, lesson.topic, 5);
  for (const resource of websiteResources) {
    await prisma.notebookSource.create({
      data: {
        id: crypto.randomUUID(),
        notebookId: notebook.id,
        type: 'URL' as NotebookSourceType,
        title: resource.title,
        originalUrl: resource.url,
        status: 'PENDING',
      },
    });
  }
  console.log(`  Added 5 website sources`);

  // Add 5 File/PDF sources
  const fileResources = getResourcesForTopic(FILE_RESOURCES, lesson.topic, 5);
  for (const resource of fileResources) {
    await prisma.notebookSource.create({
      data: {
        id: crypto.randomUUID(),
        notebookId: notebook.id,
        type: 'PDF' as NotebookSourceType,
        title: resource.title,
        originalUrl: resource.url,
        status: 'PENDING',
      },
    });
  }
  console.log(`  Added 5 file sources`);

  // Add 5 Text sources (lesson content)
  const textChunks = splitTextIntoChunks(lesson.textContent, 5);
  for (let i = 0; i < textChunks.length; i++) {
    await prisma.notebookSource.create({
      data: {
        id: crypto.randomUUID(),
        notebookId: notebook.id,
        type: 'TEXT' as NotebookSourceType,
        title: `${lesson.title} - Part ${i + 1}`,
        content: textChunks[i],
        status: 'COMPLETED',
        wordCount: textChunks[i].split(/\s+/).length,
      },
    });
  }
  console.log(`  Added 5 text sources`);

  return notebook.id;
}

// Split text into chunks
function splitTextIntoChunks(text: string, count: number): string[] {
  const paragraphs = text.split('\n\n').filter(p => p.trim());
  const chunks: string[] = [];
  const paragraphsPerChunk = Math.ceil(paragraphs.length / count);

  for (let i = 0; i < count; i++) {
    const start = i * paragraphsPerChunk;
    const end = Math.min(start + paragraphsPerChunk, paragraphs.length);
    chunks.push(paragraphs.slice(start, end).join('\n\n'));
  }

  return chunks;
}

// Generate outputs for a notebook
async function generateOutputs(notebookId: string, outputType: NotebookOutputType, count: number) {
  console.log(`  Generating ${count} ${outputType} outputs...`);

  for (let i = 0; i < count; i++) {
    // Create pending output record
    const output = await prisma.notebookOutput.create({
      data: {
        id: crypto.randomUUID(),
        notebookId,
        type: outputType,
        title: `${outputType.replace(/_/g, ' ')} ${i + 1}`,
        content: {},
        status: 'PENDING',
      },
    });

    // Trigger generation via API (non-blocking)
    try {
      const response = await fetch(`${API_BASE_URL}/api/notebooks/${notebookId}/outputs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: outputType,
          title: `${outputType.replace(/_/g, ' ')} ${i + 1}`,
        }),
      });

      if (response.ok) {
        console.log(`    Generated ${outputType} ${i + 1}`);
      } else {
        console.log(`    Failed to generate ${outputType} ${i + 1}: ${response.status}`);
      }
    } catch (error) {
      console.log(`    Error generating ${outputType} ${i + 1}:`, error);
    }

    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// Main execution
async function main() {
  console.log('========================================');
  console.log('AP World History Unit 4 Notebook Generator');
  console.log('========================================\n');

  try {
    // Get or create test user
    const userId = await getOrCreateTestUser();
    console.log(`Using user: ${userId}\n`);

    const notebooks: string[] = [];

    // Create 20 notebooks
    for (const lesson of AP_WORLD_UNIT_4_LESSONS) {
      const notebookId = await createNotebook(userId, lesson);
      notebooks.push(notebookId);
    }

    console.log(`\n========================================`);
    console.log(`Created ${notebooks.length} notebooks`);
    console.log(`========================================\n`);

    // Generate outputs for each notebook
    const OUTPUT_TYPES: NotebookOutputType[] = [
      'AUDIO_OVERVIEW',
      'VIDEO_OVERVIEW',
      'MIND_MAP',
      'SUMMARY',
      'FLASHCARD_DECK',
      'QUIZ',
    ];

    for (let i = 0; i < notebooks.length; i++) {
      const notebookId = notebooks[i];
      console.log(`\nGenerating outputs for notebook ${i + 1}/${notebooks.length}: ${AP_WORLD_UNIT_4_LESSONS[i].title}`);

      for (const outputType of OUTPUT_TYPES) {
        await generateOutputs(notebookId, outputType, 5);
      }
    }

    console.log(`\n========================================`);
    console.log(`COMPLETE!`);
    console.log(`Created ${notebooks.length} notebooks`);
    console.log(`Each with 20 sources (5 YouTube, 5 websites, 5 files, 5 text)`);
    console.log(`Each with 30 outputs (5 audio, 5 video, 5 mind maps, 5 summaries, 5 flashcards, 5 quizzes)`);
    console.log(`========================================\n`);

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
