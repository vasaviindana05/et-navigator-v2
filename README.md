# ET Navigator ⚡
### AI-Powered Financial News Intelligence Platform
> Built for **ET Gen AI Hackathon — Phase 2: Build Sprint**

**Live Demo:** [et-navigator2.vercel.app](https://et-navigator2.vercel.app)  
**GitHub:** [vasaviindana05/et-navigator-v2](https://github.com/vasaviindana05/et-navigator-v2)

---

## 🎯 What is ET Navigator?

ET Navigator is an AI-powered financial news intelligence platform that delivers instant, personalized briefings from **The Economic Times** — with real-time market data, sentiment analysis, and investor impact insights.

Instead of spending 30 minutes reading dozens of articles, users get a **3-sentence AI briefing in under 3 seconds** — powered by Groq's LLaMA 3.1 model.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| ⚡ **AI News Briefing** | 3-sentence Groq LLM summary — straight to facts, no fluff |
| 📊 **Live Market Ticker** | Real-time Nifty, Sensex, Gold, USD/INR — updates every 4 seconds |
| 🔴 **Breaking News Banner** | Rotating live ET headlines with pulsing LIVE badge |
| 📈 **Sentiment Analysis** | AI-driven Positive / Negative / Neutral badge on every search |
| 💼 **Investor Impact** | One-sentence AI insight on how news affects traders |
| 🔍 **Follow-up Questions** | 3 AI-generated questions for deeper topic exploration |
| 💬 **Ask Anything** | Inline conversational Q&A — ask any finance question |
| 🔖 **Smart Bookmarks** | Per-user bookmark storage via Clerk auth |
| 📱 **Mobile Responsive** | 1-column on mobile, 3-column on desktop |
| 🧭 **Market Mood Widget** | Fear/Greed indicator in the sidebar |

---

## 🏗️ Architecture

```
User Browser (React App)
        │
        ├──► Clerk Auth (Google OAuth) — Authentication
        │
        ├──► ET RSS Feeds (via CORS Proxy Fallbacks) — News Data
        │         └── allorigins.win → corsproxy.io → thingproxy (fallbacks)
        │
        ├──► Groq API (LLaMA 3.1 8B) — AI Briefings
        │         ├── News Summarizer Agent
        │         ├── Sentiment + Investor Impact Agent (parallel)
        │         └── Follow-up Questions Agent (parallel)
        │
        └──► Unsplash API — Article Images

Deployed on: Vercel (Frontend + Serverless Functions + CDN)
```

### Agent Roles

| Agent | Role |
|-------|------|
| **News Fetcher Agent** | Fetches ET RSS feeds via CORS proxy fallbacks. Parses XML to extract articles. |
| **AI Summarizer Agent** | Sends article context to Groq LLM. Returns 3-sentence briefing. |
| **Insights Agent** | Parallel Groq call for sentiment + investor impact JSON. |
| **Follow-up Agent** | Generates 3 follow-up questions from summary. Returns JSON array. |
| **Image Agent** | Calls Unsplash per article using first 4 title words. Falls back to category image. |

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | React.js (CRA) | Component-based UI, fast re-renders for live data |
| **AI / LLM** | Groq API (LLaMA 3.1 8B) | Free tier, ultra-fast inference for briefings |
| **Auth** | Clerk | Google OAuth, per-user sessions, easy integration |
| **Styling** | CSS-in-JS (inline styles) | No external dependencies, full dark theme control |
| **Images** | Unsplash API | Free high-quality news-relevant images |
| **Deploy** | Vercel | Zero-config deploy, CDN, serverless functions |

### npm Packages
```json
{
  "react": "^18.x",
  "react-dom": "^18.x",
  "react-scripts": "5.x",
  "@clerk/clerk-react": "latest"
}
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm
- Vercel CLI (`npm install -g vercel`)

### 1. Clone the repo
```bash
git clone https://github.com/vasaviindana05/et-navigator-v2.git
cd et-navigator-v2
npm install
```

### 2. Set up environment variables
Create a `.env` file in the root:
```env
REACT_APP_GROQ_KEY=your_groq_api_key
REACT_APP_UNSPLASH_KEY=your_unsplash_api_key
REACT_APP_CLERK_PUBLISHABLE_KEY=your_clerk_key
DISABLE_ESLINT_PLUGIN=true
```

Get your free keys:
- Groq: [console.groq.com](https://console.groq.com)
- Unsplash: [unsplash.com/developers](https://unsplash.com/developers)
- Clerk: [clerk.com](https://clerk.com)

### 3. Run locally
```bash
vercel dev
```

### 4. Deploy to production
```bash
vercel --prod
```

---

## 📁 Project Structure

```
et-navigator-v2/
├── api/
│   ├── claude.js       # Anthropic API proxy (serverless)
│   └── feed.js         # RSS feed proxy (serverless)
├── public/
│   ├── index.html
│   └── et-logo.jpg
├── src/
│   ├── App.js          # Main application (all components)
│   ├── App.css         # Global styles
│   └── index.js        # Entry point
├── .gitignore
├── package.json
├── vercel.json         # Vercel configuration
└── README.md
```

---

## 🔒 Security

- API keys stored as **Vercel environment variables** — never exposed in client-side code
- CORS handled via **serverless proxy functions** in `/api`
- Authentication secured via **Clerk** with Google OAuth
- `.env` file excluded from Git via `.gitignore`

---

## 📊 Impact

| Metric | Value |
|--------|-------|
| **Time to briefing** | < 3 seconds |
| **Articles analyzed** | 9+ per search |
| **Cost to users** | Free |
| **Platforms** | Web + Mobile |
| **News sources** | ET RSS (Top News, Markets, Tech, Wealth) |

---

## 👤 About

**Name:** Gnana Vasavi Indana  
**Major:** Computer Science  
**Batch:** 2023–2027  
**Team:** RAHU (Individual Participation)  
**Hackathon:** ET Gen AI Hackathon — Phase 2: Build Sprint

---

## 📄 License

This project was built for the ET Gen AI Hackathon. All news content belongs to The Economic Times.
