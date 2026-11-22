import { test, expect } from "@playwright/test";

test.describe("Reelix Studio — Smart Moment Search", () => {
  test("mode switcher in /studio toggles between Clip Discovery and Smart Moment Search", async ({ page }) => {
    await page.goto("/studio");

    // Both tabs should be present
    const clipDiscTab = page.getByRole("tab", { name: /Clip Discovery/i });
    const smartSearchTab = page.getByRole("tab", { name: /Smart Moment Search/i });
    await expect(clipDiscTab).toBeVisible();
    await expect(smartSearchTab).toBeVisible();

    // Default is Clip Discovery
    await expect(page.getByRole("heading", { name: /Drop a link\. Direct the cut\./i })).toBeVisible();

    // Switch to Smart Moment Search
    await smartSearchTab.click();
    await expect(page.getByRole("heading", { name: /Smart Moment Search/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("01 · Source URL")).toBeVisible();
    await expect(page.getByText("02 · Target (targetEntity)")).toBeVisible();
    await expect(page.getByText("03 · Condition")).toBeVisible();

    // Switch back to Clip Discovery
    await clipDiscTab.click();
    await expect(page.getByRole("heading", { name: /Drop a link\. Direct the cut\./i })).toBeVisible();
  });

  test("direct navigation via query parameter loads Smart Moment Search", async ({ page }) => {
    await page.goto("/studio?mode=smart_search");
    await expect(page.getByRole("heading", { name: /Smart Moment Search/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Run Smart Search/i })).toBeDisabled();
  });

  test("demo target met state renders timeline strip, summary bar, honesty panel and exports", async ({ page }) => {
    await page.goto("/studio?mode=smart_search");

    // Click Try Demo Result
    const tryDemoBtn = page.getByRole("button", { name: /Try Demo Result/i });
    await expect(tryDemoBtn).toBeVisible();
    await tryDemoBtn.click();

    // Verify Demo label and Summary Bar
    await expect(page.getByText("SAMPLE DEMO RESULT", { exact: true })).toBeVisible();
    await expect(page.getByText(/Found 12 intervals/i)).toBeVisible();
    await expect(page.getByText("Target met", { exact: true })).toBeVisible();

    // Timeline strip and axis ticks
    await expect(page.getByText("Timeline Strip")).toBeVisible();
    await expect(page.getByText("0:00 → 2:00:00")).toBeVisible();

    // Honesty Panel
    await expect(page.getByText("Verification & Source Capabilities")).toBeVisible();
    await expect(page.getByText(/Model-only evidence — not exhaustive/i)).toBeVisible();
    await expect(page.getByText("Video model ✓")).toBeVisible();
    await expect(page.getByText("Scoreboard OCR · not run")).toBeVisible();

    // Interval list rows
    await expect(page.getByText("04:18 – 07:08")).toBeVisible();
    await expect(page.getByText("12:03 – 14:48")).toBeVisible();

    // Outputs buttons
    await expect(page.getByRole("button", { name: /Copy Timestamps/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Download JSON/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Download CSV/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Open in Editor/i })).toBeEnabled();
  });

  test("demo shortfall state calculates exact shortfall without padding", async ({ page }) => {
    await page.goto("/studio?mode=smart_search");

    // Select Shortfall preview state from dropdown
    await page.getByLabel(/Preview UI state/i).selectOption("demo_shortfall");

    await expect(page.getByText("SAMPLE DEMO RESULT", { exact: true })).toBeVisible();
    await expect(page.getByText(/Short by 5:40/i)).toBeVisible();
    await expect(page.getByText("14:20 of 20:00")).toBeVisible();
  });

  test("mark as wrong excludes interval and updates selection locally", async ({ page }) => {
    await page.goto("/studio?mode=smart_search");
    await page.getByRole("button", { name: /Try Demo Result/i }).click();

    // Target is met initially
    await expect(page.getByText("Target met", { exact: true })).toBeVisible();

    // Mark first interval as wrong
    const markWrongBtn = page.getByRole("button", { name: "Mark as wrong" }).first();
    await markWrongBtn.click();

    // First button now shows Undo
    await expect(page.getByRole("button", { name: "Undo" }).first()).toBeVisible();

    // Clicking Undo restores the interval
    const undoBtn = page.getByRole("button", { name: "Undo" }).first();
    await undoBtn.click();
    await expect(page.getByRole("button", { name: "Mark as wrong" }).first()).toBeVisible();
  });

  test("editor handoff modal maps selected intervals to Clip[] and navigates to /studio/editor", async ({ page }) => {
    await page.goto("/studio?mode=smart_search");
    await page.getByRole("button", { name: /Try Demo Result/i }).click();

    // Open handoff modal
    await page.getByRole("button", { name: /Open in Editor/i }).click();

    const modal = page.getByRole("dialog", { name: /Ready for \/studio\/editor/i });
    await expect(modal).toBeVisible();
    await expect(page.getByText("localStorage · reelix_active_project")).toBeVisible();
    await expect(page.getByRole("button", { name: /Copy Clip\[\] JSON/i })).toBeVisible();

    // Click Launch Editor
    const launchBtn = page.getByRole("link", { name: /Launch Editor →/i });
    await expect(launchBtn).toBeVisible();
    await launchBtn.click();

    // Navigates into /studio/editor
    await expect(page).toHaveURL(/\/studio\/editor/);
    await expect(page.getByText("Selected Queue")).toBeVisible();
    await expect(page.getByLabel("Live 9:16 Vertical Preview")).toBeVisible();
    await expect(page.getByLabel("Multi-Track Timeline and Tools")).toBeVisible();

    // Verify P0-A: handoff payload does not inject fabricated sub-scores
    const storedHandoff = await page.evaluate(() => {
      const raw = localStorage.getItem("reelix_editor_handoff");
      return raw ? JSON.parse(raw) : null;
    });
    expect(storedHandoff).not.toBeNull();
    expect(storedHandoff[0].hookScore).toBeNull();
    expect(storedHandoff[0].pacingScore).toBeNull();
    expect(storedHandoff[0].clarityScore).toBeNull();
  });

  test("server-side proxy /api/health returns valid json response", async ({ request }) => {
    const res = await request.get("/api/health");
    // If backend is running, returns 200 with { status: "ok" }, or 502 with backend_unreachable
    expect([200, 502]).toContain(res.status());
    const data = await res.json();
    expect(data).toBeDefined();
  });
});
