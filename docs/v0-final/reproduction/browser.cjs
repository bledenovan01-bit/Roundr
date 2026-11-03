const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const [base, fixturesFile, out] = process.argv.slice(2);
const fixtures = JSON.parse(fs.readFileSync(fixturesFile, 'utf8'));
fs.mkdirSync(out, {recursive:true});
(async () => {
  const browser = await chromium.launch({headless:true, channel:process.env.PLAYWRIGHT_CHANNEL || 'chrome'});
  const results = [];
  async function scenario(name, route, run, viewport = {width:320,height:568}, fixture) {
    if(process.env.V0_ROTATION_ONLY && !name.startsWith('rotation-')) return;
    const context = await browser.newContext({viewport});
    const page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await context.addInitScript(f => { Date.now = () => f.now; localStorage.setItem('roundr.welcome.v1','seen'); for(const [k,v] of Object.entries(f.storage))localStorage.setItem(k,v); }, fixture || {now:1793000000000,storage:{}});
    try {
      await page.goto(base + route, {timeout:180000});
      if(route === '/') await page.getByTestId('home-screen').waitFor({timeout:60000});
      else await page.getByRole('heading').first().waitFor({timeout:60000});
      await page.evaluate(() => document.fonts.ready);
      await run(page);
      assert.deepEqual(errors, []);
      const duplicates = await page.evaluate(() => {const ids = [...document.querySelectorAll('[data-testid]')].map(e => e.dataset.testid); return ids.filter((id,i) => ids.indexOf(id) !== i);});
      assert.deepEqual(duplicates, [], name);
      await page.screenshot({path:path.join(out,name+'.png'), fullPage:true});
      results.push({name,passed:true});
      console.log('PASS',name);
    } finally {await context.close();}
  }
  try {
    await scenario('save-name-validation', '/chrono-libre/countdown', async p => {
      await p.getByRole('button',{name:'Enregistrer dans Mes chronos',exact:true}).click();
      const field = p.getByRole('textbox',{name:'Nom du chrono',exact:true});
      await field.waitFor();
      assert.equal(await p.getByText('Donnez un nom à ce chrono.',{exact:true}).count(),0);
      assert(await p.getByRole('button',{name:'Enregistrer',exact:true}).isDisabled());
      await field.fill('Terrain');
      assert(await p.getByRole('button',{name:'Enregistrer',exact:true}).isEnabled());
      await field.fill('');
      await p.getByText('Donnez un nom à ce chrono.',{exact:true}).waitFor();
      await field.fill('Terrain');
      await p.getByRole('button',{name:'Enregistrer',exact:true}).click();
      await p.getByText('« Terrain » est enregistré dans Mes chronos.',{exact:true}).waitFor();
    });
    await scenario('interval-one-and-two-periods', '/chrono-libre/interval', async p => {
      assert.equal(await p.getByText('Repos entre périodes',{exact:true}).count(),0);
      await p.getByRole('button',{name:'Ajouter une période',exact:true}).click();
      await p.getByText('Repos entre périodes',{exact:true}).waitFor();
    });
    await scenario('player-singular-and-draw', '/team-builder', async p => {
      const field = p.getByRole('textbox',{name:'Nom du joueur à ajouter',exact:true});
      await field.fill('Alice'); await p.getByRole('button',{name:'Ajouter le joueur',exact:true}).click();
      assert.equal(await p.getByText(/1 joueurs/).count(),0);
      await p.getByText('1 joueur',{exact:true}).waitFor();
      for(const name of ['Benoît','Chloé','David','Éloïse']) {await field.fill(name); await p.getByRole('button',{name:'Ajouter le joueur',exact:true}).click();}
      await p.getByRole('button',{name:'Mélanger les équipes',exact:true}).click();
      for(const name of ['Alice','Benoît','Chloé','David','Éloïse']) assert.equal(await p.getByRole('button',{name,exact:true}).count(),1);
      assert.equal(await p.locator('[data-testid^="maker-team-"]').count(),2);
    });
    const expired = structuredClone(fixtures.find(f => f.name === 'free-countdown-running-numeric'));
    expired.now += 900000;
    await scenario('expired-countdown-home','/', async p => {
      await p.getByTestId('mode-card-classique').waitFor();
      assert.equal(await p.getByRole('button',{name:'Reprendre la session',exact:true}).count(),0);
      assert.equal(await p.getByText('Session en cours — Chrono libre',{exact:true}).count(),0);
    }, undefined, expired);
    await scenario('paused-countdown-home','/', async p => {
      await p.getByTestId('resume-free-card').waitFor();
    },undefined,fixtures.find(f=>f.name==='free-countdown-paused-numeric'));
    await scenario('finished-countdown-catalogue','/chrono-libre', async p => {
      assert.equal(await p.getByRole('button',{name:'Reprendre le chrono en cours',exact:true}).count(),0);
    },undefined,fixtures.find(f=>f.name==='free-countdown-finished-numeric'));
    for(const mode of ['cup','survie']) for(const view of ['hub','match']) {
      const f = structuredClone(fixtures.find(f => f.name === mode+'-champion'));
      const s = JSON.parse(f.storage['roundr.session.v1']); s.tournamentView = view;
      f.storage['roundr.session.v1'] = JSON.stringify(s);
      await scenario(mode+'-finished-'+view,'/live', async p => {
        assert.equal(await p.getByRole('button',{name:'Interrompre le tournoi',exact:true}).count(),0);
        await p.getByRole('button',{name:'Voir le palmarès',exact:true}).waitFor();
      }, undefined, f);
    }
    for(const width of [320,360,390,430,568,844]) {
      const viewport = {width, height:width>=568?320:844};
      await scenario('countdown-layout-'+width,'/chrono-libre/countdown', async p => {
        const rects = [];
        for(const min of [1,5,10,15,30]) {
          const chip = p.getByRole('button',{name:min+' min',exact:true});
          await chip.scrollIntoViewIfNeeded(); const r = await chip.boundingBox();
          assert(r && r.x >= 0 && r.x+r.width <= width+.5 && r.width>=44 && r.height>=40);
          rects.push(r);
          await chip.click();
          assert.equal(await chip.getAttribute('aria-pressed'),'true');
        }
        assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth > innerWidth),false);
        const launch = p.getByRole('button',{name:'Préparer le chrono',exact:true});
        assert(await launch.isVisible());
      },viewport);
    }
    // Rotate the real live screens in both directions; timestamps/scores must survive.
    for(const mode of ['classique','maracana','cup','survie','free-stopwatch']) {
      const f = fixtures.find(f=>f.name === (mode==='free-stopwatch' ? 'free-stopwatch-paused-numeric' : mode+'-paused'));
      await scenario('rotation-'+mode, f.route, async p => {
        const digits = p.getByTestId(mode==='free-stopwatch'?'free-digits':'match-digits');
        await digits.waitFor();
        const read = () => p.evaluate(()=>({time:document.querySelector('[data-testid="match-digits"],[data-testid="free-digits"]')?.getAttribute('aria-label'),saved:Object.keys(localStorage).filter(k=>k.startsWith('roundr.')).sort().map(k=>[k,localStorage.getItem(k)])}));
        const before = await read();
        for(const v of [{width:568,height:320},{width:844,height:390},{width:320,height:568}]) {
          await p.setViewportSize(v); await p.waitForTimeout(350);
          assert.deepEqual(await read(),before);
          assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth > innerWidth),false);
          const dock = await p.getByTestId(mode==='free-stopwatch'?'free-dock':'match-dock').boundingBox();
          assert(dock && dock.x >= -.5 && dock.y >= -.5 && dock.x+dock.width <= v.width+.5 && dock.y+dock.height <= v.height+.5, mode+' controls remain inside viewport');
          if(v.width>v.height) {
            await digits.scrollIntoViewIfNeeded();
            const clock = await digits.boundingBox();
            assert(clock && clock.y >= 0 && clock.y+clock.height <= dock.y+.5, mode+' clock is reachable above fixed controls');
            await p.screenshot({path:path.join(out,'landscape-'+mode+'-'+v.width+'.png')});
          }
        }
      },undefined,f);
    }
  } finally { await browser.close(); fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2)); }
})().catch(e=>{console.error(e);process.exitCode=1;});
