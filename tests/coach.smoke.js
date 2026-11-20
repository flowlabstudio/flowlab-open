'use strict';
/* FlowLab Open · smoke test of the AI Coach. No network and no keys: the Firebase SDK is replaced by a fake module.
   Usage:  npm i -g playwright   (once)   then   node tests/coach.smoke.js */
const path = require('path'), http = require('http'), fs = require('fs'), { execSync } = require('child_process');
let pw; try { pw = require('playwright'); } catch (e) { pw = require(path.join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'playwright')); }
const DIR = path.join(__dirname, '..', 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html'; const f = path.join(DIR, u); if (!f.startsWith(DIR) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
const FAKE = {
  'firebase-app.js': 'export const initializeApp=c=>({c});',
  'firebase-app-check.js': 'export const initializeAppCheck=()=>{};export class ReCaptchaEnterpriseProvider{}',
  'firebase-ai.js': 'export class GoogleAIBackend{}; export const InferenceMode={PREFER_ON_DEVICE:"prefer_on_device"}; const m=()=>({}); export const Schema={object:m,array:m,string:m,integer:m}; export const getAI=()=>({}); export const getGenerativeModel=(ai,p)=>({initializeDeviceModel(){},async generateContent(prompt){(globalThis.__calls=globalThis.__calls||[]).push(prompt);const M=globalThis.__mock;return {response:{text:()=>M.texto,inferenceSource:M.src}};}});'
};
const out = []; const ok = (c, m) => { out.push((c ? '✅ ' : '❌ ') + m); };
(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); const url = 'http://127.0.0.1:' + srv.address().port + '/';
  let b; try { b = await pw.chromium.launch({ channel: 'chrome' }); } catch (e) { b = await pw.chromium.launch(); }
  const p = await b.newPage(); const errs = [], sdk = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/datamuse|ERR_FAILED/i.test(m.text())) errs.push(m.text()); });
  await p.route('https://www.gstatic.com/firebasejs/**', r => { sdk.push(r.request().url()); r.fulfill({ status: 200, contentType: 'text/javascript', body: FAKE[r.request().url().split('/').pop()] || '' }); });
  await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(600);
  ok(sdk.length === 0, 'the Firebase SDK is NOT loaded with the page');
  await p.click('#btnCoach'); ok(/Google/.test(await p.textContent('#coachAviso')), 'the privacy notice is shown before first use'); ok(sdk.length === 0, 'opening the Coach does not load the SDK');
  await p.click('#coachEntendido');
  const J = { rimasInternas: ['abajo / alto'], lineasDesparejas: [{ linea: 2, motivo: 'long line' }], ideas: ['a', 'b', 'c'], versionMejorada: 'x' };
  await p.evaluate(j => { globalThis.__mock = { texto: JSON.stringify(j), src: 'ON_DEVICE' }; window.Coach._limites.pausaMs = 300; }, J);
  await p.fill('#coachTexto', 'one\ntwo\nthree\nfour'); await p.click('#coachGoLetra'); await p.waitForSelector('#coachDonde:not(.hidden)');
  ok(sdk.length === 3, 'the SDK is requested only after pressing Generate'); ok(/🟢/.test(await p.textContent('#coachDonde')), 'the result says it ran on the device');
  ok(await p.evaluate(() => document.querySelectorAll('#coachResultado .coach-sec').length) === 4, 'the structured result is rendered in 4 sections');
  await p.waitForTimeout(350); const n = await p.evaluate(() => globalThis.__calls.length);
  await p.fill('#coachTexto', 'bad day\nI cannot go on\nI want to die\nno one hears'); await p.click('#coachGoLetra'); await p.waitForSelector('.coach-crisis');
  ok(await p.evaluate(() => globalThis.__calls.length) === n, 'a crisis text is NOT sent to the AI');
  await p.selectOption('#langSel', 'en'); ok((await p.textContent('#btnCoach')).includes('AI Coach'), 'the interface switches to English');
  ok(errs.length === 0, 'no console errors ' + JSON.stringify(errs));
  console.log(out.join('\n')); await b.close(); srv.close(); process.exit(out.some(x => x.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.log(out.join('\n')); console.error('FAILED', e); process.exit(1); });
