const { test, expect } = require('@playwright/test');

/* ---------- helpers ---------- */

async function startMatch(page, { n0 = 'Alice', n1 = 'Bob', target = 100 } = {}) {
  await page.fill('#name0', n0);
  await page.fill('#name1', n1);
  await page.fill('#targetInput', String(target));
  await page.click('#startBtn');
  await expect(page.locator('#game')).toHaveClass(/shown/);
}

const score = (page, i) => page.locator(`[data-score="${i}"]`);
const hi = (page, i) => page.locator(`[data-hi="${i}"]`);
const breakVal = (page) => page.locator('#breakVal');
const panel = (page, i) => page.locator(`.panel[data-player="${i}"]`);
const act = (page, name) => page.click(`[data-act="${name}"]`);

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html');
});

/* ---------- setup screen ---------- */

test.describe('setup screen', () => {
  test('loads with Rob\'s Gin Bar branding and a running ballpit', async ({ page }) => {
    await expect(page).toHaveTitle(/Rob.s Gin Bar/);
    await expect(page.locator('#setup')).toHaveClass(/shown/);
    await expect(page.locator('.brand-rob')).toHaveText(/Rob/);
    await expect(page.locator('.brand-gin')).toHaveText(/Gin\sBar/);
    await expect(page.locator('.brand-sub')).toHaveText(/Snooker & Billiards/);

    // ballpit canvas is present and has been sized to the viewport
    const size = await page.evaluate(() => {
      const c = document.getElementById('ballpit');
      return { w: c.width, h: c.height };
    });
    expect(size.w).toBeGreaterThan(0);
    expect(size.h).toBeGreaterThan(0);
  });

  test('quick-pick targets and exclusive colour swatches', async ({ page }) => {
    await page.click('.quick .pill[data-target="150"]');
    await expect(page.locator('#targetInput')).toHaveValue('150');

    // pick Red (idx 2) for player 1 -> it becomes selected and is disabled for player 2
    await page.click('.swatches[data-player="0"] .swatch[data-idx="2"]');
    await expect(page.locator('.swatches[data-player="0"] .swatch[data-idx="2"]')).toHaveClass(/sel/);
    await expect(page.locator('.swatches[data-player="1"] .swatch[data-idx="2"]')).toHaveClass(/disabled/);
  });
});

/* ---------- scoring engine ---------- */

test.describe('scoring', () => {
  test('accumulates score, current break and high break', async ({ page }) => {
    await startMatch(page);

    await act(page, 'potRed');   // +3
    await expect(score(page, 0)).toHaveText('3');
    await expect(breakVal(page)).toHaveText('3');

    await act(page, 'potRed');   // +3 -> 6
    await act(page, 'potWhite'); // +2 -> 8
    await act(page, 'inoffRed'); // +3 -> 11
    await act(page, 'cannon');   // +2 -> 13
    await expect(score(page, 0)).toHaveText('13');
    await expect(breakVal(page)).toHaveText('13');
    await expect(hi(page, 0)).toHaveText('13');

    // player 0 is the one at the table
    await expect(panel(page, 0)).toHaveClass(/active/);
    await expect(panel(page, 1)).not.toHaveClass(/active/);
  });

  test('end break switches striker, banks the high break and resets the break', async ({ page }) => {
    await startMatch(page);
    await act(page, 'potRed');
    await act(page, 'potRed'); // break of 6
    await expect(hi(page, 0)).toHaveText('6');

    await act(page, 'endBreak');
    await expect(breakVal(page)).toHaveText('0');
    await expect(score(page, 0)).toHaveText('6');   // score is kept
    await expect(hi(page, 0)).toHaveText('6');       // high break is kept
    await expect(panel(page, 1)).toHaveClass(/active/);

    // a smaller break later does not lower the recorded high break
    await act(page, 'potWhite'); // player 1 makes 2
    await act(page, 'endBreak');
    await act(page, 'potWhite'); // player 0 makes 2
    await expect(hi(page, 0)).toHaveText('6');
  });

  test('foul awards two points to the opponent and passes the turn', async ({ page }) => {
    await startMatch(page);
    await act(page, 'foul');
    await expect(score(page, 1)).toHaveText('2');     // opponent gains 2
    await expect(score(page, 0)).toHaveText('0');
    await expect(breakVal(page)).toHaveText('0');
    await expect(panel(page, 1)).toHaveClass(/active/);
  });

  test('undo reverts the last action and toggles its own enabled state', async ({ page }) => {
    await startMatch(page);
    await expect(page.locator('#undoBtn')).toBeDisabled();

    await act(page, 'potRed');
    await expect(score(page, 0)).toHaveText('3');
    await expect(page.locator('#undoBtn')).toBeEnabled();

    await act(page, 'undo');
    await expect(score(page, 0)).toHaveText('0');
    await expect(breakVal(page)).toHaveText('0');
    await expect(page.locator('#undoBtn')).toBeDisabled();
  });

  test('tapping the other panel before scoring chooses who breaks first', async ({ page }) => {
    await startMatch(page);
    await expect(panel(page, 0)).toHaveClass(/active/);

    await panel(page, 1).click();
    await expect(panel(page, 1)).toHaveClass(/active/);
    await expect(panel(page, 0)).not.toHaveClass(/active/);

    // confirm player 1 is now the striker by scoring
    await act(page, 'potRed');
    await expect(score(page, 1)).toHaveText('3');
  });
});

