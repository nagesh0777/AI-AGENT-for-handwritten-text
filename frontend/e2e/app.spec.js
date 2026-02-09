import { test, expect } from '@playwright/test';
import { mockFormResult, mockHistory } from './fixtures/mockData';

test.describe('Dashboard & Form Extraction', () => {

    test.beforeEach(async ({ page }) => {
        // Debugging logs
        page.on('console', msg => console.log(`[Browser Console] ${msg.text()}`));
        page.on('pageerror', err => console.log(`[Browser Error] ${err.message}`));

        // Mock API: History
        await page.route('/api/forms/history', async route => {
            await route.fulfill({ json: mockHistory });
        });

        // Mock API: Specific Result
        await page.route('/api/forms/123/results', async route => {
            await route.fulfill({ json: { ...mockFormResult, structuredJson: mockFormResult.structuredJson } });
        });

        // Mock API: Image
        await page.route('/api/forms/123/image', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'image/jpeg',
                body: Buffer.from('')
            });
        });

        // Mock API: Upload
        await page.route('/api/forms/upload', async route => {
            await route.fulfill({ json: { id: 125, status: 'PROCESSING' } });
        });

        // Go to home
        await page.goto('/');
    });

    test('should load dashboard correctly', async ({ page }) => {
        await expect(page).toHaveTitle(/Handwritten/);
        await expect(page.getByText('Workspace Dashboard')).toBeVisible();
        await expect(page.getByText('Upload New Form')).toBeVisible();
        await expect(page.getByText('Universal Parser')).toBeVisible();
    });

    test('should navigate to history and show items', async ({ page }) => {
        // Click History in sidebar
        await page.getByRole('button', { name: 'History' }).click();

        // Verify History Header
        await expect(page.getByText('Public History')).toBeVisible();

        // Verify items
        await expect(page.getByText('invoice_scan.jpg')).toBeVisible();
        await expect(page.getByText('pending_doc.pdf')).toBeVisible();

        // Verify badges
        await expect(page.locator('.text-green-500', { hasText: 'COMPLETED' })).toBeVisible();
    });

    test('should navigate to results view and verify Smart View', async ({ page }) => {
        // Navigate to history first
        await page.getByRole('button', { name: 'History' }).click();

        // Click item
        await page.getByText('invoice_scan.jpg').click();

        // Verify results page
        await expect(page.getByText('Extraction Analysis')).toBeVisible({ timeout: 10000 });

        // Check Smart View elements
        await expect(page.getByText('Document Summary')).toBeVisible();
        // Fix: Strict mode violation (found in summary too)
        await expect(page.getByText('Medical Invoice', { exact: true })).toBeVisible();

        await expect(page.getByRole('heading', { name: 'Patient Information' })).toBeVisible();
        // Fix: Strict mode violation (found in summary too)
        await expect(page.getByText('John Doe', { exact: true })).toBeVisible();

        await expect(page.getByText('Service Charges')).toBeVisible();
        await expect(page.getByText('Consultation', { exact: true })).toBeVisible();
    });

    test('should toggle between views (Table, JSON, Raw)', async ({ page }) => {
        // Navigate to results
        await page.getByRole('button', { name: 'History' }).click();
        await page.getByText('invoice_scan.jpg').click();

        // Wait for load
        await expect(page.getByText('Extraction Analysis')).toBeVisible({ timeout: 10000 });

        // Switch to Data Grid
        await page.getByRole('button', { name: 'Data Grid' }).click();

        // Verify Grid Content
        await expect(page.getByText('[Patient Information] Patient Name')).toBeVisible();

        // Switch to JSON
        // Fix: Strict mode violation. The view switcher button and download button both have "JSON" text.
        const jsonBtn = page.getByRole('button', { name: 'JSON' });
        if (await jsonBtn.count() > 1) {
            // nth(1) is the switcher button based on previous trace
            await jsonBtn.nth(1).click();
        } else {
            await jsonBtn.click();
        }

        await expect(page.locator('pre')).toContainText('"document_type": "Medical Invoice"');

        // Switch to Raw Text
        await page.getByRole('button', { name: 'Raw' }).click();
        await expect(page.getByText('INVOICE')).toBeVisible();
    });

    test('should handle file upload', async ({ page }) => {
        // Mock file chooser
        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.getByText('Click to upload or drag & drop').click();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles({
            name: 'test-upload.jpg',
            mimeType: 'image/jpeg',
            buffer: Buffer.from('mock-image-content')
        });

        await expect(page.getByText('test-upload.jpg')).toBeVisible();

        await page.getByRole('button', { name: 'Extract Data Now' }).click();
        await expect(page.getByText('File uploaded and processing started!')).toBeVisible();
    });
});
