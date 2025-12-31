/**
 * Create test user Anton for testing purposes
 * Run with: npx tsx scripts/create-test-user.ts
 */

import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const prisma = new PrismaClient();

async function createTestUserAnton() {
  const email = 'anton@test.edufeed.com';
  const password = 'TestPassword123!';
  const name = 'Anton';

  console.log('Creating test user Anton...');

  try {
    // Check if user already exists in Supabase
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find(u => u.email === email);

    let supabaseUserId: string;

    if (existingUser) {
      console.log('User already exists in Supabase, using existing user');
      supabaseUserId = existingUser.id;
    } else {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name,
          full_name: name,
        },
      });

      if (authError) {
        throw new Error(`Failed to create Supabase user: ${authError.message}`);
      }

      console.log('Created Supabase auth user:', authData.user.id);
      supabaseUserId = authData.user.id;
    }

    // Check if user exists in Prisma
    let prismaUser = await prisma.user.findFirst({
      where: { email },
    });

    if (!prismaUser) {
      // Create user in Prisma database
      prismaUser = await prisma.user.create({
        data: {
          id: supabaseUserId,
          email,
          name,
          image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
        },
      });
      console.log('Created Prisma user:', prismaUser.id);
    } else {
      console.log('User already exists in Prisma database');
    }

    // Create a sample notebook for the test user
    const notebook = await prisma.notebook.upsert({
      where: { id: 'test-notebook-1' },
      update: {},
      create: {
        id: 'test-notebook-1',
        title: 'Test Notebook - Machine Learning',
        description: 'A test notebook for ML studies',
        emoji: '🤖',
        color: '#8b5cf6',
        userId: prismaUser.id,
        isPublic: false,
      },
    });
    console.log('Created/Updated test notebook:', notebook.id);

    // Add a sample text source
    const source = await prisma.notebookSource.upsert({
      where: { id: 'test-source-1' },
      update: {},
      create: {
        id: 'test-source-1',
        notebookId: notebook.id,
        type: 'TEXT',
        title: 'Introduction to Machine Learning',
        content: `Machine Learning (ML) is a subset of artificial intelligence (AI) that enables computers to learn from data without being explicitly programmed.

Types of Machine Learning:
1. Supervised Learning: The model learns from labeled data
2. Unsupervised Learning: The model finds patterns in unlabeled data
3. Reinforcement Learning: The model learns through trial and error

Key Concepts:
- Training Data: The data used to train the model
- Features: The input variables used for prediction
- Labels: The output variable we're trying to predict
- Model: The mathematical representation learned from data
- Overfitting: When a model performs well on training data but poorly on new data

Popular ML Algorithms:
- Linear Regression
- Decision Trees
- Random Forests
- Neural Networks
- Support Vector Machines`,
        status: 'COMPLETED',
        wordCount: 100,
      },
    });
    console.log('Created/Updated test source:', source.id);

    console.log('\n✅ Test user Anton created successfully!');
    console.log('-------------------------------------------');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('User ID:', prismaUser.id);
    console.log('Notebook ID:', notebook.id);
    console.log('Source ID:', source.id);
    console.log('-------------------------------------------');

  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestUserAnton();
