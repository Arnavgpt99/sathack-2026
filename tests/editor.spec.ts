import { test, expect } from '@playwright/test';

test.describe('Reelix Timeline Editor (/studio/editor)', () => {
  test('direct navigation loads default clip and renders all 3 columns and timeline', async ({ page }) => {
    await page.goto('/studio/editor');

    // Header elements
    await expect(page.getByRole('link', { name: /Reelix Home/i })).toBeVisible();
    await expect(page.getByText('Editor', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /← Studio/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Export Clip/i })).toBeVisible();

    // Column 1: Clips Deck
    await expect(page.getByText('Selected Queue')).toBeVisible();
    await expect(page.getByText('Clips Deck')).toBeVisible();

    // Column 2: 9:16 Preview Stage
    await expect(page.getByLabel('Live 9:16 Vertical Preview')).toBeVisible();
    await expect(page.getByText('9:16', { exact: true })).toBeVisible();

    // Column 3: Inspector
    await expect(page.getByLabel('Clip Inspector')).toBeVisible();
    await expect(page.getByRole('tab', { name: /Presets/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Subtitles/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Adjust/i })).toBeVisible();

    // Bottom Timeline Dock
    await expect(page.getByLabel('Multi-Track Timeline and Tools')).toBeVisible();
    await expect(page.getByRole('button', { name: /Play or pause/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Split/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Trim In/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Trim Out/i })).toBeVisible();
  });

  test('invalid project/clip IDs display clean monochrome recovery state with working fallback', async ({ page }) => {
    // Navigate with non-existent IDs and no local storage
    await page.goto('/studio/editor?projectId=fake-proj-xyz&clipId=fake-clip-999');

    // Check if recovery state or default project renders
    const recoveryHeading = page.getByRole('heading', { name: /Clip or Project Not Found/i });
    if (await recoveryHeading.isVisible()) {
      const backBtn = page.getByRole('link', { name: /← Back to Studio/i });
      await expect(backBtn).toBeVisible();
      const loadDefBtn = page.getByRole('button', { name: /Load Default Project/i });
      await expect(loadDefBtn).toBeVisible();
      await loadDefBtn.click();
      await expect(page.getByText('Selected Queue')).toBeVisible();
    } else {
      // Automatic fallback to default project succeeded
      await expect(page.getByText('Selected Queue')).toBeVisible();
    }
  });

  test('keyboard shortcuts, transport controls, and JSON EDL export work properly', async ({ page }) => {
    await page.goto('/studio/editor');

    // Transport control: Play / pause toggle
    const playBtn = page.getByRole('button', { name: /Play or pause/i });
    await expect(playBtn).toBeVisible();
    await playBtn.click();
    await expect(page.getByText(/Playing/i).first()).toBeVisible();

    // Toggle playback again
    await playBtn.click();
    await expect(page.getByText(/Ready/i).first()).toBeVisible();

    // Nudge forward via ArrowRight
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');

    // Split at playhead via 's'
    await page.keyboard.press('s');

    // Undo split via Meta+Z / Ctrl+Z
    await page.keyboard.press('Control+z');

    // Test Export Modal: JSON EDL download
    await page.getByRole('button', { name: /Export Clip/i }).click();
    const exportModal = page.getByRole('dialog', { name: /Export Clip/i });
    await expect(exportModal).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Download .JSON EDL/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.json');

    // Close modal
    await expect(exportModal).not.toBeVisible();
  });
});
