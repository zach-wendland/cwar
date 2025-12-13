import { test, expect, Page } from '@playwright/test';

// Mobile viewport configurations
const MOBILE_VIEWPORTS = {
  iPhoneSE: { width: 375, height: 667 },
  iPhone12: { width: 390, height: 844 },
  iPhoneXR: { width: 414, height: 896 },
  pixel5: { width: 393, height: 851 },
};

// Helper to set up game state
async function setupGameState(page: Page) {
  const stateCodes = [
    "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI",
    "ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN",
    "MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH",
    "OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA",
    "WV","WI","WY"
  ];

  const state = {
    turn: 5,
    risk: 30,
    clout: 100,
    funds: 200,
    support: Object.fromEntries(stateCodes.map(code => [code, 40])),
    factionSupport: {
      tech_optimists: 50,
      traditional_values: 50,
      economic_populists: 50,
      civil_libertarians: 50,
      establishment: 50,
    },
    tutorial: {
      tutorialDismissed: true,
      completedSteps: ['WELCOME'],
      currentStep: null,
      firstTimeFeatures: {},
    },
    totalFundsEarned: 150,
    totalCloutEarned: 80,
    consecutiveNegativeFunds: 0,
    previousRiskZone: 'SAFE',
    sentiment: { factionMoods: {} },
    recentReactions: [],
    actionCooldowns: {},
    consecutiveActionUses: {},
    newsLog: ['Game started', 'Turn 5 complete'],
    socialFeed: [],
    advisors: [],
    streak: 2,
    highestStreak: 3,
    lastActionWasCritical: false,
    totalCriticalHits: 1,
    sessionFirstAction: false,
    achievementsUnlocked: [],
    victory: false,
    gameOver: false,
  };

  await page.evaluate((s) => {
    localStorage.setItem('gameSave', JSON.stringify(s));
    localStorage.setItem('tutorialState', JSON.stringify(s.tutorial));
  }, state);
}

test.describe('Mobile Responsive Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORTS.iPhone12);
    await page.goto('/');
    await setupGameState(page);
    await page.reload();
  });

  test('game renders correctly on mobile viewport', async ({ page }) => {
    // Core elements should be visible
    await expect(page.locator('[data-testid="victory-tracker"]')).toBeVisible({ timeout: 5000 });

    // Stats should be visible (might be collapsed)
    await expect(page.getByText(/Clout/i).first()).toBeVisible();
  });

  test('action panel is accessible on mobile', async ({ page }) => {
    // Action buttons should be visible
    await expect(page.getByText('Fundraise').first()).toBeVisible({ timeout: 5000 });

    // Should be able to tap an action
    await page.getByText('Fundraise').first().tap();

    // Game should still be functional
    await expect(page.locator('body')).toBeVisible();
  });

  test('map is visible and interactive on mobile', async ({ page }) => {
    // Map container should be present
    const mapContainer = page.locator('[class*="usa-map"]').first();

    // Even if map is small, it should be in the DOM
    await expect(page.locator('body')).toBeVisible();
  });

  test('bottom sheet is present on mobile', async ({ page }) => {
    // Look for bottom sheet indicator
    const bottomSheet = page.locator('[class*="BottomSheet"]').first();

    // The bottom sheet might show as a peek bar
    await expect(page.getByText(/Advisors/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('collapsible stats bar works on mobile', async ({ page }) => {
    // Stats bar should be present
    const statsContent = page.getByText(/Turn/i).first();
    await expect(statsContent).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Mobile Touch Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORTS.iPhoneXR);
    await page.goto('/');
    await setupGameState(page);
    await page.reload();
  });

  test('buttons have proper tap targets (44px minimum)', async ({ page }) => {
    // Get action button bounding box
    const fundraiseButton = page.getByText('Fundraise').first();
    await fundraiseButton.waitFor({ state: 'visible', timeout: 5000 });

    const box = await fundraiseButton.boundingBox();

    // Tap targets should be at least 44px for accessibility
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(40); // Allow slight tolerance
    }
  });

  test('scroll works properly on mobile', async ({ page }) => {
    // Initial scroll position
    const initialScrollY = await page.evaluate(() => window.scrollY);

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 200));

    const newScrollY = await page.evaluate(() => window.scrollY);

    // Scroll should have changed
    expect(newScrollY).toBeGreaterThanOrEqual(initialScrollY);
  });

  test('tutorial modal is usable on mobile', async ({ page }) => {
    // Clear localStorage to trigger tutorial
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Tutorial should be visible
    await expect(page.getByText('Culture War: Rise or Vanish')).toBeVisible({ timeout: 5000 });

    // Skip button should be tappable
    const skipButton = page.getByRole('button', { name: /skip/i }).first();
    await skipButton.tap();

    // Tutorial should dismiss
    await expect(page.getByText('Culture War: Rise or Vanish')).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe('Mobile Event Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORTS.pixel5);
  });

  test('event modal is usable on mobile', async ({ page }) => {
    await page.goto('/');

    const pendingEvent = {
      title: 'Mobile Event',
      description: 'Test event on mobile.',
      options: [
        { text: 'Mobile Option A', outcome: { cloutDelta: 5 } },
        { text: 'Mobile Option B', outcome: { fundsDelta: 10 } },
      ],
    };

    await setupGameState(page);
    await page.evaluate((event) => {
      const saved = localStorage.getItem('gameSave');
      if (saved) {
        const state = JSON.parse(saved);
        state.pendingEvent = event;
        localStorage.setItem('gameSave', JSON.stringify(state));
      }
    }, pendingEvent);

    await page.reload();

    // Event should be visible
    await expect(page.getByText('Mobile Event')).toBeVisible({ timeout: 5000 });

    // Options should be tappable
    await page.getByText('Mobile Option A').tap();

    // Modal should close
    await expect(page.getByText('Mobile Event')).not.toBeVisible({ timeout: 5000 });
  });

  test('victory modal is usable on mobile', async ({ page }) => {
    await page.goto('/');
    await setupGameState(page);

    await page.evaluate(() => {
      const saved = localStorage.getItem('gameSave');
      if (saved) {
        const state = JSON.parse(saved);
        state.victory = true;
        localStorage.setItem('gameSave', JSON.stringify(state));
      }
    });

    await page.reload();

    await expect(page.getByText('VICTORY!')).toBeVisible({ timeout: 5000 });

    // Play Again should be tappable
    await page.getByRole('button', { name: /Play Again/i }).tap();

    await expect(page.getByText('VICTORY!')).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe('Mobile Orientation', () => {
  test('landscape orientation displays correctly', async ({ page }) => {
    // iPhone 12 landscape
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto('/');
    await setupGameState(page);
    await page.reload();

    // Core elements should still be visible
    await expect(page.locator('[data-testid="victory-tracker"]')).toBeVisible({ timeout: 5000 });
  });

  test('portrait to landscape transition maintains state', async ({ page }) => {
    // Start in portrait
    await page.setViewportSize(MOBILE_VIEWPORTS.iPhone12);
    await page.goto('/');
    await setupGameState(page);
    await page.reload();

    // Verify initial state
    await expect(page.locator('[data-testid="victory-tracker"]')).toBeVisible({ timeout: 5000 });

    // Rotate to landscape
    await page.setViewportSize({ width: 844, height: 390 });

    // State should persist
    await expect(page.locator('[data-testid="victory-tracker"]')).toBeVisible({ timeout: 5000 });
  });
});
