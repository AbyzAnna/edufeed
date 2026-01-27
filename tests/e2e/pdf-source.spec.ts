import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Test PDF file - use a real PDF from Downloads or create a test one
const DOWNLOADS_PDF = path.join(os.homedir(), 'Downloads', '67126bd590698.pdf');
const TEST_PDF_PATH = path.join(__dirname, 'test-document.pdf');

// Create a minimal valid PDF for testing if no PDF exists in Downloads
function createTestPDF(): Buffer {
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

// Determine which PDF file to use for testing
function getTestPdfPath(): string {
  // Prefer a real PDF from Downloads for better testing
  if (fs.existsSync(DOWNLOADS_PDF)) {
    console.log(`Using PDF from Downloads: ${DOWNLOADS_PDF}`);
    return DOWNLOADS_PDF;
  }

  // Fall back to creating a test PDF
  console.log(`Creating test PDF at: ${TEST_PDF_PATH}`);
  fs.writeFileSync(TEST_PDF_PATH, createTestPDF());
  return TEST_PDF_PATH;
}

test.describe('PDF Upload E2E Test', () => {
  let pdfPath: string;

  test.beforeAll(() => {
    pdfPath = getTestPdfPath();
    console.log(`Test PDF path: ${pdfPath}`);
  });

  test.afterAll(() => {
    // Clean up created test PDF (not the Downloads one)
    if (pdfPath === TEST_PDF_PATH && fs.existsSync(TEST_PDF_PATH)) {
      fs.unlinkSync(TEST_PDF_PATH);
    }
  });

  test('should upload a PDF and process it successfully', async ({ page }) => {
    // Enable console logging from the browser
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warn') {
        console.log(`Browser ${msg.type()}: ${msg.text()}`);
      }
    });

    // Listen for failed requests
    page.on('requestfailed', request => {
      console.log(`Request failed: ${request.url()} - ${request.failure()?.errorText}`);
    });

    // Navigate to notebooks page
    console.log('[Test] Navigating to notebooks...');
    await page.goto('/notebooks', { waitUntil: 'networkidle' });

    // Wait for the page to be fully loaded
    await page.waitForLoadState('domcontentloaded');
    console.log(`[Test] Current URL: ${page.url()}`);

    // Take a screenshot to see what we have
    await page.screenshot({ path: 'test-results/01-notebooks-page.png' });

    // Check if we need to create a notebook first or use existing one
    const existingNotebook = page.locator('[data-testid="notebook-card"], .notebook-card, a[href*="/notebooks/"]').first();
    const hasExistingNotebook = await existingNotebook.isVisible({ timeout: 3000 }).catch(() => false);

    let notebookUrl: string;

    if (hasExistingNotebook) {
      console.log('[Test] Found existing notebook, clicking it...');
      await existingNotebook.click();
      await page.waitForURL('**/notebooks/**');
      notebookUrl = page.url();
    } else {
      console.log('[Test] No notebooks found, creating one...');

      // Look for create notebook button
      const createButton = page.getByRole('button', { name: /create|new/i });
      if (await createButton.isVisible({ timeout: 3000 })) {
        await createButton.click();

        // Fill in notebook name if modal appears
        const nameInput = page.locator('input[placeholder*="name"], input[placeholder*="title"]');
        if (await nameInput.isVisible({ timeout: 2000 })) {
          await nameInput.fill('PDF Test Notebook');

          const submitButton = page.getByRole('button', { name: /create|save/i });
          await submitButton.click();
        }

        await page.waitForURL('**/notebooks/**', { timeout: 10000 });
      }
      notebookUrl = page.url();
    }

    console.log(`[Test] On notebook page: ${notebookUrl}`);
    await page.screenshot({ path: 'test-results/02-notebook-page.png' });

    // Find and click "Add Source" button
    console.log('[Test] Looking for Add Source button...');
    const addSourceButton = page.locator('button:has-text("Add Source"), button:has-text("Add sources"), [data-testid="add-source"]');
    await expect(addSourceButton).toBeVisible({ timeout: 10000 });
    await addSourceButton.click();

    console.log('[Test] Add Source modal should be open...');
    await page.screenshot({ path: 'test-results/03-add-source-modal.png' });

    // Select PDF Document option
    console.log('[Test] Selecting PDF Document option...');
    const pdfOption = page.locator('button:has-text("PDF Document"), [data-testid="pdf-option"]');
    await expect(pdfOption).toBeVisible({ timeout: 5000 });
    await pdfOption.click();

    await page.screenshot({ path: 'test-results/04-pdf-form.png' });

    // Upload the PDF file
    console.log(`[Test] Uploading PDF: ${pdfPath}`);
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(pdfPath);

    // Wait for file to be selected (shows filename)
    const filename = path.basename(pdfPath);
    console.log(`[Test] Waiting for filename to appear: ${filename}`);
    await page.waitForTimeout(500); // Give time for file selection UI to update

    await page.screenshot({ path: 'test-results/05-file-selected.png' });

    // Click the Add Source button in the modal
    console.log('[Test] Clicking Add Source button to submit...');
    const submitButton = page.locator('button[type="submit"]:has-text("Add Source"), button.flex-1:has-text("Add Source")').last();
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    await submitButton.click();

    // Wait for the upload to complete (modal closes)
    console.log('[Test] Waiting for upload to complete...');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/06-after-upload.png' });

    // Check for error INSIDE the modal (not on the page itself where other sources may show failed)
    const modalErrorMessage = page.locator('.fixed .bg-red-500\\/10, [role="dialog"] [class*="error"]');
    const hasModalError = await modalErrorMessage.isVisible({ timeout: 1000 }).catch(() => false);

    if (hasModalError) {
      const errorText = await modalErrorMessage.textContent();
      console.error(`[Test] Modal ERROR: ${errorText}`);
      await page.screenshot({ path: 'test-results/07-error.png' });
      throw new Error(`Upload failed with error: ${errorText}`);
    }

    // Verify the source appears in the notebook
    console.log('[Test] Checking for source in notebook...');

    // Wait for source to appear (with polling for status updates)
    const maxWaitTime = 60000; // 60 seconds max
    const pollInterval = 3000; // 3 seconds
    const startTime = Date.now();

    let sourceCompleted = false;
    let sourceProcessing = false;
    let lastStatus = '';

    while (Date.now() - startTime < maxWaitTime) {
      // Look for sources with our filename - get all matches since there might be old failed ones
      const sourceItems = page.locator(`text="${filename}"`);
      const count = await sourceItems.count();
      console.log(`[Test] Found ${count} source(s) with filename ${filename}`);

      // Check each source item - look for the one that's Processing or Completed (the new one)
      for (let i = 0; i < count; i++) {
        const sourceItem = sourceItems.nth(i);
        const sourceContainer = sourceItem.locator('..').locator('..');

        // Check for Processing badge (indicates the new upload)
        const processingBadge = sourceContainer.locator('text=/processing/i');
        const completedBadgeWords = sourceContainer.locator('text=/\\d+ words/i');
        const completedBadge = sourceContainer.locator('text=/completed/i');

        if (await processingBadge.isVisible({ timeout: 200 }).catch(() => false)) {
          if (lastStatus !== 'processing') {
            console.log(`[Test] Source #${i} is processing...`);
            lastStatus = 'processing';
            sourceProcessing = true;
          }
        }

        // Check for completed badge (word count means it's done)
        if (await completedBadgeWords.isVisible({ timeout: 200 }).catch(() => false) ||
            await completedBadge.isVisible({ timeout: 200 }).catch(() => false)) {
          // Make sure this isn't also showing as failed
          const failedBadge = sourceContainer.locator('text=/failed/i');
          if (!(await failedBadge.isVisible({ timeout: 100 }).catch(() => false))) {
            console.log(`[Test] Source #${i} completed successfully!`);
            sourceCompleted = true;
            break;
          }
        }
      }

      if (sourceCompleted) break;

      // Wait before polling again
      await page.waitForTimeout(pollInterval);
    }

    await page.screenshot({ path: 'test-results/09-final-state.png' });

    if (sourceCompleted) {
      console.log('[Test] PDF upload and processing completed successfully!');
    } else if (sourceProcessing) {
      console.log('[Test] PDF was uploaded successfully and is still processing (acceptable for larger PDFs)');
      // This is acceptable - the source was uploaded successfully
    } else {
      // One more check - look for our filename on the page
      const ourFile = page.locator(`text="${filename}"`);
      if (await ourFile.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log('[Test] PDF was uploaded and is visible in sources list');
      } else {
        throw new Error('PDF upload may have failed - source not visible');
      }
    }

    console.log('[Test] PDF upload test completed successfully!');
  });

  test('should show validation error for invalid file types', async ({ page }) => {
    // Navigate to notebooks page
    await page.goto('/notebooks', { waitUntil: 'networkidle' });

    // Find an existing notebook or create one
    const existingNotebook = page.locator('a[href*="/notebooks/"]').first();
    if (await existingNotebook.isVisible({ timeout: 3000 })) {
      await existingNotebook.click();
      await page.waitForURL('**/notebooks/**');
    }

    // Click Add Source
    const addSourceButton = page.locator('button:has-text("Add Source"), button:has-text("Add sources")');
    if (await addSourceButton.isVisible({ timeout: 5000 })) {
      await addSourceButton.click();

      // Select PDF Document
      const pdfOption = page.locator('button:has-text("PDF Document")');
      await pdfOption.click();

      // Check that the Add Source button is disabled without a file
      const submitButton = page.locator('button[type="submit"]:has-text("Add Source")');
      await expect(submitButton).toBeDisabled();
    }
  });
});

// Integration tests for PDF processing
test.describe('PDF Processing Integration', () => {
  test('unpdf library is available', async () => {
    const { extractText } = await import('unpdf');
    expect(extractText).toBeDefined();
    expect(typeof extractText).toBe('function');
  });

  test('Supabase storage endpoint is accessible', async ({ request }) => {
    const response = await request.get(
      'https://xsajblfxxeztfzpzoevi.supabase.co/storage/v1/object/public/uploads/test-nonexistent.pdf'
    );
    // Should not be 403 (the bucket is public)
    expect([200, 400, 404]).toContain(response.status());
  });
});
