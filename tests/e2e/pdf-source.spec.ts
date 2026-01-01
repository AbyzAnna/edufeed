import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// Test user credentials (should match a test user in database)
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpass123',
};

// Create a minimal valid PDF for testing
function createTestPDF(): Buffer {
  // A minimal valid PDF with some text
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj
4 0 obj
<<
/Length 68
>>
stream
BT
/F1 12 Tf
100 700 Td
(This is a test PDF document for EduFeed E2E testing.) Tj
ET
endstream
endobj
5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000266 00000 n
0000000384 00000 n
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
461
%%EOF`;
  return Buffer.from(pdfContent);
}

test.describe('PDF Source Addition Flow', () => {
  // UI tests that require authentication are skipped until test users are set up
  test.skip(({ }, testInfo) => true, 'Requires authentication setup');

  let testPdfPath: string;

  test.beforeAll(async () => {
    // Create a test PDF file
    testPdfPath = path.join(__dirname, 'test-document.pdf');
    fs.writeFileSync(testPdfPath, createTestPDF());
  });

  test.afterAll(async () => {
    // Cleanup test PDF
    if (fs.existsSync(testPdfPath)) {
      fs.unlinkSync(testPdfPath);
    }
  });

  // Before each test, login and navigate to notebooks
  test.beforeEach(async ({ page }) => {
    // Navigate to login
    await page.goto('/login');

    // Wait for the login form to load
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });

    // Fill in login credentials
    await page.fill('input[type="email"], input[name="email"]', TEST_USER.email);
    await page.fill('input[type="password"], input[name="password"]', TEST_USER.password);

    // Submit login form
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard/notebooks
    await page.waitForURL('**/notebooks**', { timeout: 15000 });
  });

  test('should create a new notebook and add a PDF source', async ({ page }) => {
    // Navigate to notebooks page
    await page.goto('/notebooks');

    // Click "Create Notebook" button
    const createButton = page.getByRole('button', { name: /create|new notebook/i });
    await createButton.click();

    // Fill in notebook name
    const titleInput = page.getByPlaceholder(/notebook name|title/i);
    if (await titleInput.isVisible()) {
      await titleInput.fill('Test PDF Notebook');
    }

    // Create the notebook
    const submitButton = page.getByRole('button', { name: /create/i });
    await submitButton.click();

    // Wait for notebook to be created and navigated to
    await page.waitForURL('**/notebooks/**', { timeout: 10000 });

    // Click "Add sources" button
    const addSourceButton = page.getByRole('button', { name: /add source/i });
    await addSourceButton.click();

    // Select PDF source type
    const pdfOption = page.getByText('PDF Document');
    await pdfOption.click();

    // Upload the test PDF file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testPdfPath);

    // Verify file is selected (shows file name)
    await expect(page.getByText(/test-document\.pdf/i)).toBeVisible();

    // Click Add Source button
    const addButton = page.getByRole('button', { name: /add source/i });
    await addButton.click();

    // Wait for modal to close and verify source was added
    await expect(page.getByText(/failed/i)).not.toBeVisible({ timeout: 15000 });

    // Verify source appears in the list (either shows pending/processing/completed)
    await expect(
      page.getByText(/test-document\.pdf|PDF|processing|completed|pending/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('should handle PDF upload validation', async ({ page }) => {
    // Navigate to a notebook (assuming one exists or create one)
    await page.goto('/notebooks');

    // If there's a notebook, click it; otherwise create one
    const firstNotebook = page.locator('.card, [data-testid="notebook-card"]').first();
    if (await firstNotebook.isVisible({ timeout: 3000 })) {
      await firstNotebook.click();
    } else {
      // Create a new notebook first
      const createButton = page.getByRole('button', { name: /create|new/i });
      await createButton.click();
      await page.waitForTimeout(1000);
    }

    // Wait for notebook page
    await page.waitForURL('**/notebooks/**');

    // Click add sources
    const addSourceButton = page.getByRole('button', { name: /add source/i });
    if (await addSourceButton.isVisible({ timeout: 5000 })) {
      await addSourceButton.click();

      // Select PDF type
      const pdfOption = page.getByText('PDF Document');
      await pdfOption.click();

      // Check that the Add Source button is disabled without a file
      const addButton = page.getByRole('button', { name: /add source/i });
      await expect(addButton).toBeDisabled();
    }
  });
});

// API Tests (these don't require full E2E auth, just service-level testing)
test.describe('PDF Processing API Tests', () => {
  test('Upload API accepts PDF files', async ({ request }) => {
    // Create a test PDF buffer
    const pdfBuffer = createTestPDF();

    // This test would need authentication, so we'll skip it
    // In a real setup, you'd have a test token or mock auth
    test.skip(true, 'Requires authentication');
  });

  test('PDF parse library is functional', async () => {
    // Simple validation that the PDF parsing library is installed and working
    const { PDFParse } = await import('pdf-parse');
    expect(PDFParse).toBeDefined();
    expect(typeof PDFParse).toBe('function');
  });
});

// Integration tests for PDF processing workflow
test.describe('PDF Source Integration Tests', () => {
  test('Supabase storage bucket exists', async ({ request }) => {
    // Skip if service role key is not available
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      test.skip(true, 'SUPABASE_SERVICE_ROLE_KEY not set');
      return;
    }

    // Check that the uploads bucket exists in Supabase
    const response = await request.get(
      'https://xsajblfxxeztfzpzoevi.supabase.co/storage/v1/bucket',
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
      }
    );

    expect(response.status()).toBe(200);
    const buckets = await response.json();
    const uploadsBucket = buckets.find((b: { name: string }) => b.name === 'uploads');
    expect(uploadsBucket).toBeTruthy();
  });

  test('Public URLs work for uploaded files', async ({ request }) => {
    // Test that public URLs from Supabase storage are accessible
    // This is a sanity check that the storage is configured correctly
    const testUrl = 'https://xsajblfxxeztfzpzoevi.supabase.co/storage/v1/object/public/uploads/';

    // We just check that the storage endpoint exists (may return 404 for non-existent file, but not 403)
    const response = await request.get(testUrl + 'test-nonexistent.pdf');
    // Should not be 403 (Forbidden) - the bucket is public
    expect([200, 400, 404]).toContain(response.status());
  });
});
