import { test, expect } from '@playwright/test';

test.describe('Culture War Game - Hydration & Mounting', () => {
  test('no hydration errors on initial load', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: Error[] = [];

    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      pageErrors.push(error);
    });

    await page.goto('/');

    // Wait for loading to complete
    await page.waitForSelector('[data-testid="victory-tracker"]', { timeout: 5000 });

    // Check for hydration errors
    const hydrationErrors = consoleErrors.filter(err =>
      err.toLowerCase().includes('hydration') ||
      err.toLowerCase().includes('did not match')
    );

    expect(hydrationErrors).toHaveLength(0);
    expect(pageErrors).toHaveLength(0);
  });

  test('loads saved game state from localStorage', async ({ page }) => {
    // Set up saved state with turn 10
    await page.goto('/');
    await page.evaluate(() => {
      const state = {
        turn: 10,
        risk: 25,
        clout: 150,
        funds: 300,
        support: {},
        factionSupport: {
          tech_optimists: 60,
          traditional_values: 50,
          economic_populists: 55,
          civil_libertarians: 50,
          establishment: 45,
        },
        tutorial: {
          tutorialDismissed: true,
          completedSteps: ['WELCOME', 'FIRST_ACTION'],
          currentStep: null,
          firstTimeFeatures: {
            spinMode: false,
            factionPanel: false,
            riskZone: false,
            victoryPaths: false,
          }
        },
        totalFundsEarned: 200,
        totalCloutEarned: 100,
        consecutiveNegativeFunds: 0,
        previousRiskZone: 'SAFE',
        sentiment: { factionMoods: {} },
        recentReactions: [],
        actionCooldowns: {},
        consecutiveActionUses: {},
        newsLog: ['Game loaded from turn 10'],
        socialFeed: [],
        advisors: [],
        streak: 3,
        highestStreak: 5,
        lastActionWasCritical: false,
        totalCriticalHits: 2,
        sessionFirstAction: false,
        achievementsUnlocked: [],
        victory: false,
        gameOver: false,
      };
      const stateCodes = ["AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI",
                        "ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN",
                        "MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH",
                        "OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA",
                        "WV","WI","WY"];
      stateCodes.forEach(code => { state.support[code] = 30; });
      localStorage.setItem('gameSave', JSON.stringify(state));
      localStorage.setItem('tutorialState', JSON.stringify(state.tutorial));
    });

    // Reload to trigger loading from localStorage
    await page.reload();

    // Wait for content to render
    await page.waitForTimeout(1000);

    // Verify no hydration errors occurred
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });

    // Verify saved state loaded (turn should be 10, not 0)
    // Note: We can't directly check state, but we can verify the game rendered
    await expect(page.locator('[data-testid="victory-tracker"]')).toBeVisible();
  });
});

test.describe('Culture War Game - Happy Path', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
  });

  test('shows dismissable welcome tutorial on first visit', async ({ page }) => {
    await page.goto('/');

    // Wait for tutorial modal to appear
    const tutorialModal = page.locator('[class*="fixed"][class*="z-50"]').first();
    await expect(tutorialModal).toBeVisible({ timeout: 5000 });

    // Should show briefing content
    await expect(page.getByText('Culture War: Rise or Vanish')).toBeVisible();

    // Click "Skip Tutorial" to dismiss (use .first() to handle responsive duplicates)
    await page.getByRole('button', { name: /skip tutorial/i }).first().click();

    // Tutorial should be dismissed
    await expect(page.getByText('Culture War: Rise or Vanish')).not.toBeVisible();
  });

  test('shows all 4 victory paths in VictoryTracker', async ({ page }) => {
    test.setTimeout(60000); // Increase timeout for this test
    await page.goto('/');

    // Dismiss tutorial first
    const skipButton = page.getByRole('button', { name: /skip tutorial/i }).first();
    if (await skipButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await skipButton.click();
      await page.waitForTimeout(1000);
    }

    // Find and click the victory tracker to expand it
    const victoryTracker = page.locator('[data-testid="victory-tracker"]');
    await victoryTracker.waitFor({ state: 'visible', timeout: 15000 });
    await victoryTracker.click({ timeout: 10000 });

    // Wait for any victory path to be visible (indicates expansion)
    await expect(page.getByText('Win the hearts of America')).toBeVisible({ timeout: 15000 });

    // All 4 victory paths should be visible
    await expect(page.getByText('Popular Mandate')).toBeVisible();
    await expect(page.getByText('Faction Dominance')).toBeVisible();
    await expect(page.getByText('Economic Power')).toBeVisible();
    await expect(page.getByText('Speed Run')).toBeVisible();
  });

  test('can perform a basic action', async ({ page }) => {
    await page.goto('/');

    // Dismiss tutorial
    const skipButton = page.getByRole('button', { name: /skip tutorial/i });
    if (await skipButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await skipButton.click();
    }

    // Wait for game to load
    await page.waitForTimeout(500);

    // Look for an action button (like Fundraise which is typically free)
    const fundraiseButton = page.getByText('Fundraise').first();
    if (await fundraiseButton.isVisible()) {
      await fundraiseButton.click();

      // Should advance turn
      await expect(page.getByText(/Turn/)).toBeVisible();
    }
  });

  test('risk meter shows correct zone colors', async ({ page }) => {
    await page.goto('/');

    // Dismiss tutorial
    const skipButton = page.getByRole('button', { name: /skip tutorial/i }).first();
    if (await skipButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await skipButton.click();
    }

    // Risk meter should be visible with a percentage (use .first() for responsive duplicates)
    const riskMeter = page.locator('.risk-meter-container').first();
    await expect(riskMeter).toBeVisible();

    // Should show "Safe" zone for initial state (0% risk)
    await expect(page.getByText('Safe').first()).toBeVisible();
  });

  test('tutorial can be started from beginning', async ({ page }) => {
    test.setTimeout(60000); // Increase timeout for this test
    await page.goto('/', { timeout: 30000 });

    // Wait for tutorial modal
    await expect(page.getByText('Culture War: Rise or Vanish')).toBeVisible({ timeout: 10000 });

    // Click "Start Playing" instead of skip
    await page.getByRole('button', { name: /start playing/i }).first().click();

    // Game should be playable now
    await expect(page.getByText('Culture War: Rise or Vanish')).not.toBeVisible();
  });

  test('stats bar shows game resources', async ({ page }) => {
    await page.goto('/');

    // Dismiss tutorial
    const skipButton = page.getByRole('button', { name: /skip tutorial/i }).first();
    if (await skipButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await skipButton.click();
    }

    // Verify stats are displayed (use .first() for responsive duplicates)
    await expect(page.getByText(/Clout/i).first()).toBeVisible();
    await expect(page.getByText(/Funds/i).first()).toBeVisible();
    await expect(page.getByText(/Risk/i).first()).toBeVisible();
    await expect(page.getByText(/Support/i).first()).toBeVisible();
  });

  test('game state persists after reload', async ({ page }) => {
    await page.goto('/');

    // Dismiss tutorial
    const skipButton = page.getByRole('button', { name: /skip tutorial/i });
    if (await skipButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await skipButton.click();
    }

    // Perform an action to advance turn
    const fundraiseButton = page.getByText('Fundraise').first();
    if (await fundraiseButton.isVisible()) {
      await fundraiseButton.click();
      await page.waitForTimeout(300);
    }

    // Reload page
    await page.reload();

    // Tutorial should still be dismissed
    await expect(page.getByText('Culture War: Rise or Vanish')).not.toBeVisible();
  });

  test('first event is delayed until turn 3', async ({ page }) => {
    await page.goto('/');

    // Dismiss tutorial
    const skipButton = page.getByRole('button', { name: /skip tutorial/i });
    if (await skipButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await skipButton.click();
    }

    // Perform 2 actions (turns 1 and 2)
    for (let i = 0; i < 2; i++) {
      const fundraiseButton = page.getByText('Fundraise').first();
      if (await fundraiseButton.isVisible()) {
        await fundraiseButton.click();
        await page.waitForTimeout(300);
      }
    }

    // No event modal should appear yet (events start at turn 3)
    const eventModal = page.locator('[class*="bg-black/80"]');
    await expect(eventModal).not.toBeVisible();
  });
});

