const assert = require('node:assert/strict');
const fs = require('node:fs');
const fixtures = process.argv[3] ? JSON.parse(fs.readFileSync(process.argv[3], 'utf8')) : null;
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.argv[2] || 'http://localhost:8083';
(async () => {
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  const errors = [];
  const dialogs = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('dialog', dialog => { dialogs.push(dialog.message()); void dialog.accept(); });
  const id = name => page.getByTestId(name).last();
  const button = name => page.getByRole('button', { name, exact: true }).last();
  const read = key => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
  const readMatch = () => read('roundr.session.v1');
  const go = pathname => page.goto(base + pathname, { timeout: 120000 });
  const setupMatch = async () => {
    await id('mode-card-classique').click();
    await id('config-launch').click();
    await button('Démarrer').waitFor();
  };
  const stop = async () => {
    await button('Arrêter la session').click();
    await button('Abandonner').click();
    await id('home-screen').waitFor();
  };
  try {
    await go('/');
    await button('Commencer').click({ timeout: 120000 });
    await setupMatch();
    await button('Modifier les réglages').click();
    await button('10 min').click({ delay: 50 });
    await page.waitForFunction(() => document.querySelector('[aria-label="10 min"][aria-pressed="true"]'));
    await id('config-launch').click();
    await button('Démarrer').waitFor();
    assert.equal((await readMatch()).config.totalMin, 10);
    await stop();
    await page.reload();
    await id('home-screen').waitFor();
    assert.equal(await id('resume-session-card').count(), 0);
    console.log('PASS edit and abandon before kickoff, reload');

    await setupMatch();
    await button('Démarrer').click();
    await id('match-goal-0').click();
    await button('Verrouiller').click();
    assert(await id('match-goal-0').isDisabled());
    await button('Déverrouiller').click();
    assert(!(await id('match-goal-0').isDisabled()));
    await button('Afficher le chrono en plein écran').click();
    await id('giant-close').click();
    await id('match-restart').click();
    assert.match(dialogs.at(-1), /Le score et le temps du match actuel seront remis à zéro/);
    await button('Temps remis à zéro · Annuler').click();
    assert.equal((await readMatch()).live.score[0], 1);
    await id('match-restart').click();
    await button('Démarrer').waitFor();
    assert.equal((await readMatch()).live.score[0], 0);
    console.log('PASS explicit lock, restart confirms reset, undo restores goal');

    await button('Retour à l’accueil').click();
    const card = id('mode-card-classique');
    await card.scrollIntoViewIfNeeded();
    const rect = await card.boundingBox();
    const client = await page.context().newCDPSession(page);
    const x = rect.x + rect.width * .8, y = rect.y + rect.height / 2;
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 1; i <= 14; i++) await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - i * 8, y }] });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    assert.equal((await readMatch()).status, 'active');
    await id('abandon-classique').click();
    await id('abandon-classique').waitFor({ state: 'detached' });
    await page.reload();
    await id('home-screen').waitFor();
    assert.equal(await id('resume-session-card').count(), 0);
    console.log('PASS swipe reveals trash, confirm discards durably');

    await id('mode-card-team-builder').click();
    await button('Par nombre').click();
    await id('team-builder-draw').click();
    await page.getByRole('textbox', { name: "Nom de l'équipe 1" }).fill('Tirage du lundi');
    await button('Valider').click();
    await button('Jouer un Match classique').click();
    assert.equal(await page.getByRole('textbox', { name: "Nom de l'équipe 1" }).inputValue(), 'Tirage du lundi');
    console.log('PASS draw to prefilled setup');

    await go('/chrono-libre/countdown');
    await page.getByRole('switch', { name: /équipes/i }).first().click();
    const scoreSwitch = page.getByRole('switch', { name: /^Score$/i });
    if (await scoreSwitch.isVisible() && await scoreSwitch.getAttribute('aria-checked') !== 'true') await scoreSwitch.click();
    await button('Préparer le chrono').click();
    await button('Démarrer').click();
    await page.getByRole('button', { name: /Ajouter un but/ }).first().click();
    await page.getByRole('button', { name: /Retirer un but/ }).first().click();
    assert.equal((await read('roundr.free-timer.v1')).score[0], 0);
    await button('Verrouiller').click();
    assert(await page.getByRole('button', { name: /Ajouter un but/ }).first().isDisabled());
    await button('Déverrouiller').click();
    assert(!(await page.getByRole('button', { name: /Ajouter un but/ }).first().isDisabled()));
    console.log('PASS free score +1 then −1, explicit free timer lock');
    await go('/settings');
    await page.emulateMedia({ colorScheme: 'light' });
    await button('Comme le téléphone').click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('roundr.preferences.v1')).theme === 'system');
    await button('Sons et volume').click();
    await page.getByRole('heading', { name: 'Réglages avancés' }).waitFor();
    console.log('PASS automatic theme preference and visible audio entry');

    await go('/chrono-libre/countdown');
    await button('Enregistrer dans Mes chronos').click();
    await id('free-save-name').fill('Chrono test audit');
    await button('Enregistrer').click();
    await page.getByText('« Chrono test audit » est enregistré dans Mes chronos.').waitFor();
    await go('/chrono-libre');
    await page.getByRole('button', { name: /^Mes chronos/ }).click();
    await button('Supprimer Chrono test audit').click();
    await button('Supprimer').click();
    await button('Chrono supprimé · Annuler').click();
    await button('Supprimer Chrono test audit').waitFor();
    console.log('PASS saved timer deletion and undo');

    if (fixtures) {
      const ready = fixtures.find(fixture => fixture.name === 'maracana-ready');
      const maracana = JSON.parse(ready.storage['roundr.session.v1']);
      maracana.config.launch = 'manual';
      await page.evaluate(value => {
        const prefsKey = 'roundr.preferences.v1';
        const prefs = JSON.parse(localStorage.getItem(prefsKey)) ?? {};
        localStorage.setItem(prefsKey, JSON.stringify({ ...prefs, keepAwake: false, screenSleepVersion: 2, theme: 'light' }));
        localStorage.setItem('roundr.session.v1', JSON.stringify(value));
      }, maracana);
      await go('/live');
      await button('Démarrer').waitFor();
      const [lock, stopAction, edit, scores, dock] = await Promise.all([
        button('Verrouiller').boundingBox(),
        button('Arrêter la session').boundingBox(),
        button('Modifier les réglages').boundingBox(),
        id('match-scoreboard').boundingBox(),
        id('match-dock').boundingBox(),
      ]);
      assert(lock && stopAction && edit && scores && dock);
      assert(Math.abs(lock.y - stopAction.y) < 1 && Math.abs(stopAction.y - edit.y) < 1, 'Match actions share one row');
      assert(scores.y + scores.height <= dock.y + 1, 'Both score cards fit above the dock');
      console.log('PASS compact dock and full score cards in Maracana');
      await button('Démarrer').click();
      await id('match-goal-0').click();
      await id('match-end').click();
      const next = page.getByRole('button', { name: /Lancer le (prochain match|match suivant)/ }).last();
      await next.click();
      await button('Démarrer').click();
      await id('match-goal-1').click();
      await button('Arrêter la session').click();
      await button('Garder les résultats joués').click();
      await page.waitForURL('**/summary');
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('roundr.summary.v1'))?.mode === 'maracana');
      const result = await read('roundr.summary.v1');
      assert.equal(result.matches.filter(match => match.status === 'finished').length, 1);
      console.log('PASS stop Maracana without posting the unfinished match');

      const history = fixtures.find(fixture => fixture.name === 'cup-champion-history');
      await page.evaluate(storage => {
        for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value);
      }, history.storage);
      await go('/history');
      const entry = page.getByTestId(/^history-entry-/).first();
      await entry.getByRole('button', { name: /^Consulter/ }).click();
      await button("Retour à l'historique").click();
      await entry.getByRole('button', { name: /^Supprimer/ }).click();
      await button('Supprimer').click();
      await entry.waitFor({ state: 'detached' });
      await button('Tournoi supprimé · Annuler').click();
      await entry.waitFor();
      await page.reload();
      await entry.waitFor();
      console.log('PASS tournament history detail, deletion and durable undo');
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
