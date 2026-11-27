'use strict';
const path = require('path'), http = require('http'), fs = require('fs'), { execSync } = require('child_process');
let pw; try { pw = require('playwright'); } catch (e) { pw = require(path.join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'playwright')); }
const DIR = path.resolve(__dirname, '..', 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg' };
const server = http.createServer((req, res) => {
  let url = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (url.endsWith('/')) url += 'index.html';
  const file = path.resolve(DIR, '.' + url);
  if (!file.startsWith(DIR + path.sep) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    try { browser = await pw.chromium.launch({ channel: 'chrome' }); } catch (e) { browser = await pw.chromium.launch(); }
    const context = await browser.newContext({ serviceWorkers: 'block' });
    const page = await context.newPage(), errors = [];
    const sampleRequests = [];
    page.on('request', request => {
      if (request.url().includes('/assets/sounds/packs/') || request.url().includes('/assets/sounds/instruments/')) sampleRequests.push(new URL(request.url()).pathname);
    });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:' + server.address().port, { waitUntil: 'load' });
    const sampleSets = await page.evaluate(() => Object.fromEntries(Object.entries(window.Beats.KITS).map(([id, kit]) => [
      id,
      Object.fromEntries(Object.entries(kit.samples || {}).map(([type, files]) => [type, files]))
    ])));
    const allSampleFiles = [...new Set(Object.values(sampleSets).flatMap(samples => Object.values(samples).flat()))];
    const missingSampleFiles = allSampleFiles.filter(file => !fs.existsSync(path.resolve(DIR, file)));
    if (missingSampleFiles.length) throw new Error('Missing sample assets: ' + missingSampleFiles.join(', '));
    const serviceWorker = fs.readFileSync(path.join(DIR, 'sw.js'), 'utf8');
    const instrumentFiles = ['piano-c4.mp3', 'rhodes-c4.mp3', 'guitar-c4.mp3', 'strings-c4.mp3', 'brass-c4.mp3', 'marimba-c4.mp3', 'flute-c4.mp3']
      .map(file => 'assets/sounds/instruments/' + file);
    if (instrumentFiles.some(file => !serviceWorker.includes(file))) throw new Error('A soundfont instrument is missing from the offline cache.');
    const initialFiles = [...new Set(Object.values(sampleSets.dusty).flat())];
    const sampleResponses = initialFiles.map(file => page.waitForResponse(response => response.url().endsWith('/' + file), { timeout: 10000 }));
    await page.getByRole('tab', { name: /Beats/ }).click();
    const loadedSamples = await Promise.all(sampleResponses);
    if (loadedSamples.some(response => !response.ok())) throw new Error('A sample asset failed to load.');
    await page.locator('#btPro audio').first().waitFor({ timeout: 10000 });
    const loadedSampleFiles = new Set(initialFiles);
    for (const kitId of Object.keys(sampleSets)) {
      const newFiles = [...new Set(Object.values(sampleSets[kitId]).flat())].filter(file => !loadedSampleFiles.has(file));
      const responses = newFiles.map(file => page.waitForResponse(response => response.url().endsWith('/' + file), { timeout: 10000 }));
      await page.locator('#btKit').selectOption(kitId);
      const kitResponses = await Promise.all(responses);
      if (kitResponses.some(response => !response.ok())) throw new Error('A ' + kitId + ' sample failed to load.');
      newFiles.forEach(file => loadedSampleFiles.add(file));
    }

    const selectableSamples = await page.locator('#btSeq .bt-row[data-inst="bombo"] .bt-sample-select option').evaluateAll(options =>
      options.map(option => option.value).filter(Boolean));
    const uniqueSelectableSamples = [...new Set(selectableSamples)];
    const missingSelectableSamples = uniqueSelectableSamples.filter(file => !fs.existsSync(path.resolve(DIR, file)));
    if (uniqueSelectableSamples.length !== 68 || missingSelectableSamples.length) {
      throw new Error('Every bundled sample must be selectable: ' + JSON.stringify({ count: uniqueSelectableSamples.length, missingSelectableSamples }));
    }
    if (uniqueSelectableSamples.some(file => !serviceWorker.includes(file))) throw new Error('A selectable sample is missing from the offline cache.');

    const customKick = 'assets/sounds/packs/01-hard-trap/kicks/hard-kick-03.wav';
    const customKickResponse = page.waitForResponse(response => response.url().endsWith('/' + customKick), { timeout: 10000 });
    await page.locator('#btSeq .bt-row[data-inst="bombo"] .bt-sample-select').selectOption(customKick);
    if (!(await customKickResponse).ok()) throw new Error('The selected custom sample failed to load.');
    await page.waitForFunction(file => window.Beats.estado().rows.find(row => row.inst === 'bombo').sample === file, customKick);
    const selectedSample = await page.evaluate(() => window.Beats.estado().rows.find(row => row.inst === 'bombo').sample);
    if (selectedSample !== customKick) throw new Error('The selected row sample was not stored.');
    const customSampleRender = await page.evaluate(async () => {
      const buffer = await window.Beats.renderBeat(window.Beats.estado(), 1);
      return { duration: buffer.duration, peak: window.Beats.medir(buffer).peak };
    });
    if (customSampleRender.duration < 1 || customSampleRender.peak < 0.005) throw new Error('The selected sample was not used by WAV rendering.');
    await page.locator('#btSave').click();
    const savedSample = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('flowlab_beats'))[0];
      if (!window.Beats.cargar(saved)) throw new Error('The saved custom sample beat could not be loaded.');
      return window.Beats.estado().rows.find(row => row.inst === 'bombo').sample;
    });
    if (savedSample !== customKick) throw new Error('Saving lost the selected row sample.');
    await page.locator('#btSeq .bt-row[data-inst="bombo"] .bt-sample-select').selectOption('');

    await page.locator('#moreFxBeats summary').click();
    await page.locator('#btFxReverb').evaluate(element => {
      element.value = '32';
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const reverbValue = await page.evaluate(() => window.Beats.estado().fx.reverb);
    if (reverbValue !== 32) throw new Error('The reverb control did not update the engine state.');

    const result = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map(element => element.id);
      const scripts = [...document.scripts].filter(script => script.src).map(script => new URL(script.src).pathname);
      const duplicates = values => values.filter((value, index) => values.indexOf(value) !== index);
      const sampleReadyKits = Object.entries(window.Beats.KITS)
        .filter(([, kit]) => ['kick', 'snare', 'hat', 'bass', 'piano', 'rhodes', 'guitar', 'strings', 'brass', 'marimba', 'flute'].every(type => typeof (kit.samples && kit.samples[type]) === 'string'));
      return {
        duplicateIds: duplicates(ids),
        duplicateScripts: duplicates(scripts),
        instrumentCount: Object.keys(window.Beats.INST).length,
        addableInstrumentCount: document.querySelectorAll('#btAddMenu .bt-add-item').length,
        effectControlCount: document.querySelectorAll('#moreFxBeats input[type="range"]').length,
        backingTrackCount: document.querySelectorAll('#btPro audio').length,
        hasLegacySyntheticList: !!window.BeatPresets.items,
        hasProTracks: Array.isArray(window.BeatPresets.pro) && window.BeatPresets.pro.length > 0,
        kitCount: Object.keys(window.Beats.KITS).length,
        sampleReadyKitCount: sampleReadyKits.length
      };
    });
    if (result.duplicateIds.length || result.duplicateScripts.length) throw new Error('The page contains duplicate IDs or script loads.');
    if (result.instrumentCount !== 20 || result.addableInstrumentCount !== 12 || result.effectControlCount !== 4) throw new Error('The full instrument/effect controls are not available: ' + JSON.stringify(result));
    if (!result.backingTrackCount || result.hasLegacySyntheticList || !result.hasProTracks) throw new Error('The remote full-track catalog is not active.');
    if (result.kitCount !== result.sampleReadyKitCount) throw new Error('Every kit must have samples for its core instruments.');
    if (loadedSampleFiles.size !== allSampleFiles.length || allSampleFiles.some(file => !sampleRequests.some(request => request.endsWith('/' + file)))) throw new Error('A sample pack file was not requested.');
    const decodedInstruments = await page.evaluate(async () => {
      const context = window.Studio.ctx();
      const ids = ['piano', 'rhodes', 'guitar', 'strings', 'brass', 'marimba', 'flute'];
      return Promise.all(ids.map(async id => {
        const response = await fetch(window.Beats.KITS.dusty.samples[id]);
        if (!response.ok) throw new Error('Instrument sample failed to load: ' + id);
        const buffer = await context.decodeAudioData(await response.arrayBuffer());
        return { id, duration: buffer.duration, frames: buffer.length };
      }));
    });
    if (decodedInstruments.length !== 7 || decodedInstruments.some(sample => !sample.duration || !sample.frames)) throw new Error('A soundfont instrument sample could not be decoded.');
    const generated = await page.evaluate(() => {
      document.querySelector('#btRandom').click();
      const state = window.Beats.estado(), arrangement = state.arrangement;
      if (!arrangement) return { state, signatures: [], uniqueBars: 0 };
      const signatures = [];
      for (let offset = 0; offset < arrangement.totalSteps; offset += 16) {
        signatures.push(JSON.stringify(arrangement.rows.map(row => [row.inst, row.cells.slice(offset, offset + 16), row.notes.slice(offset, offset + 16)])));
      }
      const row = id => arrangement.rows.find(item => item.inst === id);
      const intro = arrangement.sections[0], drop = arrangement.sections.find(section => section.type === 'drop');
      return {
        state,
        signatures,
        uniqueBars: new Set(signatures).size,
        introHasTexture: ['hat', arrangement.melodyId, 'textura'].some(id => {
          const item = row(id);
          return item && item.cells.slice(intro.startStep, intro.endStep).some(Boolean);
        }),
        introHasDrums: ['bombo', 'caja', 'bajo'].some(id => {
          const item = row(id);
          return item && item.cells.slice(intro.startStep, intro.endStep).some(Boolean);
        }),
        dropHasCore: ['bombo', 'caja', 'bajo'].every(id => {
          const item = row(id);
          return item && item.cells.slice(drop.startStep, drop.endStep).some(Boolean);
        }),
        timelineVisible: !document.querySelector('#btArrangement').classList.contains('hidden'),
        lengthSelectorHidden: document.querySelector('.bt-len').classList.contains('hidden')
      };
    });
    const state = generated.state, arrangement = state.arrangement;
    if (!arrangement) throw new Error('Surpréndeme failed to generate an arrangement: ' + errors.join('; '));
    if (!arrangement || arrangement.durationSeconds !== 150) throw new Error('Surpréndeme did not create a 2:30 arrangement.');
    if (Math.abs(arrangement.totalSteps * 60 / state.bpm / 4 - 150) > 60 / state.bpm / 8) throw new Error('Arrangement steps do not match the requested duration.');
    if (generated.uniqueBars !== generated.signatures.length) throw new Error('The arrangement contains a repeated bar.');
    if (!generated.introHasTexture || generated.introHasDrums || !generated.dropHasCore) throw new Error('The intro/drop structure is incomplete.');
    if (!generated.timelineVisible || !generated.lengthSelectorHidden) throw new Error('The time-based editor controls are not visible: ' + JSON.stringify({ timelineVisible: generated.timelineVisible, lengthSelectorHidden: generated.lengthSelectorHidden, errors }));
    if (arrangement.sections.length < 6 || !arrangement.sections.some(section => section.type === 'build') || !arrangement.sections.some(section => section.type === 'outro')) throw new Error('The arrangement is missing its musical sections.');

    const variations = await page.evaluate(() => {
      const results = [];
      for (let i = 0; i < 6; i++) {
        window.Beats.aleatorio();
        const state = window.Beats.estado(), arrangement = state.arrangement;
        const drop = arrangement.sections.find(section => section.type === 'drop');
        const core = ['bombo', 'caja', 'hat', 'bajo'].map(id => {
          const row = arrangement.rows.find(item => item.inst === id);
          return row ? row.cells.slice(drop.startStep, drop.startStep + 64).map(Boolean) : [];
        });
        const activeMelodies = arrangement.melodyIds.filter(id => {
          const row = arrangement.rows.find(item => item.inst === id);
          return row && row.cells.some(Boolean);
        });
        const leadPalettes = {
          dusty: ['rhodes', 'guitar', 'piano'],
          boombap: ['piano', 'guitar', 'rhodes'],
          trap: ['rhodes', 'strings', 'guitar'],
          drill: ['strings', 'rhodes', 'guitar'],
          dembow: ['piano', 'guitar', 'rhodes'],
          lofi: ['rhodes', 'guitar', 'piano']
        };
        const accentPalettes = {
          dusty: ['ride', 'rim'],
          boombap: ['palmas', 'crash', 'ride'],
          trap: ['hatopen', 'crash'],
          drill: ['rim', 'hatopen'],
          dembow: ['cowbell', 'palmas'],
          lofi: ['ride', 'palmas']
        };
        const activeIds = arrangement.rows.filter(row => row.cells.some(Boolean)).map(row => row.inst);
        const accents = activeIds.filter(id => !['bombo', 'caja', 'hat', 'bajo', arrangement.melodyId].includes(id));
        const kick = arrangement.rows.find(row => row.inst === 'bombo');
        const bass = arrangement.rows.find(row => row.inst === 'bajo');
        const bassKickOverlap = kick.cells.slice(drop.startStep, drop.startStep + 64)
          .filter((level, index) => level && bass.cells[drop.startStep + index]).length;
        results.push({
          kit: state.kit,
          bpm: state.bpm,
          groove: JSON.stringify(core),
          lead: arrangement.melodyId,
          leadMatchesKit: leadPalettes[state.kit].includes(arrangement.melodyId),
          accentMatchesKit: accents.length === 1 && accentPalettes[state.kit].includes(accents[0]),
          melodyCount: activeMelodies.length,
          activeTrackCount: arrangement.rows.filter(row => row.cells.some(Boolean)).length,
          bassKickOverlap,
          maxVolume: Math.max(...state.rows.map(row => row.vol)),
          vinyl: state.fx.vinilo,
          sectionVinyl: arrangement.sections.some(section => section.fx && section.fx.vinilo > 0)
        });
      }
      return results;
    });
    if (variations.some(item => item.melodyCount !== 1 || !item.leadMatchesKit || !item.accentMatchesKit || item.activeTrackCount !== 6 || item.bassKickOverlap < 2 || item.maxVolume > 1 || item.vinyl !== 0 || item.sectionVinyl)) {
      throw new Error('Surpréndeme did not keep its instruments and rhythm coherent: ' + JSON.stringify(variations));
    }
    if (new Set(variations.map(item => item.lead)).size < 3 || variations.some((item, index) => index > 0 && item.lead === variations[index - 1].lead)) {
      throw new Error('Surpréndeme reused the same melodic instruments too often: ' + JSON.stringify(variations));
    }
    if (new Set(variations.map(item => item.groove)).size < 5) throw new Error('Surpréndeme repeated its core groove across generations: ' + JSON.stringify(variations));
    await page.evaluate(() => { document.documentElement.lang = 'en'; });
    await page.waitForFunction(() => document.querySelector('#btArrangementTitle').textContent === 'Arrangement · 2:30');
    await page.evaluate(() => { document.documentElement.lang = 'es'; });
    await page.locator('#btTempo').fill(String(state.bpm + 1));
    await page.locator('#btTempo').press('Enter');
    const retimed = await page.evaluate(() => window.Beats.estado());
    if (retimed.arrangement.durationSeconds !== 150 || Math.abs(retimed.arrangement.totalSteps * 60 / retimed.bpm / 4 - 150) > 60 / retimed.bpm / 8) throw new Error('Changing BPM changed the arrangement duration.');

    await page.locator('#btArrangementSections .bt-arr-section').nth(1).click();
    const beforeEdit = await page.evaluate(() => {
      const state = window.Beats.estado(), start = state.arrangement.selectedStep;
      const hat = state.arrangement.rows.find(row => row.inst === 'hat');
      return { start, value: hat.cells[start] };
    });
    await page.locator('#btSeq .bt-row[data-inst="hat"] .bt-cell').first().click();
    const afterEdit = await page.evaluate(() => {
      const state = window.Beats.estado(), start = state.arrangement.selectedStep;
      return state.arrangement.rows.find(row => row.inst === 'hat').cells[start];
    });
    if (beforeEdit.value === afterEdit) throw new Error('Editing a selected fragment did not update its timeline data.');

    await page.locator('#btSave').click();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('flowlab_beats'))[0]);
    if (!saved.arrangement || saved.arrangement.durationSeconds !== 150) throw new Error('Saving lost the composition timeline.');
    const savedSectionCount = saved.arrangement.sections.length;
    await page.locator('#btAddSection').click();
    const extended = await page.evaluate(() => window.Beats.estado());
    if (extended.arrangement.durationSeconds <= 150 || extended.arrangement.sections.length !== savedSectionCount + 1) throw new Error('Adding time did not create a new section.');
    const roundTrip = await page.evaluate(value => {
      if (!window.Beats.cargar(value)) throw new Error('The saved arrangement could not be loaded.');
      return window.Beats.estado();
    }, saved);
    if (roundTrip.arrangement.durationSeconds !== 150 || roundTrip.arrangement.sections.length !== savedSectionCount) throw new Error('Loading changed the saved arrangement.');

    const shortRender = await page.evaluate(async () => {
      const fixture = window.Beats.estado();
      fixture.bpm = 180; fixture.arrangement.durationSeconds = 1; fixture.arrangement.totalSteps = 16; fixture.arrangement.selectedStep = 0;
      fixture.arrangement.sections = [{ id: 'short', type: 'intro', startStep: 0, endStep: 16 }];
      fixture.arrangement.rows = fixture.arrangement.rows.map(row => ({ inst: row.inst, cells: row.cells.slice(0, 16), notes: row.notes.slice(0, 16) }));
      if (!window.Beats.cargar(fixture)) throw new Error('The short playback fixture could not be loaded.');
      const state = window.Beats.estado();
      const buffer = await window.Beats.renderBeat(state, 4);
      return { duration: buffer.duration, peak: window.Beats.medir(buffer).peak };
    });
    if (Math.abs(shortRender.duration - 1) > 0.01 || shortRender.peak < 0.005) throw new Error('Composition render did not preserve its duration or sound.');

    await page.locator('#btPlay').click();
    await page.waitForFunction(() => window.Beats.reproduciendo());
    await page.waitForTimeout(1600);
    await page.waitForFunction(() => !window.Beats.reproduciendo(), { timeout: 5000 });
    if (errors.length) throw new Error('Browser errors: ' + errors.join('; '));
    console.log('Beats arrangement smoke test passed.');
  } finally {
    if (browser) await browser.close();
    server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
