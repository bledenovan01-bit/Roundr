// Actual Expo routes and visible controls. No test-only route or store mutation.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '../../..');
require(path.join(root, 'frontend/scripts/register-ts.cjs'));
const S = require(path.join(root, 'frontend/src/domain/session'));
const { lovableLaunchDefaults, lovableConfigTeams } = require(path.join(root, 'frontend/src/features/lovable-config-state'));
const { sessionShareText } = require(path.join(root, 'frontend/src/features/share-summary'));
const { rotationCards, maracanaUpcoming } = require(path.join(root, 'frontend/src/features/match-presentation'));
const [base = 'http://127.0.0.1:8098', out = path.join(__dirname, '../retouches/captures')] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const results = [];
const button = (p, name) => p.getByRole('button', { name, exact: true });
const live = p => p.evaluate(() => JSON.parse(localStorage.getItem('roundr.session.v1')));
const selected = async locator => locator.page().waitForFunction(el => el.getAttribute('aria-pressed') === 'true' || el.getAttribute('aria-selected') === 'true' || el.getAttribute('aria-current') === 'true', await locator.elementHandle());
const advance = (p, ms) => p.evaluate(ms => { window.__roundrNow += ms; }, ms);
const waitText = (p, id, text) => p.waitForFunction(([id, text]) => document.querySelector(`[data-testid="${id}"]`)?.textContent === text, [id, text]);
async function shot(p, name) {
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: path.join(out, name + '.png') });
}
async function theme(p, name) {
  await p.getByTestId('match-lock-settings').click();
  const chip = button(p, name);
  await chip.click();
  await selected(chip);
  await button(p, 'Retour au match').click();
  await p.getByTestId('match-screen').waitFor();
}
async function geometry(p, landscape) {
  const card0 = await p.getByTestId('match-team-card-0').boundingBox();
  const card1 = await p.getByTestId('match-team-card-1').boundingBox();
  assert(card0.x + card0.width < card1.x, 'two separate score cards');
  for (const id of ['match-minus-0', 'match-minus-1', 'match-goal-0', 'match-goal-1']) {
    const rect = await p.getByTestId(id).boundingBox();
    assert(rect.width >= 44 && rect.height >= 44, `${id}: ${JSON.stringify(rect)}`);
  }
  const clock = await p.getByTestId('match-carousel').boundingBox();
  const ring = await p.getByTestId('match-ring').boundingBox();
  const digits = await p.getByTestId('match-digits-ring').boundingBox();
  assert(ring.width >= (landscape ? 126 : 144));
  assert(digits.x >= ring.x && digits.x + digits.width <= ring.x + ring.width + 1);
  assert(landscape ? clock.x + clock.width <= card0.x : clock.y + clock.height <= card0.y);
  assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  return { cards: [card0, card1], clock, ring };
}
(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  async function test(name, run, fixture) {
    if (process.env.FUSION_CASE && !name.includes(process.env.FUSION_CASE)) return;
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] });
    const p = await context.newPage(), errors = [];
    p.on('pageerror', e => errors.push(String(e)));
    p.on('dialog', d => d.accept());
    await context.addInitScript(f => {
      window.__roundrNow = 1800000000000;
      Date.now = () => window.__roundrNow;
      // A fresh user for the full journeys; isolated fixtures for launch policies.
      if (f && !sessionStorage.getItem('fixture-loaded')) {
        localStorage.setItem('roundr.welcome.v1', 'seen');
        localStorage.setItem('roundr.session.v1', JSON.stringify(f));
        sessionStorage.setItem('fixture-loaded', 'yes');
      }
    }, fixture);
    try {
      await p.goto(base + (fixture ? '/live' : '/'), { timeout: 120000 });
      const detail = await run(p);
      assert.deepEqual(errors, []);
      results.push({ name, passed: true, detail });
      console.log('PASS', name);
    } catch (e) {
      await shot(p, 'FAILED-' + name);
      fs.writeFileSync(path.join(out, 'FAILED-' + name + '.txt'), await p.locator('body').innerText());
      throw e;
    } finally {
      fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 2));
      await context.close();
    }
  }
  try {
    await test('classic-theme-continuity-and-share', async p => {
      await button(p, 'Commencer').waitFor();
      await shot(p, 'introduction');
      await button(p, 'Commencer').click();
      await p.getByTestId('home-screen').waitFor();
      await shot(p, 'accueil-sombre');
      await p.getByRole('button', { name: /^Match classique\./ }).click();
      await button(p, '10 min').click(); await selected(button(p, '10 min'));
      await button(p, 'Une période').click(); await selected(button(p, 'Une période'));
      await shot(p, 'configuration-sombre');
      await p.getByTestId('config-launch').click();
      await button(p, 'Démarrer').waitFor();
      await selected(p.getByTestId('match-view-digital')); // numerical remains the default
      await button(p, 'Démarrer').click();
      await advance(p, 18000);
      await p.getByTestId('match-goal-0').click(); await waitText(p, 'match-team-score-0', '1');
      await p.getByTestId('match-goal-0').click(); await waitText(p, 'match-team-score-0', '2');
      await p.getByTestId('match-minus-0').click(); await waitText(p, 'match-team-score-0', '1');
      await p.getByTestId('match-goal-1').click(); await waitText(p, 'match-team-score-1', '1');
      await p.getByTestId('match-view-ring').click(); await selected(p.getByTestId('match-view-ring'));
      await p.getByTestId('match-page-ring').getByRole('button', { name: 'Afficher le temps écoulé' }).click();
      await p.waitForFunction(() => document.querySelector('[data-testid="match-digits-ring"]')?.getAttribute('aria-label') === '00:18.00');
      // Object identity catches the original keyed Fragment remount, not only persistence.
      await p.evaluate(() => { window.__matchRoot = document.querySelector('[data-testid="match-screen"]'); });
      const before = await live(p);
      await p.getByTestId('match-lock-settings').click();
      await advance(p, 7000);
      await button(p, 'Clair').click(); await selected(button(p, 'Clair'));
      await shot(p, 'parametres-clair');
      await button(p, 'Retour au match').click();
      await selected(p.getByTestId('match-view-ring'));
      assert(await p.evaluate(() => window.__matchRoot === document.querySelector('[data-testid="match-screen"]')), 'screen must stay mounted');
      await p.waitForFunction(() => document.querySelector('[data-testid="match-digits-ring"]')?.getAttribute('aria-label') === '00:25.00');
      const after = await live(p);
      assert.deepEqual([after.live.score, after.live.stage, after.live.periodIndex, after.live.chrono], [before.live.score, before.live.stage, before.live.periodIndex, before.live.chrono]);
      assert.equal(await p.getByTestId('match-screen').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(243, 246, 241)');
      await p.getByTestId('match-pause').click();
      await button(p, 'Reprendre').waitFor();
      const paused = await live(p);
      for (const name of ['Sombre', 'Clair']) {
        await theme(p, name);
        await advance(p, 5000);
        await selected(p.getByTestId('match-view-ring'));
        assert.equal(await p.getByTestId('match-digits-ring').getAttribute('aria-label'), '00:25.00');
        assert.deepEqual((await live(p)).live, paused.live);
        await button(p, 'Reprendre').waitFor();
        const suffix = name === 'Sombre' ? 'sombre' : 'clair';
        await shot(p, 'match-circulaire-' + suffix);
        await geometry(p, false);
        await p.setViewportSize({ width: 844, height: 390 });
        await geometry(p, true); await shot(p, 'match-paysage-' + suffix);
        await p.setViewportSize({ width: 320, height: 568 });
        await geometry(p, false); await shot(p, 'match-petit-ecran-' + suffix);
        await p.setViewportSize({ width: 390, height: 844 });
      }
      // Lock is real UI state and all commands must remain protected.
      await p.getByTestId('match-lock-settings').click({ delay: 650 });
      await p.getByRole('button', { name: 'Déverrouiller les commandes' }).waitFor();
      assert(await p.getByTestId('match-goal-0').isDisabled());
      assert(await p.getByTestId('match-pause').isDisabled());
      await selected(p.getByTestId('match-view-ring'));
      await p.getByTestId('match-lock-settings').click({ delay: 650 });
      await button(p, 'Reprendre').click();
      await advance(p, 5000);
      await p.getByTestId('match-end').click();
      await p.getByTestId('result-share').waitFor();
      await shot(p, 'fin-classique-clair');
      const final = await live(p);
      await p.getByTestId('result-share').click();
      await p.getByText('Résumé copié.', { exact: true }).waitFor();
      assert.equal(await p.evaluate(() => navigator.clipboard.readText()), sessionShareText(final));
      await p.getByTestId('result-home').click();
      await p.getByTestId('home-screen').waitFor(); await shot(p, 'accueil-clair');
      await p.reload(); await p.getByTestId('home-screen').waitFor();
      assert.equal(await p.getByTestId('home-screen').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(243, 246, 241)');
      return { correction: '2 → 1 in one tap', runningClock: '18 → 25 seconds through Settings', pausedClock: 25, carousel: 'ring retained both ways', rootRetained: true, shared: true };
    });
    for (const appearance of ['Sombre', 'Clair']) await test('maracana-manual-' + appearance, async p => {
      await button(p, 'Commencer').click();
      await p.getByRole('button', { name: /^Maracana\./ }).click();
      await button(p, 'Le gagnant reste').click(); await selected(button(p, 'Le gagnant reste'));
      await button(p, 'Manuel').click(); await selected(button(p, 'Manuel'));
      await p.getByTestId('config-launch').click(); await button(p, 'Démarrer').click();
      await theme(p, appearance);
      await advance(p, 22000);
      await p.getByTestId('match-goal-0').click(); await waitText(p, 'match-team-score-0', '1');
      await p.getByTestId('match-end').click(); await p.getByTestId('rotation-result').waitFor();
      const first = await live(p), cards = rotationCards(first), up = maracanaUpcoming(first);
      for (const row of cards) assert((await p.getByTestId(`rotation-${row.kind}-${row.team.id}`).innerText()).includes(row.team.name));
      const next = await p.getByTestId('rotation-next').innerText();
      assert(next.includes(up.a.name) && next.includes(up.b.name));
      await shot(p, 'rotation-' + appearance.toLowerCase());
      await button(p, 'Lancer le prochain match').click();
      await button(p, 'Démarrer').waitFor();
      const prepared = await live(p);
      assert.equal(prepared.live.stage, 'ready'); assert.equal(prepared.live.chrono.runningSince, null);
      await advance(p, 11000);
      assert.equal((await live(p)).live.chrono.runningSince, null);
      await button(p, 'Démarrer').click(); await button(p, 'Pause').waitFor();
      await advance(p, 3000);
      await p.getByTestId('match-goal-1').click(); await waitText(p, 'match-team-score-1', '1');
      await p.getByTestId('match-end').click(); await p.getByTestId('rotation-result').waitFor();
      await button(p, 'Terminer la session').click(); await p.getByTestId('result-share').waitFor();
      await p.waitForFunction(() => JSON.parse(localStorage.getItem('roundr.summary.v1'))?.mode === 'maracana');
      const archived = await p.evaluate(() => JSON.parse(localStorage.getItem('roundr.summary.v1')));
      assert.equal(archived.matches.filter(m => m.status === 'finished').length, 2);
      await p.getByTestId('result-share').click(); await p.getByText('Résumé copié.', { exact: true }).waitFor();
      assert.equal(await p.evaluate(() => navigator.clipboard.readText()), sessionShareText(archived));
      await shot(p, 'fin-maracana-' + appearance.toLowerCase());
      return { cards: cards.map(r => [r.kind, r.team.name]), preparedWithoutStarting: true, played: 2, shared: true };
    });
    for (const launch of ['auto', 'delay']) {
      const t = 1800000000000;
      const fixture = S.startReady(S.createSession({ ...lovableLaunchDefaults('maracana'), launch, launchDelaySec: 30, rotation: 'winnerStays' }, lovableConfigTeams('maracana', 5), t), t);
      await test('maracana-launch-' + launch, async p => {
        await p.getByTestId('match-end').waitFor();
        const id = (await live(p)).live.matchId;
        await p.getByTestId('match-goal-0').click(); await waitText(p, 'match-team-score-0', '1');
        await p.getByTestId('match-end').click();
        if (launch === 'delay') {
          await p.getByTestId('match-launch-countdown').waitFor();
          await advance(p, 29000); assert.equal((await live(p)).live.matchId, id);
          await advance(p, 1000);
        }
        await p.waitForFunction(id => { const s = JSON.parse(localStorage.getItem('roundr.session.v1')); return s?.live.matchId !== id && s?.live.chrono.runningSince !== null; }, id);
        await button(p, 'Pause').waitFor();
        return { nextMatchRunning: true, launch };
      }, fixture);
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
