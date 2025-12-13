import { test, expect, Page } from '@playwright/test';

// Helper to set up game state
async function setupGameState(page: Page, overrides: Record<string, unknown> = {}) {
  const stateCodes = [
    "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI",
    "ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN",
    "MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH",
    "OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA",
    "WV","WI","WY"
  ];

  const baseState = {
    turn: 10,
    risk: 20,
    clout: 100,
    funds: 200,
    support: Object.fromEntries(stateCodes.map(code => [code, 50])),
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
    totalFundsEarned: 500,
    totalCloutEarned: 300,
    consecutiveNegativeFunds: 0,
    previousRiskZone: 'SAFE',
    sentiment: { factionMoods: {} },
    recentReactions: [],
    actionCooldowns: {},
    consecutiveActionUses: {},
    newsLog: [],
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
    ...overrides,
  };

  await page.evaluate((state) => {
    localStorage.setItem('gameSave', JSON.stringify(state));
    localStorage.setItem('tutorialState', JSON.stringify(state.tutorial));
  }, baseState);
}

test.describe('Victory Conditions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('victory modal appears when support reaches 80%', async ({ page }) => {
    const stateCodes = [
      "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI",
      "ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN",
      "MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH",
      "OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA",
      "WV","WI","WY"
    ];

    // Set all states to 81% (above victory threshold)
    const highSupport = Object.fromEntries(stateCodes.map(code => [code, 81]));

    await setupGameState(page, {
      victory: true,
      victoryType: 'POPULAR_MANDATE',
      support: highSupport,
    });
    await page.reload();

    // Victory modal should appear
    await expect(page.getByText('VICTORY!')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('You have dominated the culture!')).toBeVisible();
  });

  test('victory modal displays legacy points earned', async ({ page }) => {
    await setupGameState(page, {
      victory: true,
      victoryType: 'POPULAR_MANDATE',
      turn: 25,
      streak: 5,
      highestStreak: 8,
      totalCriticalHits: 10,
    });
    await page.reload();

    // Should show legacy points section
    await expect(page.getByText('VICTORY!')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Legacy Points/)).toBeVisible({ timeout: 5000 });
  });

  test('play again button resets the game', async ({ page }) => {
    await setupGameState(page, { victory: true });
    await page.reload();

    await expect(page.getByText('VICTORY!')).toBeVisible({ timeout: 5000 });

    // Click Play Again
    await page.getByRole('button', { name: /Play Again/i }).click();

    // Victory modal should disappear
    await expect(page.getByText('VICTORY!')).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe('Defeat Conditions', () => {
  test('game over modal appears at 100% risk', async ({ page }) => {
    await setupGameState(page, {
      gameOver: true,
      defeatType: 'RISK_COLLAPSE',
      risk: 100,
    });
    await page.reload();

    await expect(page.getByText('GAME OVER')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Your movement has been neutralized.')).toBeVisible();
  });

  test('try again button resets after game over', async ({ page }) => {
    await setupGameState(page, { gameOver: true, risk: 100 });
    await page.reload();

    await expect(page.getByText('GAME OVER')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: /Try Again/i }).click();

    await expect(page.getByText('GAME OVER')).not.toBeVisible({ timeout: 5000 });
  });

  test('game over shows survival stats', async ({ page }) => {
    await setupGameState(page, {
      gameOver: true,
      turn: 15,
      highestStreak: 4,
    });
    await page.reload();

    await expect(page.getByText('GAME OVER')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Survived 15 turns/)).toBeVisible();
    await expect(page.getByText(/Highest Streak: 4/)).toBeVisible();
  });
});

test.describe('Victory Tracker Component', () => {
  test('victory tracker expands to show all paths', async ({ page }) => {
    await page.goto('/');
    await setupGameState(page);
    await page.reload();

    const tracker = page.locator('[data-testid="victory-tracker"]');
    await tracker.waitFor({ state: 'visible', timeout: 10000 });
    await tracker.click();

    // All victory conditions should be visible
    await expect(page.getByText('Popular Mandate')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Faction Dominance')).toBeVisible();
    await expect(page.getByText('Economic Power')).toBeVisible();
    await expect(page.getByText('Speed Run')).toBeVisible();
  });

  test('victory tracker shows progress percentages', async ({ page }) => {
    await page.goto('/');
    await setupGameState(page, {
      totalFundsEarned: 500,
      totalCloutEarned: 200,
    });
    await page.reload();

    const tracker = page.locator('[data-testid="victory-tracker"]');
    await tracker.waitFor({ state: 'visible', timeout: 10000 });
    await tracker.click();

    // Should show some progress indicators
    await expect(page.getByText('Funds Earned')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Clout Earned')).toBeVisible();
  });
});
