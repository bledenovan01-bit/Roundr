// Browser QA only. Playwright is an external tool, not an application dependency.
// node focus-regression.cjs <export-directory> <report-directory>
const fs = require('fs'), path = require('path'), http = require('http'), assert = require('assert/strict');
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(process.argv[2]), out = path.resolve(process.argv[3]);
const engine = process.env.PLAYWRIGHT_BROWSER || 'chromium';
fs.mkdirSync(out, { recursive: true });
const pause = page => page.waitForTimeout(250);
async function main() {
  const server = http.createServer((req, res) => {
    let file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) file = path.join(root, 'index.html');
    res.setHeader('Content-Type', ({ '.js': 'application/javascript', '.html': 'text/html', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.png': 'image/png' })[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await playwright[engine].launch({ headless: true, ...(engine === 'chromium' ? { channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' } : {}) });
  const results = [];
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
      for (const mode of ['classique', 'maracana', 'cup', 'survie', 'libre']) {
        console.log('case', mode, viewport.width);
        const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true });
        const page = await context.newPage(), errors = [];
        page.on('pageerror', e => errors.push(String(e)));
        const route = mode === 'libre' ? '/chrono-libre/stopwatch' : '/config/' + mode;
        await page.goto(`http://127.0.0.1:${server.address().port}${route}`);
        const toggle = page.getByRole('switch', { name: mode === 'libre' ? 'Avec équipes' : 'Personnaliser les équipes', exact: true });
        await toggle.waitFor();
        if (await toggle.getAttribute('aria-checked') !== 'true') await toggle.tap();
        // Eight rows make the free-timer form scrollable even on a tall phone.
        if (mode === 'libre') for (let i = 0; i < 6; i++) await page.getByRole('button', { name: "Augmenter le nombre d'équipes", exact: true }).tap();
        const first = page.getByRole('textbox', { name: "Nom de l'équipe 1", exact: true });
        const second = page.getByRole('textbox', { name: "Nom de l'équipe 2", exact: true });
        await first.scrollIntoViewIfNeeded();
        await page.evaluate(() => document.fonts.ready); await pause(page);
        await page.screenshot({ path: path.join(out, `${mode}-${viewport.width}-idle.png`) });
        await first.tap(); await pause(page);
        assert.equal(await first.evaluate(e => e === document.activeElement), true, mode + ': tap must focus');
        await first.evaluate(e => { window.__originalTeamInput = e; });
        const scroll = page.getByTestId('config-scroll');
        const movement = await scroll.evaluate(e => { const before = e.scrollTop; e.scrollTop += before > 30 ? -24 : 24; return e.scrollTop - before; });
        assert.notEqual(movement, 0, 'Test must actually scroll'); await pause(page);
        assert.equal(await first.evaluate(e => e === document.activeElement), true, mode + ': scroll must not blur');
        const card = page.getByTestId(mode === 'libre' ? 'card-Avec équipes' : 'card-Personnaliser les équipes');
        const cardWidth = await card.evaluate(e => e.getBoundingClientRect().width);
        await page.evaluate(() => { Object.defineProperty(window.visualViewport, 'height', { configurable: true, get: () => 260 }); window.visualViewport.dispatchEvent(new Event('resize')); });
        await pause(page);
        assert.equal(await first.evaluate(e => e === document.activeElement && e === window.__originalTeamInput && e.isConnected), true, mode + ': keyboard resize must preserve node/focus');
        assert.equal(await card.evaluate(e => e.getBoundingClientRect().width), cardWidth, mode + ': visual viewport must not change columns');
        await page.screenshot({ path: path.join(out, `${mode}-${viewport.width}-keyboard-resize.png`) });
        await page.evaluate(() => { delete window.visualViewport.height; window.visualViewport.dispatchEvent(new Event('resize')); }); await pause(page);
        const names = ['Équipe Alpha', 'FC Rivière'];
        for (const [input, name] of [[first, names[0]], [second, names[1]]]) {
          await input.tap();
          assert.equal(await input.evaluate(e => e === document.activeElement), true, 'Switching fields must focus the tapped input');
          await input.fill('');
          assert.equal(await input.inputValue(), '');
          for (const char of 'Temp') { await page.keyboard.insertText(char); assert.equal(await input.evaluate(e => e === document.activeElement), true); }
          await input.fill('');
          for (const char of name) { await page.keyboard.insertText(char); assert.equal(await input.evaluate(e => e === document.activeElement), true); }
          assert.equal(await input.inputValue(), name);
        }
        await first.tap(); assert.equal(await first.inputValue(), names[0]);
        assert.equal(await first.evaluate(e => e === window.__originalTeamInput), true, 'Editing must not remount the first input');
        await toggle.tap(); assert.equal(await first.count(), 0, 'OFF intentionally hides inputs');
        await toggle.tap(); assert.equal(await first.inputValue(), names[0]); assert.equal(await second.inputValue(), names[1]);
        // This is a real layout rotation, unlike the visual-only keyboard resize.
        await page.setViewportSize({ width: viewport.height, height: viewport.width }); await pause(page);
        assert.equal(await first.inputValue(), names[0]); assert.equal(await second.inputValue(), names[1]);
        const twoColumns = viewport.height > viewport.width && (viewport.height >= 600 || mode === 'classique' || mode === 'maracana');
        const expectedWidth = twoColumns ? (viewport.height - 52) / 2 : viewport.height - 40;
        assert.equal(await card.evaluate(e => e.getBoundingClientRect().width), expectedWidth, 'Real layout rotation still changes the columns');
        const launch = page.getByTestId(mode === 'libre' ? 'free-prepare' : 'config-launch');
        await launch.tap();
        const key = mode === 'libre' ? 'roundr.free-timer.v1' : 'roundr.session.v1';
        await page.waitForFunction(key => !!localStorage.getItem(key), key);
        const stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
        const teams = mode === 'libre' ? stored.config.teams : stored.teams;
        assert.deepEqual(teams.slice(0, 2).map(t => t.name), names, 'Names must reach the real saved match/timer');
        await page.reload(); await page.waitForTimeout(500);
        const reloaded = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
        assert.deepEqual((mode === 'libre' ? reloaded.config.teams : reloaded.teams).slice(0, 2).map(t => t.name), names);
        assert.deepEqual(errors, []);
        results.push({ mode, viewport, engine, focusOnTap: true, focusOnScroll: true, visualResizeStable: true, sameInputWhileEditing: true, editClearReplaceBothNames: true, switchFields: true, toggleRetainsNames: true, rotateRetainsNames: true, savedAndReloaded: true, errors });
        console.log(mode, viewport.width, 'passed');
        await context.close();
      }
    }
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 2));
  } finally { await browser.close(); server.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
