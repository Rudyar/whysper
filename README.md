# Whysper Chrome Extension

Straigth to the point - Voice-dictate into input field on the web.
**Gemini API** — no paid tiers.

I built this because I’m not paying for voice typing. 😎

## ▶️ Usage
Focus any input field on the page
Press Ctrl + Space to start talking
Release the keys to stop dictation
You'll see a small status dot next to the input:

🟢 Green – Ready to listen
🟠 Orange – Processing your voice
🔴 Red – Something went wrong

## 🛠️ Dev Setup

Clone the repo and build the extension:

```bash
git clone https://github.com/yourusername/whysper.git
cd whysper
```

Create a `.env` file at the root with your Gemini API key

```bash
npm install
npm run build
```

Then load the `dist/` folder in Chrome:

1. Go to `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load unpacked**
4. Select the `dist/` folder

## 🧠 Files

- `background.js` – handles background events
- `content.js` – injects dictation logic into pages
- `popup.html` – very minimal UI
- `manifest.json` – extension config
