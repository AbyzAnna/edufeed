import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedNotebooks() {
  const userEmail = "abyzovann@icloud.com";

  // Find the user
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    console.log(`User with email ${userEmail} not found. Creating user...`);

    // Create the user first
    const newUser = await prisma.user.create({
      data: {
        id: `user_${Date.now()}`,
        email: userEmail,
        name: "Anna",
        emailVerified: new Date(),
      },
    });
    console.log(`Created user: ${newUser.id}`);
    await createNotebooksForUser(newUser.id);
  } else {
    console.log(`Found user: ${user.id} (${user.name})`);
    await createNotebooksForUser(user.id);
  }

  console.log("Done seeding notebooks!");
}

async function createNotebooksForUser(userId: string) {
  const notebooks = [
    {
      title: "AP World History - Unit 1",
      description:
        "Ancient Civilizations and Classical Empires (c. 8000 BCE - 600 CE)",
      emoji: "🌍",
      color: "#3b82f6",
      isPublic: true,
      sources: [
        {
          type: "TEXT",
          title: "Ancient Mesopotamia Notes",
          content: `# Ancient Mesopotamia

## The Fertile Crescent
The Fertile Crescent, located between the Tigris and Euphrates rivers, was home to some of the earliest human civilizations. This region, often called the "Cradle of Civilization," saw the development of agriculture around 10,000 BCE.

## Key Civilizations
1. **Sumerians (c. 4500-1900 BCE)** - Developed cuneiform writing, the wheel, and early mathematics
2. **Akkadians (c. 2334-2154 BCE)** - Created the first empire under Sargon
3. **Babylonians (c. 1894-1595 BCE)** - Known for Hammurabi's Code

## Hammurabi's Code
- First known written legal code
- "Eye for an eye" principle
- Distinguished between social classes
- Over 280 laws covering commerce, family, and property

## Key Achievements
- Writing system (cuneiform)
- Bronze working
- Ziggurats (temple towers)
- 60-based number system (still used for time)`,
          wordCount: 150,
        },
        {
          type: "TEXT",
          title: "Ancient Egypt Study Guide",
          content: `# Ancient Egypt Overview

## Geography
Egypt developed along the Nile River, which provided:
- Annual flooding that deposited fertile soil
- Transportation route
- Natural barriers (deserts) for protection

## Periods of Egyptian History
1. **Old Kingdom (2686-2181 BCE)** - Age of Pyramids
2. **Middle Kingdom (2055-1650 BCE)** - Golden Age of arts
3. **New Kingdom (1550-1070 BCE)** - Age of Empire

## Key Concepts
- Pharaoh - Divine ruler, "God on Earth"
- Ma'at - Concept of truth, balance, and cosmic order
- Afterlife beliefs - Mummification, Book of the Dead
- Hieroglyphics - Sacred writing system

## Major Achievements
- Pyramids at Giza
- Advances in medicine and mathematics
- Papyrus paper
- Complex religious beliefs`,
          wordCount: 140,
        },
      ],
    },
    {
      title: "Biology 101 - Cell Structure",
      description: "Introduction to cell biology and organelles",
      emoji: "🧬",
      color: "#10b981",
      isPublic: true,
      sources: [
        {
          type: "TEXT",
          title: "Cell Biology Notes",
          content: `# Cell Structure and Function

## The Cell Theory
1. All living things are made of cells
2. Cells are the basic units of structure and function
3. All cells come from pre-existing cells

## Types of Cells
### Prokaryotic Cells
- No membrane-bound nucleus
- Example: Bacteria, Archaea
- Smaller (1-10 μm)

### Eukaryotic Cells
- Membrane-bound nucleus
- Contains organelles
- Larger (10-100 μm)

## Key Organelles
| Organelle | Function |
|-----------|----------|
| Nucleus | Contains DNA, controls cell |
| Mitochondria | Produces ATP (energy) |
| Endoplasmic Reticulum | Protein synthesis |
| Golgi Apparatus | Processes and packages proteins |
| Ribosomes | Protein synthesis |
| Lysosomes | Digestion and waste removal |

## Cell Membrane
- Phospholipid bilayer
- Selective permeability
- Contains proteins for transport`,
          wordCount: 130,
        },
      ],
    },
    {
      title: "Python Programming Basics",
      description: "Learn Python from scratch - variables, loops, and functions",
      emoji: "🐍",
      color: "#f59e0b",
      isPublic: true,
      sources: [
        {
          type: "TEXT",
          title: "Python Fundamentals",
          content: `# Python Programming Basics

## Variables and Data Types
\`\`\`python
# Numbers
age = 25
pi = 3.14159

# Strings
name = "Alice"

# Booleans
is_student = True

# Lists
fruits = ["apple", "banana", "cherry"]
\`\`\`

## Control Flow
### If Statements
\`\`\`python
if age >= 18:
    print("Adult")
elif age >= 13:
    print("Teenager")
else:
    print("Child")
\`\`\`

### Loops
\`\`\`python
# For loop
for fruit in fruits:
    print(fruit)

# While loop
count = 0
while count < 5:
    print(count)
    count += 1
\`\`\`

## Functions
\`\`\`python
def greet(name):
    return f"Hello, {name}!"

message = greet("World")
print(message)  # Output: Hello, World!
\`\`\`

## Best Practices
- Use meaningful variable names
- Add comments to explain complex logic
- Follow PEP 8 style guidelines
- Write functions for reusable code`,
          wordCount: 120,
        },
      ],
    },
    {
      title: "SAT Math Prep",
      description: "Essential formulas and practice problems for SAT Math",
      emoji: "📊",
      color: "#8b5cf6",
      isPublic: true,
      sources: [
        {
          type: "TEXT",
          title: "SAT Math Formulas",
          content: `# SAT Math Essential Formulas

## Algebra
- Slope: m = (y₂ - y₁) / (x₂ - x₁)
- Slope-intercept: y = mx + b
- Point-slope: y - y₁ = m(x - x₁)
- Quadratic formula: x = (-b ± √(b² - 4ac)) / 2a

## Geometry
### Area Formulas
- Rectangle: A = l × w
- Triangle: A = ½bh
- Circle: A = πr²
- Trapezoid: A = ½(b₁ + b₂)h

### Volume Formulas
- Rectangular prism: V = lwh
- Cylinder: V = πr²h
- Sphere: V = (4/3)πr³
- Cone: V = (1/3)πr²h

## Special Right Triangles
- 45-45-90: sides ratio = 1:1:√2
- 30-60-90: sides ratio = 1:√3:2

## Statistics
- Mean: sum of values / number of values
- Median: middle value when sorted
- Mode: most frequent value
- Range: max - min

## Tips
1. Always show your work
2. Plug in answer choices when stuck
3. Draw diagrams for geometry problems
4. Check units in word problems`,
          wordCount: 160,
        },
      ],
    },
    {
      title: "Spanish Vocabulary - Travel",
      description: "Essential Spanish phrases for traveling",
      emoji: "✈️",
      color: "#ef4444",
      isPublic: true,
      sources: [
        {
          type: "TEXT",
          title: "Travel Spanish",
          content: `# Spanish Travel Vocabulary

## Greetings
- Hola - Hello
- Buenos días - Good morning
- Buenas tardes - Good afternoon
- Buenas noches - Good evening
- Adiós - Goodbye
- Hasta luego - See you later

## At the Hotel
- ¿Tiene habitaciones disponibles? - Do you have rooms available?
- Una habitación individual - A single room
- Una habitación doble - A double room
- ¿Cuánto cuesta por noche? - How much per night?
- La llave - The key
- El ascensor - The elevator

## At the Restaurant
- La cuenta, por favor - The check, please
- ¿Qué me recomienda? - What do you recommend?
- Quisiera... - I would like...
- Delicioso - Delicious
- La propina - The tip

## Transportation
- ¿Dónde está...? - Where is...?
- El aeropuerto - The airport
- La estación de tren - The train station
- El autobús - The bus
- Un taxi - A taxi
- ¿Cuánto tiempo tarda? - How long does it take?

## Emergency Phrases
- ¡Ayuda! - Help!
- Necesito un médico - I need a doctor
- La policía - The police
- No entiendo - I don't understand
- ¿Habla inglés? - Do you speak English?`,
          wordCount: 180,
        },
      ],
    },
  ];

  for (const notebookData of notebooks) {
    console.log(`Creating notebook: ${notebookData.title}`);

    // Check if notebook already exists
    const existing = await prisma.notebook.findFirst({
      where: {
        userId: userId,
        title: notebookData.title,
      },
    });

    if (existing) {
      console.log(`  Notebook already exists, skipping...`);
      continue;
    }

    const notebook = await prisma.notebook.create({
      data: {
        id: `notebook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: userId,
        title: notebookData.title,
        description: notebookData.description,
        emoji: notebookData.emoji,
        color: notebookData.color,
        isPublic: notebookData.isPublic,
      },
    });

    // Create sources
    for (const sourceData of notebookData.sources) {
      await prisma.notebookSource.create({
        data: {
          id: `source_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          notebookId: notebook.id,
          type: sourceData.type,
          title: sourceData.title,
          content: sourceData.content,
          wordCount: sourceData.wordCount,
          status: "COMPLETED",
        },
      });
    }

    console.log(`  Created notebook with ${notebookData.sources.length} sources`);

    // Add small delay to ensure unique timestamps
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

seedNotebooks()
  .catch((error) => {
    console.error("Error seeding notebooks:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
