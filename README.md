# FlowLab Open

**A freestyle-rap studio that runs entirely in the browser, with an AI Coach that thinks on your device first and falls back to the cloud.**

FlowLab is plain HTML/CSS/JS (no framework, no bundler, no build step). It lets you write lyrics, record your voice over a beat with real-time effects, build your own beats, and train freestyle with 18 short games. The **AI Coach** is built with **Firebase AI Logic (Hybrid Inference)**: it prefers **Gemini Nano on-device in desktop Chrome** and falls back to a **Gemini model in the cloud** when no local model is available.

> Built for the **#BuildHybridAI** challenge (Google · Firebase · Devpost).
> Live demo (hosted): https://flowlab-open.pages.dev

## Why it matters

- **Privacy first.** Lyrics can be personal. When Chrome has Gemini Nano, the text never leaves the device. When it does not, the app says so ("☁️ Answered in the cloud") and shows a notice before the first use. Audio is **never** sent anywhere.
- **Free and low-friction.** No accounts, no API keys for users. The cloud fallback uses the Gemini Developer API on the free Spark plan, protected by App Check and strict input/output limits.
- **Made for people who learn by doing.** Many young rappers in Latin America write on a phone with no budget for tools. The coach explains in plain words, in **Spanish or English**.
- **Safe by design.** The coach only gives structure, words and ideas (rhymes, uneven lines, ideas, an optional improved version). If a text looks like a personal crisis, it is **not sent to any AI**; the user gets a warm fixed message instead.

## The AI Coach

