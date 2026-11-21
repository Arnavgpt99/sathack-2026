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

  test('hero section, headline and CTAs are interactive', async ({ page }) => {
    // Value proposition headline
    await expect(page.locator('h1')).toContainText('Turn long videos');
    await expect(page.locator('h1')).toContainText('shorts');

    // Primary CTA opens sign up / studio account modal
    const primaryCta = page.getByRole('button', { name: /Get started free/i });
    await expect(primaryCta).toBeVisible();
    await primaryCta.click();

    const modal = page.locator('.modal-panel');
    await expect(modal).toBeVisible();
    await expect(page.getByText('Create your studio account')).toBeVisible();

    // Close modal via close button
    const closeBtn = page.getByRole('button', { name: /Close modal/i });
    await closeBtn.click();
    await expect(modal).not.toBeVisible();
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
    await expect(page.getByText('Planned Pricing')).toBeVisible();
    await expect(page.getByText('Starter', { exact: true })).toBeVisible();
    await expect(page.getByText('Creator Pro', { exact: true })).toBeVisible();
    await expect(page.getByText('Studio', { exact: true })).toBeVisible();

    // Toggle Annual / Monthly
    const annualBtn = page.getByRole('button', { name: /Annual/i });
    await annualBtn.click();
    await expect(annualBtn).toHaveClass(/bg-ink/);

    // Close modal
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });
});