/* ---------- winning, stats and reset ---------- */

test.describe('end of match', () => {
  test('reaching the target ends the match and shows the summary', async ({ page }) => {
    await startMatch(page, { n0: 'Alice', n1: 'Bob', target: 6 });
    await act(page, 'potRed'); // 3
    await act(page, 'potRed'); // 6 -> reaches target

    const end = page.locator('#end');
    await expect(end).toHaveClass(/show/);
    await expect(page.locator('#endName')).toHaveText(/Alice wins/);
    await expect(page.locator('#endFinal')).toContainText('6');

    // two per-player stat cards and a score-progression chart
    await expect(page.locator('#endStats .stat-card')).toHaveCount(2);
    await expect(page.locator('#endChart svg')).toBeVisible();
    await expect(page.locator('#endLegend .li')).toHaveCount(2);
  });

  test('rematch resets the scores with the same settings', async ({ page }) => {
    await startMatch(page, { n0: 'Alice', n1: 'Bob', target: 6 });
    await act(page, 'potRed');
    await act(page, 'potRed');
    await expect(page.locator('#end')).toHaveClass(/show/);

    await page.click('#rematchBtn');
    await expect(page.locator('#game')).toHaveClass(/shown/);
    await expect(page.locator('#end')).not.toHaveClass(/show/);
    await expect(score(page, 0)).toHaveText('0');
    await expect(page.locator('#targetShow')).toHaveText('6');
  });

  test('new match from the end screen returns to setup', async ({ page }) => {
    await startMatch(page, { target: 6 });
    await act(page, 'potRed');
    await act(page, 'potRed');
    await expect(page.locator('#end')).toHaveClass(/show/);

    await page.click('#newMatchBtn');
    await expect(page.locator('#setup')).toHaveClass(/shown/);
  });

  test('new match button mid-game asks for confirmation', async ({ page }) => {
    await startMatch(page);
    await act(page, 'potRed');

    await act(page, 'newGame');
    await expect(page.locator('#confirm')).toHaveClass(/show/);

    // cancel keeps the game; confirm returns to setup
    await page.click('#confirmNo');
    await expect(page.locator('#confirm')).not.toHaveClass(/show/);
    await expect(page.locator('#game')).toHaveClass(/shown/);

    await act(page, 'newGame');
    await page.click('#confirmYes');
    await expect(page.locator('#setup')).toHaveClass(/shown/);
  });
});

/* ---------- utility controls ---------- */

test.describe('utility controls', () => {
  test('sound pack picker updates the label and mute toggles', async ({ page }) => {
    await startMatch(page);

    await page.click('#packBtn');
    await expect(page.locator('#soundPicker')).toHaveClass(/show/);
    await page.click('.pack-opt[data-pack="jazz"]');
    await expect(page.locator('#packName')).toHaveText('Jazz Age');
    await page.click('#pickerDone');
    await expect(page.locator('#soundPicker')).not.toHaveClass(/show/);

    await page.click('#soundBtn');
    await expect(page.locator('#soundBtn')).toHaveClass(/muted/);
    await page.click('#soundBtn');
    await expect(page.locator('#soundBtn')).not.toHaveClass(/muted/);
  });
});