Open it with the **🤖 AI Coach** button (also **Improve with AI** under the lyrics editor and **Vent with AI** in the School's "Desahógate" game).

| Feature | What the user gets | Output |
|---|---|---|
| **Improve my lyrics** | 4–16 lines in → possible internal rhymes, lines with very uneven syllable counts, 3 ideas to continue, an optional improved version | Structured JSON (schema), rendered as sections |
| **Vent with AI** | Pick an emotion → 5 words, 3 images, a verse opener. Nothing is saved | Structured JSON (schema) |

### How Firebase AI Logic hybrid is used

All the code is in [`public/ai-coach.js`](public/ai-coach.js) (an ES module).

1. **Lazy loading.** The Firebase SDK (v13.4.0, hybrid needs ≥ 12.5.0) is imported with `import()` from `https://www.gstatic.com/firebasejs/13.4.0/…` only when the user presses *Generate* inside the Coach. The page works exactly the same if it is never opened, or if the SDK cannot be loaded (offline).
2. **Hybrid model.**
   ```js
   const ai = getAI(app, { backend: new GoogleAIBackend() });
   const model = getGenerativeModel(ai, {
     mode: InferenceMode.PREFER_ON_DEVICE,
     onDeviceParams: { createOptions: { …, initialPrompts: [{ role: 'system', … }] },
                       promptOptions: { responseConstraint: jsonSchema } },
     inCloudParams:  { model: 'gemini-3.5-flash-lite',
                       generationConfig: { responseMimeType: 'application/json', responseSchema, maxOutputTokens: 800 },
                       systemInstruction }
   });
   model.initializeDeviceModel();            // starts preparing Gemini Nano; never awaited
   const result = await model.generateContent(prompt);
   result.response.inferenceSource           // 'ON_DEVICE' | 'IN_CLOUD'  → shown to the user
   ```
3. **App Check.** On `localhost` the app uses the **debug provider** (`self.FIREBASE_APPCHECK_DEBUG_TOKEN = true`); on a real site it uses **reCAPTCHA Enterprise**. Without a configured key the Coach explains that it is not ready instead of failing silently.
4. **Limits.** One request at a time, 5 s pause between requests, ≤ 1200 input characters (4–16 lines), ≤ 800 output tokens, 60 s timeout.
5. **Safe rendering.** Everything the model returns is validated and shown with `textContent`, never as HTML.
6. **Strict CSP.** No `unsafe-eval`. The only Google origins are: `www.gstatic.com` (SDK), `firebasevertexai.googleapis.com` (AI), `content-firebaseappcheck.googleapis.com` and `www.google.com/recaptcha/` + `www.gstatic.com/recaptcha/` (App Check). See `public/_headers` and the `<meta>` in `public/index.html` (keep both identical).

## What else is in the app

- **Booth** – write lyrics (rhyme finder, syllable counter), record over a YouTube link, an MP3/WAV or a built-in beat, with Auto-Tune (AudioWorklet, PSOLA), effects, mixing and WAV export.
- **Beats** – a synth/sequencer made only with Web Audio (no samples): pads, 6 kits, 25 genre rhythms, WAV export.
- **School** – 18 freestyle games (Univocal, Relámpago, Cadena 4x4, Minuto libre…), BPM/TAP, voice verification (beta), XP and ranks.
- **PWA**, works offline, Spanish/English interface, built-in glossary and "?" help everywhere.

## What was built during the challenge

The app existed before as a private project. During the contest period we added:

- the **AI Coach** with Firebase AI Logic hybrid inference (on-device first, cloud fallback) and App Check;
- the two Coach features above, with schema-constrained JSON output and content/safety rules (including the crisis path that never calls the AI);
- an **ES / EN interface** (`public/i18n.js`) with browser-language suggestion;
- a tightened **CSP** and an updated **privacy page** that explains exactly what leaves the device and when;
- this open-source edition (commercial plans, analytics and personal data removed).

## Run it

No build step. Serve the `public/` folder on **localhost** (microphone and service worker need a secure context):

```bash
npx --yes serve -l 5500 public        # or:  python -m http.server 5500 -d public
```

Open http://localhost:5500.

### Make the Coach work with your own Firebase project

1. Create a Firebase project (Spark plan) and enable **Firebase AI Logic** with the **Gemini Developer API**.
2. Register a web app and paste its config into `FIREBASE_CONFIG` in `public/ai-coach.js` (the web config is public by design; **App Check is what protects the project**).
3. **Local testing:** open the app on `localhost`, press *Generate* once, and copy the line `Firebase App Check debug token: …` from the browser console. Register it in *Firebase console → App Check → Apps → ⋮ → Manage debug tokens*. (You can pin it with `localStorage.setItem('flowlab_appcheck_debug', '<token>')` — never commit it.)
4. **Production:** create a reCAPTCHA Enterprise **score-based web** key (no checkbox), register it as the App Check provider, and set `RECAPTCHA_KEY` in `public/ai-coach.js`.
5. Optional, for the on-device path: desktop **Chrome 139+**, enable `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`, restart, and check `await LanguageModel.availability()` in DevTools. Without it the Coach simply uses the cloud.

### Tests

```bash
npm i -g playwright          # once; the script uses the installed Chrome
node tests/coach.smoke.js
```

The smoke test replaces the Firebase SDK with a fake module (no network, no keys) and checks lazy loading, the privacy notice, the structured result, the "on-device / cloud" badge, request limits, the crisis path, safe rendering and the ES/EN switch.

## Known limits

- On-device inference works only in **desktop Chrome** with Gemini Nano available; elsewhere (Safari/iPhone, Firefox, Android) the Coach uses the cloud. We could not test on a real iPhone.
- On-device hybrid mode is single-turn text only; the cloud model is `gemini-3.5-flash-lite` (the SDK default at v13).
- Firebase AI Monitoring shows no data for on-device requests (documented SDK behavior).
- App Check on a real site needs a reCAPTCHA Enterprise key (not included).
- Voice verification uses the browser's SpeechRecognition (beta; audio handling depends on the browser vendor).
- Only the lyrics-coach and the venting helper use AI; the freestyle games themselves are rule-based.

## License

[Apache License 2.0](LICENSE). See [NOTICE](NOTICE) for third-party components.
