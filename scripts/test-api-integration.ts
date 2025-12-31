/**
 * Integration test script to verify the API endpoints work correctly
 * Run with: npx tsx scripts/test-api-integration.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xsajblfxxeztfzpzoevi.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const workersUrl = process.env.WORKERS_URL || 'https://edufeed-ai-worker.steep-mouse-b843.workers.dev';
const baseUrl = 'http://localhost:3000';

if (!supabaseAnonKey) {
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testWorkersHealth() {
  console.log('\n🔍 Testing Cloudflare Workers Health...');

  const response = await fetch(`${workersUrl}/health`);
  const data = await response.json();

  if (data.status === 'ok') {
    console.log('✅ Workers AI is healthy');
    return true;
  } else {
    console.log('❌ Workers AI is not healthy');
    return false;
  }
}

async function testWorkersAI() {
  console.log('\n🔍 Testing Cloudflare Workers AI...');

  const response = await fetch(`${workersUrl}/api/test-ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'Say hello in JSON format' }),
  });

  const data = await response.json();

  if (data.success) {
    console.log('✅ Workers AI is working:', JSON.stringify(data.response).slice(0, 100));
    return true;
  } else {
    console.log('❌ Workers AI failed:', data.error);
    return false;
  }
}

async function testSupabaseAuth() {
  console.log('\n🔍 Testing Supabase Auth...');

  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'anton@test.edufeed.com',
    password: 'TestPassword123!',
  });

  if (error) {
    console.log('❌ Auth failed:', error.message);
    return null;
  }

  console.log('✅ Supabase Auth working, user:', data.user?.email);
  return data.session?.access_token;
}

async function testNotebookAPI(token: string) {
  console.log('\n🔍 Testing Notebook API...');

  try {
    // Test listing notebooks
    const listResponse = await fetch(`${baseUrl}/api/notebooks`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (listResponse.ok) {
      const notebooks = await listResponse.json();
      console.log('✅ Notebook list:', notebooks.length, 'notebooks');

      if (notebooks.length > 0) {
        const notebookId = notebooks[0].id;

        // Test getting notebook details
        const detailResponse = await fetch(`${baseUrl}/api/notebooks/${notebookId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (detailResponse.ok) {
          const notebook = await detailResponse.json();
          console.log('✅ Notebook detail:', notebook.title);
          console.log('   Sources:', notebook.sources?.length || 0);
          console.log('   Outputs:', notebook.outputs?.length || 0);
          return true;
        }
      }
    }

    console.log('⚠️ Notebook API returned status:', listResponse.status);
    return false;
  } catch (error) {
    console.log('❌ Notebook API error:', error);
    return false;
  }
}

async function testStudyRoomAPI(token: string) {
  console.log('\n🔍 Testing Study Room API...');

  try {
    // Test listing study rooms
    const listResponse = await fetch(`${baseUrl}/api/study-rooms`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (listResponse.ok) {
      const rooms = await listResponse.json();
      console.log('✅ Study Room list:', rooms.length, 'rooms');
      return true;
    }

    console.log('⚠️ Study Room API returned status:', listResponse.status);
    return false;
  } catch (error) {
    console.log('❌ Study Room API error:', error);
    return false;
  }
}

async function testDirectContentGeneration() {
  console.log('\n🔍 Testing Direct Content Generation...');

  try {
    const response = await fetch(`${workersUrl}/api/content/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'Machine learning is a branch of artificial intelligence that uses algorithms to learn from data and make predictions or decisions without being explicitly programmed.',
        title: 'Machine Learning Overview',
        length: 'short',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Summary generated');
      console.log('   Key points:', data.keyPoints?.length || 'N/A');
      return true;
    }

    console.log('⚠️ Content generation returned status:', response.status);
    return false;
  } catch (error) {
    console.log('❌ Content generation error:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('='.repeat(60));
  console.log('🧪 EduFeed Integration Test Suite');
  console.log('='.repeat(60));

  const results: Record<string, boolean | string> = {};

  // Test 1: Workers Health
  results['workers_health'] = await testWorkersHealth();

  // Test 2: Workers AI
  results['workers_ai'] = await testWorkersAI();

  // Test 3: Supabase Auth
  const token = await testSupabaseAuth();
  results['supabase_auth'] = token ? 'success' : 'failed';

  if (token) {
    // Test 4: Notebook API
    results['notebook_api'] = await testNotebookAPI(token);

    // Test 5: Study Room API
    results['study_room_api'] = await testStudyRoomAPI(token);
  }

  // Test 6: Direct Content Generation
  results['content_generation'] = await testDirectContentGeneration();

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;

  for (const [test, result] of Object.entries(results)) {
    const status = result === true || result === 'success' ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${test}`);
    if (result === true || result === 'success') passed++;
    else failed++;
  }

  console.log('='.repeat(60));
  console.log(`Total: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60));

  // Sign out
  await supabase.auth.signOut();

  return failed === 0;
}

runAllTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