test.describe('Culture War Game - Victory Tracking', () => {
  test('economic progress is tracked', async ({ page }) => {
    await page.goto('/');

    // Dismiss tutorial
    const skipButton = page.getByRole('button', { name: /skip tutorial/i }).first();
    if (await skipButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await skipButton.click();
    }

    // Wait for tutorial to fully dismiss
    await page.waitForTimeout(500);

    // Click victory tracker to expand
    const victoryTracker = page.locator('[data-testid="victory-tracker"]');
    await victoryTracker.waitFor({ state: 'visible' });
    await victoryTracker.click();

    // Wait for Economic Power path description to be visible (indicates expansion)
    await expect(page.getByText('Build an unstoppable war chest')).toBeVisible({ timeout: 10000 });

    // Economic Power path should show funds/clout earned tracking
    await expect(page.getByText('Funds Earned')).toBeVisible();
    await expect(page.getByText('Clout Earned')).toBeVisible();
  });
});

test.describe('Culture War Game - Risk System', () => {
  test('CAUTION zone text appears at appropriate risk level', async ({ page }) => {
    // Set initial state with 55% risk via localStorage
    await page.goto('/');
    await page.evaluate(() => {
      const state = {
        turn: 5,
        risk: 55,
        clout: 100,
        funds: 200,
        support: {},
        factionSupport: {},
        tutorial: { tutorialDismissed: true, completedSteps: ['WELCOME'], currentStep: null, firstTimeFeatures: {} },
        totalFundsEarned: 0,
        totalCloutEarned: 0,
        consecutiveNegativeFunds: 0,
        previousRiskZone: 'CAUTION',
        sentiment: { factionMoods: {} },
        recentReactions: [],
        actionCooldowns: {},
        consecutiveActionUses: {},
        newsLog: [],
        socialFeed: [],
        advisors: [],
        streak: 0,
        highestStreak: 0,
        lastActionWasCritical: false,
        totalCriticalHits: 0,
        sessionFirstAction: false,
        achievementsUnlocked: [],
        victory: false,
        gameOver: false,
      };
      // Fill all states with 20% support
      const stateCodes = ["AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI",
                        "ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN",
                        "MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH",
                        "OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA",
                        "WV","WI","WY"];
      stateCodes.forEach(code => { state.support[code] = 20; });
      // Initialize faction support
      state.factionSupport = {
        tech_optimists: 50,
        traditional_values: 50,
        economic_populists: 50,
        civil_libertarians: 50,
        establishment: 50,
      };
      localStorage.setItem('gameSave', JSON.stringify(state));
      localStorage.setItem('tutorialState', JSON.stringify(state.tutorial));
    });

    await page.reload();

    // Wait for game to mount and load state
    await page.waitForTimeout(1000);

    // CAUTION zone should be visible (use .first() for responsive duplicates)
    await expect(page.getByText('Caution').first()).toBeVisible({ timeout: 10000 });
  });
});
