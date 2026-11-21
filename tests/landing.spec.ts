import { test, expect } from '@playwright/test';

test.describe('Reelix Landing Page Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('header navigation and creator tools dropdown function properly', async ({ page }) => {
    // Brand header
    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByText('Reelix').first()).toBeVisible();

    // Tools dropdown toggle
    const toolsButton = page.locator('#toolsDropdownWrapper button').first();
    await expect(toolsButton).toBeVisible();
    await toolsButton.click();

    // Dropdown items visible
    const dropdown = page.locator('#toolsDropdownWrapper .mega-dropdown');
    await expect(dropdown).toHaveClass(/is-open/);
    await expect(page.getByText('AI Clipper').first()).toBeVisible();
    await expect(page.getByText('Auto-Captions').first()).toBeVisible();
  });

  test('hero section, headline and CTAs navigate to studio', async ({ page }) => {
    // Value proposition headline
    await expect(page.locator('h1')).toContainText('Turn long videos');
    await expect(page.locator('h1')).toContainText('shorts');

    // Primary CTA navigates to /studio
    const primaryCta = page.getByRole('link', { name: /Get started free/i });
    await expect(primaryCta).toBeVisible();
    await primaryCta.click();

    // Verify navigation to studio workspace
    await expect(page).toHaveURL(/\/studio/, { timeout: 10000 });
    await expect(page.getByText('AI Clip Direction Studio')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Drop a link/i })).toBeVisible();
  });

  test('demo modal opens with interactive timeline walkthrough', async ({ page }) => {
    const demoBtn = page.getByRole('button', { name: /See how it works/i });
    await demoBtn.click();

    const modal = page.locator('.modal-panel');
    await expect(modal).toBeVisible();
    await expect(page.getByText('Interactive Walkthrough')).toBeVisible();
    await expect(page.getByText('SAMPLE DATA', { exact: true })).toBeVisible();

    // Close via Escape key
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('phone showcase controls and deck view mode switch work', async ({ page }) => {
    // Phone chassis is mounted
    await expect(page.locator('.phone-chassis')).toBeVisible();
    await expect(page.locator('.dynamic-island')).toBeVisible();

    // Switch view mode to Stack
    const stackBtn = page.getByRole('button', { name: 'Stack' });
    await stackBtn.click();
    await expect(stackBtn).toHaveClass(/bg-white/);

    // Switch view mode back to Cylinder
    const cylinderBtn = page.getByRole('button', { name: 'Cylinder' });
    await cylinderBtn.click();
    await expect(cylinderBtn).toHaveClass(/bg-white/);

    // Carousel next button
    const nextBtn = page.getByRole('button', { name: 'Next reel' });
    await nextBtn.click();
  });

  test('pricing modal displays clear, prototype-honest tiers', async ({ page }) => {
    const pricingBtn = page.getByRole('button', { name: 'Pricing' }).first();
    await pricingBtn.click();

    const modal = page.locator('.modal-panel');
    await expect(modal).toBeVisible();
    await expect(modal.getByText('Planned Pricing')).toBeVisible();
    await expect(modal.getByText('Starter', { exact: true })).toBeVisible();
    await expect(modal.getByText('Creator Pro', { exact: true })).toBeVisible();
    await expect(modal.getByText('Studio', { exact: true })).toBeVisible();

    // Toggle Annual / Monthly
    const annualBtn = page.getByRole('button', { name: /Annual/i });
    await annualBtn.click();
    await expect(annualBtn).toHaveClass(/bg-ink/);

    // Close modal
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('authentication route /login renders Google OAuth and back navigation', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Sign in to Reelix Studio')).toBeVisible();
    await expect(page.getByRole('button', { name: /Continue with Google/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Back to home/i })).toBeVisible();

    // Click back to home
    await page.getByRole('link', { name: /Back to home/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('creator studio complete user journey: direct load, sample analysis, edit and export', async ({ page }) => {
    // 1. Direct navigation to /studio
    await page.goto('/studio');
    await expect(page.getByText('AI Clip Direction Studio')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Drop a link/i })).toBeVisible();

    // 2. Refreshing the studio route still renders properly
    await page.reload();
    await expect(page.getByText('AI Clip Direction Studio')).toBeVisible();

    // 3. Navigate back to landing page using workspace navigation
    const backBtn = page.getByRole('link', { name: /Back to Home/i });
    await expect(backBtn).toBeVisible();
    await backBtn.click();
    await expect(page).toHaveURL('/');

    // 4. Navigate back to /studio
    await page.goto('/studio');

    // 5. Click "Try Sample" to load sample video
    const sampleBtn = page.getByRole('button', { name: /Try Sample \d/i });
    await expect(sampleBtn).toBeVisible();
    await sampleBtn.click();

    // Verify source preview strip is visible
    await expect(page.locator('#videoUrlInput')).toHaveValue(/youtube\.com/);
    await expect(page.getByText('Building Products That Stick')).toBeVisible();

    // 6. Start analysis
    const analyzeBtn = page.getByRole('button', { name: /Analyze & Extract Clips/i });
    await analyzeBtn.click();

    // Wait for analysis to complete and candidate clips to display
    await expect(page.getByText('SAMPLE PREVIEW')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('5 candidate clips', { exact: true })).toBeVisible();
    await expect(page.getByText('The 10-Second Retention Rule')).toBeVisible();

    // 7. Select a candidate clip and navigate to full Timeline Editor (/studio/editor)
    const editLink = page.getByRole('link', { name: /Edit & Create/i }).first();
    await expect(editLink).toBeVisible();
    await editLink.click();

    // Verify navigation to /studio/editor
    await expect(page).toHaveURL(/\/studio\/editor/, { timeout: 10000 });
    await expect(page.getByText('Selected Queue')).toBeVisible();
    await expect(page.getByText('Clips Deck')).toBeVisible();
    await expect(page.getByText('The 10-Second Retention Rule').first()).toBeVisible();

    // 8. Test Timeline Editor Controls: Subtitles, Split & Undo
    const subTab = page.getByRole('tab', { name: /Subtitles/i });
    await subTab.click();
    const subInput = page.getByLabel('Subtitle segment 1');
    await expect(subInput).toBeVisible();
    await subInput.fill('Most teams spend months polishing features (Direct Cut)');

    // Nudge and Split
    const nudgeBtn = page.getByRole('button', { name: /Nudge forward/i });
    await nudgeBtn.click();
    await nudgeBtn.click();
    const splitBtn = page.getByRole('button', { name: /Split/i });
    await splitBtn.click();

    // Undo action
    const undoBtn = page.getByRole('button', { name: /Undo/i });
    await expect(undoBtn).toBeEnabled();
    await undoBtn.click();

    // 9. Open Export Modal and download real .SRT export
    const exportClipBtn = page.getByRole('button', { name: /Export Clip/i });
    await exportClipBtn.click();

    const exportModal = page.getByRole('dialog', { name: /Export Clip/i });
    await expect(exportModal).toBeVisible();
    await expect(page.getByRole('heading', { name: /Export Clip/i })).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    const srtBtn = page.getByRole('button', { name: /Download .SRT/i });
    await srtBtn.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.srt');
    await expect(exportModal).not.toBeVisible();

    // 10. Refreshing the editor route preserves state
    await page.reload();
    await expect(page).toHaveURL(/\/studio\/editor/);
    await expect(page.getByText('The 10-Second Retention Rule').first()).toBeVisible();

    // 11. Navigate back to Studio using header link
    const studioLink = page.getByRole('link', { name: /← Studio/i });
    await expect(studioLink).toBeVisible();
    await studioLink.click();

    await expect(page).toHaveURL(/\/studio/);
    await expect(page.getByText('AI Clip Direction Studio')).toBeVisible();
  });
});
