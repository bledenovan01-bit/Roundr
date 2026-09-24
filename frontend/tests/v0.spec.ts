import { test, expect, type Page } from '@playwright/test';
import { defaultConfig, defaultTeams } from '../src/domain/defaults';
import * as S from '../src/domain/session';
import type { Session, CupConfig } from '../src/domain/types';

async function seed(page: Page, session: Session) {
  await page.goto('/');
  await page.evaluate(s => {
    localStorage.clear();
    localStorage.setItem('roundr.state.v2', JSON.stringify({ version: 2, session: s, lastSummary: null, presets: [] }));
  }, session);
  await page.goto('/live');
  await expect(page.getByTestId('live-screen')).toBeVisible();
}
function classique() { return S.createSession(defaultConfig('classique'), defaultTeams('classique', 2), Date.now()); }

test('score, pause, lock, restart, correction and persisted summary', async ({ page }) => {
  await seed(page, classique());
  await page.getByTestId('goal-0').click();
  await expect(page.getByTestId('score-0')).toHaveText('1');
  await page.getByTestId('live-pause').click();
  await expect(page.getByTestId('live-resume')).toBeVisible();
  await page.getByTestId('live-lock').click();
  const unlock = await page.getByTestId('live-unlock').boundingBox();
  await page.mouse.move(unlock!.x + 10, unlock!.y + 10);
  await page.mouse.down();
  await page.waitForTimeout(950);
  await page.mouse.up();
  await expect(page.getByTestId('live-restart')).toBeVisible();
  page.once('dialog', d => d.accept());
  await page.getByTestId('live-restart').click();
  await expect(page.getByTestId('score-0')).toHaveText('0');
  await page.getByTestId('goal-0').click();
  page.once('dialog', d => d.accept());
  await page.getByTestId('live-end').click();
  await expect(page.getByTestId('transition-panel')).toBeVisible();
  await page.getByTestId('toggle-correct').click();
  await page.getByTestId('ungoal-0').click();
  await expect(page.getByTestId('score-0')).toHaveText('0');
  await page.getByTestId('see-summary').click();
  await expect(page.getByTestId('summary-screen')).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('summary-screen')).toBeVisible();
  await page.getByTestId('summary-home').click();
  await expect(page.getByTestId('home-screen')).toBeVisible();
});

test('Cup successive tie choices survive reload', async ({ page }) => {
  const t = Date.now();
  let s = S.createSession({ ...(defaultConfig('cup') as CupConfig), mode: 'cup', teamCount: 8, groups: 2, qualifiersPerGroup: 2, draw: 'manual' }, defaultTeams('cup', 8), t);
  for (let i = 0; i < 12; i++) { s = S.endManual(s, t); if (i < 11) s = S.launchNext(s, t); }
  await seed(page, s);
  await page.getByTestId('tie-t1').click();
  await page.getByTestId('tie-t2').click();
  await page.getByTestId('tie-confirm').click();
  await expect(page.getByTestId('tie-t5')).toBeVisible();
  await page.reload();
  await page.getByTestId('tie-t5').click();
  await page.getByTestId('tie-t6').click();
  await page.getByTestId('tie-confirm').click();
  await expect(page.getByTestId('tie-choice')).toHaveCount(0);
  await page.getByTestId('launch-next').click();
  await expect(page.getByTestId('live-match-label')).toContainText('Demi');
});

test('offline reload preserves a paused score', async ({ page, context }) => {
  await seed(page, classique());
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await page.getByTestId('goal-1').click();
  await page.getByTestId('live-pause').click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('roundr.state.v2')!).session.live.score[1])).toBe(1);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId('score-1')).toHaveText('1');
  await expect(page.getByTestId('live-resume')).toBeVisible();
});

for (const [width, height] of [[320,568], [360,640], [390,844], [430,932], [320,400]]) {
  test(`controls remain visible at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const s = classique(); s.teams[0].name = 'Olympique du Nord'; s.teams[1].name = 'Les Champions Sud';
    await seed(page, s);
    for (const id of ['live-end', 'live-lock', 'live-restart', 'live-pause']) {
      const box = await page.getByTestId(id).boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
      expect(box!.y + box!.height).toBeLessThanOrEqual(height + 1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `test-results/live-${width}-${height}.png` });
  });
}

