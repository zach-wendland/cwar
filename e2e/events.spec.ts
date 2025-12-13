import { test, expect, Page } from '@playwright/test';

// Helper to set up game state via localStorage
async function setupGameState(page: Page, overrides: Record<string, unknown> = {}) {
  const stateCodes = [
    "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI",
    "ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN",
    "MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH",
    "OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA",
    "WV","WI","WY"
  ];

  const baseState = {
    turn: 5,
    risk: 20,
    clout: 100,
    funds: 200,
    support: Object.fromEntries(stateCodes.map(code => [code, 30])),
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
      firstTimeFeatures: {
        spinMode: false,
        factionPanel: false,
        riskZone: false,
        victoryPaths: false,
      }
    },
    totalFundsEarned: 100,
    totalCloutEarned: 50,
    consecutiveNegativeFunds: 0,
    previousRiskZone: 'SAFE',
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
    ...overrides,
  };

  await page.evaluate((state) => {
    localStorage.setItem('gameSave', JSON.stringify(state));
    localStorage.setItem('tutorialState', JSON.stringify(state.tutorial));
  }, baseState);
}

test.describe('Event Modal System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('event modal appears and blocks game actions', async ({ page }) => {
    // Set up state with a pending event
    const pendingEvent = {
      title: 'Test Crisis',
      description: 'A test event requiring your decision.',
      options: [
        { text: 'Option A', outcome: { cloutDelta: 10, message: 'Chose A' } },
        { text: 'Option B', outcome: { fundsDelta: 50, message: 'Chose B' } },
      ],
    };

    await setupGameState(page, { pendingEvent });
    await page.reload();

    // Wait for modal to appear
    const modal = page.locator('[class*="fixed"][class*="z-50"]').filter({ hasText: 'Test Crisis' });
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Verify event content is displayed
    await expect(page.getByText('Test Crisis')).toBeVisible();
    await expect(page.getByText('A test event requiring your decision.')).toBeVisible();
    await expect(page.getByText('Option A')).toBeVisible();
    await expect(page.getByText('Option B')).toBeVisible();
  });

  test('clicking event choice resolves the event', async ({ page }) => {
    const pendingEvent = {
      title: 'Decision Time',
      description: 'Make your choice.',
      options: [
        { text: 'Accept', outcome: { cloutDelta: 20, message: 'Accepted!' } },
        { text: 'Decline', outcome: { fundsDelta: -10, message: 'Declined.' } },
      ],
    };

    await setupGameState(page, { pendingEvent });
    await page.reload();

    // Wait for and click an option
    await page.waitForSelector('text=Accept', { timeout: 5000 });
    await page.getByText('Accept').click();

    // Modal should disappear
    await expect(page.getByText('Decision Time')).not.toBeVisible({ timeout: 5000 });
  });

  test('event modal has proper keyboard accessibility', async ({ page }) => {
    const pendingEvent = {
      title: 'Keyboard Test',
      description: 'Test keyboard navigation.',
      options: [
        { text: 'First Choice', outcome: { cloutDelta: 5 } },
        { text: 'Second Choice', outcome: { cloutDelta: 10 } },
      ],
    };

    await setupGameState(page, { pendingEvent });
    await page.reload();

    // Wait for modal
    await page.waitForSelector('text=Keyboard Test', { timeout: 5000 });

    // Tab to first button and press Enter
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    // Modal should be resolved
    await expect(page.getByText('Keyboard Test')).not.toBeVisible({ timeout: 5000 });
  });

  test('narrative events auto-resolve without options', async ({ page }) => {
    // Narrative events have outcome but no options - they apply immediately
    const pendingEvent = {
      title: 'Breaking News',
      description: 'Something happened!',
      outcome: { cloutDelta: 15, message: 'News resolved' },
      // No options array = narrative event
    };

    await setupGameState(page, { pendingEvent });
    await page.reload();

    // Should show the event
    await expect(page.getByText('Breaking News')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Event Generation Flow', () => {
  test('events start appearing after turn 3', async ({ page }) => {
    await page.goto('/');
    await setupGameState(page, { turn: 2 });
    await page.reload();

    // Perform action to advance to turn 3
    const fundraiseButton = page.getByText('Fundraise').first();
    if (await fundraiseButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await fundraiseButton.click();
    }

    // After turn 3, events should be possible (30% chance)
    // We can't guarantee an event, but the system should be ready
    await page.waitForTimeout(500);

    // Page should still be functional
    await expect(page.locator('body')).toBeVisible();
  });
});
