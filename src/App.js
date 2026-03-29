import { useState, useEffect } from 'react';
import {
  SignedIn, SignedOut, SignInButton, SignOutButton, useUser,
} from '@clerk/clerk-react';
import './App.css';

const UNSPLASH_KEY = process.env.REACT_APP_UNSPLASH_KEY;

const CATEGORY_FEEDS = {
  'Home':    'https://economictimes.indiatimes.com/rssfeedsdefault.cms',
  'Markets': 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
  'Tech':    'https://economictimes.indiatimes.com/tech/rssfeeds/13357270.cms',
  'Wealth':  'https://economictimes.indiatimes.com/wealth/rssfeeds/837555174.cms',
};

const CATEGORY_IMAGES = {
  'Markets': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400',
  'Tech':    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
  'Wealth':  'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400',
  'Home':    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400',
};

const PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://thingproxy.freeboard.io/fetch/${url}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

const NAV_LINKS = ['Home', 'Markets', 'Tech', 'Wealth', 'IPO', 'News', 'Industry', 'Politics', 'AI', 'Opinion'];

const BREAKING = [
  "War's rising bill: Not just oil, India's growth may face the heat",
  'FIIs sell Indian equities worth ₹1.14 lakh crore in March 2026',
  'Dalal Street Week Ahead: Avoid aggressive long positions',
  'RBI holds repo rate at 6.5% for seventh consecutive meeting',
  'India GDP growth forecast revised to 7.2% for FY25',
];

const INDICES = [
  { name: 'Nifty 50',   base: 22450, change: -0.43 },
  { name: 'BSE Sensex', base: 73583, change: -0.37 },
  { name: 'Nifty Bank', base: 52274, change: -0.28 },
  { name: 'Nifty IT',   base: 34983, change: +1.21 },
  { name: 'Gold',       base: 71850, change: +0.43 },
  { name: 'USD/INR',    base: 83.42, change: -0.12 },
];

const TOP_GAINERS = [
  { name: 'HEG',             price: 572.30,  change: +13.80, vol: '4.73Cr' },
  { name: 'OneSource Spec.', price: 1447.00, change: +8.48,  vol: '8.40L'  },
  { name: 'Graphite India',  price: 640.20,  change: +7.47,  vol: '1.60Cr' },
  { name: 'ACME Solar',      price: 269.41,  change: +6.02,  vol: '1.22Cr' },
  { name: 'Apar Industries', price: 10608,   change: +5.94,  vol: '3.12L'  },
];

function getIndices() {
  return INDICES.map(s => {
    const v = (Math.random() - 0.5) * 0.1;
    const change = +(s.change + v).toFixed(2);
    const price = +(s.base * (1 + change / 100)).toFixed(2);
    return { ...s, price, change };
  });
}

async function callAI(prompt, maxTokens = 400) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.REACT_APP_GROQ_KEY}` },
    body: JSON.stringify({ model: 'llama-3.1-8b-instant', max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] }),
  });
  const data = await res.json();
  if (!data.choices?.[0]) throw new Error(data.error?.message || 'AI error');
  return data.choices[0].message.content;
}

async function fetchWithFallback(feedUrl) {
  for (const makeProxy of PROXIES) {
    try {
      const res = await fetch(makeProxy(feedUrl), { signal: AbortSignal.timeout(6000) });
      if (!res.ok) continue;
      const text = await res.text();
      if (text.includes('<item>')) return text;
    } catch { continue; }
  }
  return null;
}

async function getUnsplashImage(title, category) {
  try {
    const q = encodeURIComponent(title.split(' ').slice(0, 4).join(' '));
    const res = await fetch(`https://api.unsplash.com/search/photos?query=${q}&per_page=1&client_id=${UNSPLASH_KEY}`);
    const data = await res.json();
    return data.results?.[0]?.urls?.small || CATEGORY_IMAGES[category] || CATEGORY_IMAGES['Home'];
  } catch { return CATEGORY_IMAGES[category] || CATEGORY_IMAGES['Home']; }
}

function Ticker({ stocks }) {
  return (
    <div style={{ background: '#0a0a0a', borderBottom: '1px solid #cc0000', padding: '5px 0', overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: '40px', animation: 'ticker 30s linear infinite', whiteSpace: 'nowrap', width: 'max-content' }}>
        {[...stocks, ...stocks].map((s, i) => (
          <span key={i} style={{ fontSize: '11px', fontFamily: 'monospace', display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ color: '#aaa', fontWeight: 600 }}>{s.name}</span>
            <span style={{ color: '#fff', fontWeight: 700 }}>{s.price.toLocaleString('en-IN')}</span>
            <span style={{ color: s.change >= 0 ? '#00ff88' : '#ff4444', background: s.change >= 0 ? '#00ff8820' : '#ff444420', padding: '1px 6px', borderRadius: '4px', fontSize: '10px' }}>
              {s.change >= 0 ? '▲' : '▼'} {Math.abs(s.change)}%
            </span>
          </span>
        ))}
      </div>
      <style>{`@keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
    </div>
  );
}

function LoginPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#1a1a1a', border: '1px solid #cc0000', borderRadius: '12px', padding: '40px 32px', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 0 40px rgba(204,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <span style={{ background: '#cc0000', color: '#fff', fontWeight: 900, fontSize: '28px', padding: '4px 10px', fontFamily: 'serif' }}>ET</span>
          <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'serif', color: '#fff' }}>The Economic Times</span>
        </div>
        <p style={{ color: '#888', fontSize: '13px', marginBottom: '32px' }}>Sign in to get AI-powered news briefings</p>
        <SignInButton mode="modal">
          <button style={{ width: '100%', background: '#1f1f1f', border: '1px solid #333', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#e0e0e0' }}>
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>
        </SignInButton>
      </div>
    </div>
  );
}

function NewsApp() {
  const { user } = useUser();
  const bookmarkKey = `et_bookmarks_${user?.id}`;

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [articles, setArticles]             = useState([]);
  const [topic, setTopic]                   = useState('');
  const [result, setResult]                 = useState('');
  const [followUps, setFollowUps]           = useState([]);
  const [loading, setLoading]               = useState(false);
  const [activeNav, setActiveNav]           = useState('Home');
  const [bookmarks, setBookmarks]           = useState([]);
  const [sentiment, setSentiment]           = useState('');
  const [investorImpact, setInvestorImpact] = useState('');
  const [showBookmarks, setShowBookmarks]   = useState(false);
  const [indices, setIndices]               = useState(getIndices());
  const [breakingIdx, setBreakingIdx]       = useState(0);
  const [dateStr, setDateStr]               = useState('');
  const [copiedIndex, setCopiedIndex]       = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setIndices(getIndices()), 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setBreakingIdx(i => (i + 1) % BREAKING.length), 4500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setDateStr(
        now.toLocaleDateString('en-US', { weekday: isMobile ? 'short' : 'long', year: 'numeric', month: isMobile ? 'short' : 'long', day: 'numeric' }) +
        ' | ' +
        now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })
      );
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [isMobile]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (user?.id) {
      try { setBookmarks(JSON.parse(localStorage.getItem(bookmarkKey) || '[]')); } catch { setBookmarks([]); }
    }
  }, [user?.id]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (user?.id) localStorage.setItem(bookmarkKey, JSON.stringify(bookmarks));
  }, [bookmarks, user?.id]);

  const toggleBookmark = (article) => {
    setBookmarks(prev => prev.find(b => b.url === article.url) ? prev.filter(b => b.url !== article.url) : [...prev, article]);
  };
  const isBookmarked = (a) => bookmarks.some(b => b.url === a.url);
  const handleShare = (article, index) => {
    if (navigator.share) navigator.share({ title: article.title, url: article.url });
    else { navigator.clipboard.writeText(article.url); setCopiedIndex(index); setTimeout(() => setCopiedIndex(null), 2000); }
  };

  const generateFollowUps = async (t, s) => {
    try {
      const text = await callAI(`Based on news about "${t}": "${s}" — generate exactly 3 short follow-up questions. Return ONLY a JSON array of 3 strings.`, 300);
      setFollowUps(JSON.parse(text.trim()));
    } catch { setFollowUps([]); }
  };

  const generateInsights = async (t, s) => {
    try {
      const text = await callAI(`Based on news about "${t}": "${s}" — return ONLY JSON: {"sentiment":"Positive"/"Negative"/"Neutral","investorImpact":"one sentence"}`, 200);
      const p = JSON.parse(text.trim().replace(/```json|```/g, ''));
      setSentiment(p.sentiment || ''); setInvestorImpact(p.investorImpact || '');
    } catch {}
  };

  const fetchNews = async (searchTopic, category) => {
    setResult(''); setArticles([]); setFollowUps([]); setSentiment(''); setInvestorImpact('');
    setLoading(true);
    try {
      const feeds = searchTopic.trim() ? Object.values(CATEGORY_FEEDS) : [CATEGORY_FEEDS[category] || CATEGORY_FEEDS['Home']];
      const allTexts = await Promise.all(feeds.map(url => fetchWithFallback(url)));
      let allItems = []; const seen = new Set();
      allTexts.forEach(text => {
        if (!text) return;
        Array.from(new DOMParser().parseFromString(text, 'text/xml').querySelectorAll('item')).forEach(item => {
          const title = item.querySelector('title')?.textContent || '';
          if (!seen.has(title)) { seen.add(title); allItems.push(item); }
        });
      });
      if (!allItems.length) { setResult('Could not load feed.'); setLoading(false); return; }
      const kw = searchTopic.toLowerCase();
      const filtered = searchTopic.trim()
        ? allItems.filter(item => {
            const t = item.querySelector('title')?.textContent || '';
            const d = item.querySelector('description')?.textContent || '';
            return t.toLowerCase().includes(kw) || d.toLowerCase().includes(kw);
          }).slice(0, 9)
        : allItems.slice(0, 9);
      if (!filtered.length) { setResult(`No articles found for "${searchTopic}".`); setLoading(false); return; }
      const mapped = await Promise.all(filtered.map(async item => {
        const descRaw = item.querySelector('description')?.textContent || '';
        const imgMatch = descRaw.match(/<img[^>]+src=["']([^"']+)["']/i);
        const mediaUrl = item.getElementsByTagNameNS('*', 'content')[0]?.getAttribute('url') || '';
        let image = mediaUrl || (imgMatch ? imgMatch[1] : '');
        const title = item.querySelector('title')?.textContent || '';
        if (!image) image = await getUnsplashImage(title, category);
        const link = item.querySelector('link')?.nextSibling?.textContent || item.querySelector('guid')?.textContent || '#';
        const description = descRaw.replace(/<[^>]+>/g, '').slice(0, 160);
        return { title, description, url: link, image };
      }));
      setArticles(mapped);
      if (searchTopic.trim()) {
        const articlesText = mapped.map((a, i) => `${i + 1}: ${a.title}. ${a.description}`).join('\n');
        const summary = await callAI(
          `Summarize these articles about "${searchTopic}" in 3 sentences. Do NOT start with any intro phrase. Jump straight into the facts:\n\n${articlesText}`,
          400
        );
        setResult(summary);
        await Promise.all([generateFollowUps(searchTopic, summary), generateInsights(searchTopic, summary)]);
      }
    } catch (e) { setResult('Error: ' + e.message); }
    finally { setLoading(false); }
  };

  const handleNav = (nav) => { setActiveNav(nav); setTopic(''); setShowBookmarks(false); if (CATEGORY_FEEDS[nav]) fetchNews('', nav); };
  const handleSearch = () => topic.trim() && fetchNews(topic, activeNav);

  const handleFollowUp = async (q) => {
    setResult(''); setFollowUps([]); setSentiment(''); setInvestorImpact(''); setLoading(true);
    try {
      const a = await callAI(`Answer this finance question in 4-5 sentences. Jump straight into the answer: ${q}`, 400);
      setResult(a);
      await Promise.all([generateFollowUps(q, a), generateInsights(q, a)]);
    } catch (e) { setResult('Error: ' + e.message); }
    finally { setLoading(false); }
  };

  const handleAskAnything = async (q) => {
    setResult(''); setFollowUps([]); setSentiment(''); setInvestorImpact(''); setLoading(true);
    try {
      const a = await callAI(`Answer this finance question in 4-5 sentences. Jump straight into the answer: ${q}`, 400);
      setResult(a);
      await Promise.all([generateFollowUps(q, a), generateInsights(q, a)]);
    } catch (e) { setResult('Error: ' + e.message); }
    finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchNews('', 'Home'); }, []);

  const displayArticles = showBookmarks ? bookmarks : articles;
  const sentimentColor = sentiment === 'Positive' ? '#00ff88' : sentiment === 'Negative' ? '#ff4444' : '#ffaa00';
  const sentimentIcon  = sentiment === 'Positive' ? '📈' : sentiment === 'Negative' ? '📉' : '➡️';

  return (
    <div style={{ background: '#0d0d0d', minHeight: '100vh', color: '#e0e0e0' }}>
      <style>{`
        @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes glowbar{0%{background-position:0%}100%{background-position:200%}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes shimmer{0%,100%{opacity:1}50%{opacity:0.4}}
      `}</style>

      <Ticker stocks={indices} />

      {/* Breaking News */}
      <div style={{ background: 'linear-gradient(90deg,#cc0000,#ff2200)', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ background: '#fff', color: '#cc0000', fontWeight: 800, fontSize: '10px', padding: '2px 7px', borderRadius: '3px', letterSpacing: '1px', flexShrink: 0, animation: 'pulse 1.5s infinite' }}>LIVE</span>
        <span style={{ color: '#fff', fontSize: isMobile ? '11px' : '13px', fontWeight: 600, fontFamily: 'sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🔴 {BREAKING[breakingIdx]}</span>
      </div>

      {/* Header */}
      <div style={{ background: '#111', borderBottom: '3px solid #cc0000', padding: isMobile ? '8px 12px' : '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 20px rgba(204,0,0,0.3)' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ background: '#cc0000', color: '#fff', fontWeight: 900, fontSize: isMobile ? '18px' : '22px', padding: '3px 8px', borderRadius: '4px', fontFamily: 'serif' }}>ET</span>
          {!isMobile && <span style={{ fontWeight: 700, fontSize: '16px', color: '#fff', fontFamily: 'serif' }}>The Economic Times</span>}
        </div>

        {/* Clock */}
        <div style={{ background: '#1a1a1a', border: '1px solid #cc0000', borderRadius: '20px', padding: '4px 10px', fontSize: isMobile ? '10px' : '12px', color: '#e0e0e0', fontFamily: 'monospace' }}>
          {dateStr}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <input type="text" placeholder={isMobile ? 'Search...' : 'Search news...'} value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', padding: '6px 10px', color: '#e0e0e0', fontSize: '13px', outline: 'none', width: isMobile ? '110px' : '180px', fontFamily: 'sans-serif' }}
          />
          <button onClick={handleSearch} style={{ background: 'linear-gradient(135deg,#cc0000,#ff2200)', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>
            ⚡ {isMobile ? '' : 'Brief Me'}
          </button>
          <button onClick={() => setShowBookmarks(!showBookmarks)} style={{ background: showBookmarks ? '#cc0000' : 'transparent', border: '1px solid #cc0000', color: showBookmarks ? '#fff' : '#cc0000', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
            🔖 {bookmarks.length}
          </button>
          {user?.imageUrl && <img src={user.imageUrl} alt={user.firstName} style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #cc0000' }} />}
          {!isMobile && <span style={{ color: '#e0e0e0', fontSize: '13px', fontWeight: 600 }}>{user?.firstName}</span>}
          <SignOutButton>
            <button style={{ background: 'transparent', border: '1px solid #444', color: '#aaa', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '11px' }}>
              {isMobile ? '↩' : 'Sign Out'}
            </button>
          </SignOutButton>
        </div>
      </div>

      {/* Nav */}
      <div style={{ background: '#161616', borderBottom: '1px solid #2a2a2a', padding: '0 12px', display: 'flex', gap: 0, overflowX: 'auto' }}>
        {NAV_LINKS.map(nav => (
          <button key={nav} onClick={() => handleNav(nav)} style={{
            background: activeNav === nav ? '#cc000015' : 'transparent',
            color: activeNav === nav ? '#fff' : '#888',
            border: 'none',
            borderBottom: activeNav === nav ? '3px solid #cc0000' : '3px solid transparent',
            padding: isMobile ? '10px 12px' : '12px 16px',
            cursor: 'pointer',
            fontSize: isMobile ? '12px' : '13px',
            fontWeight: activeNav === nav ? 700 : 500,
            whiteSpace: 'nowrap',
            fontFamily: 'sans-serif',
            transition: 'all 0.2s',
          }}>{nav}</button>
        ))}
      </div>

      {/* Indices Bar */}
      <div style={{ background: '#0f0f0f', borderBottom: '1px solid #1f1f1f', padding: '6px 12px', display: 'flex', gap: isMobile ? '16px' : '28px', overflowX: 'auto', alignItems: 'center' }}>
        {indices.map((idx, i) => (
          <div key={i} style={{ flexShrink: 0 }}>
            <div style={{ fontSize: '9px', color: '#666', fontFamily: 'sans-serif' }}>{idx.name}</div>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'baseline' }}>
              <span style={{ fontSize: isMobile ? '11px' : '13px', fontWeight: 700, fontFamily: 'monospace', color: '#e0e0e0' }}>{idx.price.toLocaleString('en-IN')}</span>
              <span style={{ fontSize: '9px', color: idx.change >= 0 ? '#00ff88' : '#ff4444', fontWeight: 600 }}>
                {idx.change >= 0 ? '▲' : '▼'} {Math.abs(idx.change)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* AI Summary */}
      {(result || loading) && (
        <div style={{ background: '#111', borderBottom: '1px solid #2a2a2a', borderLeft: '4px solid #cc0000', padding: isMobile ? '14px 12px' : '18px 20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg,#cc0000,#ff6600,#cc0000)', backgroundSize: '200%', animation: 'glowbar 2s linear infinite' }} />
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#888' }}>
              <div style={{ width: 20, height: 20, border: '2px solid #cc000033', borderTop: '2px solid #cc0000', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', fontFamily: 'sans-serif' }}>Fetching news & generating AI briefing...</span>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <strong style={{ color: '#cc0000', fontSize: '12px', letterSpacing: '1px', fontFamily: 'sans-serif' }}>⚡ AI SUMMARY</strong>
                {sentiment && (
                  <span style={{ background: sentimentColor + '22', color: sentimentColor, border: `1px solid ${sentimentColor}`, borderRadius: '12px', padding: '2px 10px', fontSize: '11px', fontWeight: 700, fontFamily: 'sans-serif' }}>
                    {sentimentIcon} {sentiment}
                  </span>
                )}
              </div>
              <p style={{ fontSize: isMobile ? '13px' : '15px', lineHeight: '1.9', color: '#ccc', marginBottom: '12px', fontFamily: 'sans-serif' }}>{result}</p>
              {investorImpact && (
                <div style={{ background: '#0a0a0a', borderLeft: '3px solid #ffaa00', borderRadius: '4px', padding: '10px 12px', fontSize: '12px', color: '#ffcc44', marginBottom: '12px' }}>
                  💼 <strong>Investor Impact:</strong> {investorImpact}
                </div>
              )}
              {followUps.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', color: '#666', fontFamily: 'sans-serif', fontWeight: 600 }}>🔍 Explore: </span>
                  {followUps.map((q, i) => (
                    <button key={i} onClick={() => handleFollowUp(q)} style={{ background: 'transparent', border: '1px solid #cc000066', color: '#cc0000', borderRadius: '20px', padding: '4px 10px', cursor: 'pointer', fontSize: '11px', marginLeft: '6px', fontFamily: 'sans-serif', marginTop: '4px' }}>{q}</button>
                  ))}
                </div>
              )}
              <textarea
                placeholder="Ask anything about this topic..."
                rows={3}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey && e.target.value.trim()) {
                    e.preventDefault();
                    const q = e.target.value.trim();
                    e.target.value = '';
                    handleAskAnything(q);
                  }
                }}
                style={{ width: '100%', boxSizing: 'border-box', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '10px 12px', color: '#e0e0e0', fontSize: '13px', outline: 'none', fontFamily: 'sans-serif', resize: 'vertical', minHeight: '80px', lineHeight: '1.6' }}
              />
              <p style={{ fontSize: '11px', color: '#555', marginTop: '4px', fontFamily: 'sans-serif' }}>Press Enter to ask • Shift+Enter for new line</p>
            </>
          )}
        </div>
      )}

      {/* ✅ Responsive layout — 1 col on mobile, 3 col on desktop */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '240px 1fr 260px', gap: 0, maxWidth: '1400px', margin: '0 auto', padding: isMobile ? '12px' : '20px', alignItems: 'start' }}>

        {/* LEFT — hide on mobile */}
        {!isMobile && (
          <div style={{ borderRight: '1px solid #1f1f1f', paddingRight: '18px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#cc0000', fontFamily: 'sans-serif', borderBottom: '2px solid #cc0000', paddingBottom: '6px', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              📰 Today's News
            </div>
            {(displayArticles.length > 0 ? displayArticles : articles).slice(0, 7).map((article, i) => (
              <div key={i} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #1a1a1a' }}>
                <a href={article.url} target="_blank" rel="noreferrer"
                  style={{ textDecoration: 'none', color: '#ccc', fontSize: '12px', lineHeight: '1.6', fontWeight: 500, display: 'block', fontFamily: 'sans-serif' }}
                  onMouseEnter={e => e.target.style.color = '#cc0000'}
                  onMouseLeave={e => e.target.style.color = '#ccc'}
                >{article.title}</a>
              </div>
            ))}
            {loading && [1,2,3,4,5].map(i => (
              <div key={i} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #1a1a1a' }}>
                <div style={{ height: '12px', background: '#1f1f1f', borderRadius: '3px', marginBottom: '5px', animation: 'shimmer 1.5s infinite' }} />
                <div style={{ height: '12px', background: '#1f1f1f', borderRadius: '3px', width: '75%', animation: 'shimmer 1.5s infinite' }} />
              </div>
            ))}
          </div>
        )}

        {/* CENTER — always shown */}
        <div style={{ padding: isMobile ? '0' : '0 18px' }}>
          {topic && result && (
            <div style={{ fontSize: '13px', color: '#666', fontFamily: 'sans-serif', marginBottom: '14px' }}>
              Results for: <strong style={{ color: '#cc0000' }}>"{topic}"</strong>
            </div>
          )}
          {showBookmarks && (
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#cc0000', fontFamily: 'sans-serif', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              🔖 Saved Articles ({bookmarks.length})
            </div>
          )}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ background: '#1a1a1a', borderRadius: '8px', overflow: 'hidden', border: '1px solid #2a2a2a' }}>
                  <div style={{ height: '160px', background: '#222', animation: 'shimmer 1.5s infinite' }} />
                  <div style={{ padding: '12px' }}>
                    <div style={{ height: '13px', background: '#2a2a2a', borderRadius: '3px', marginBottom: '7px', animation: 'shimmer 1.5s infinite' }} />
                    <div style={{ height: '13px', background: '#2a2a2a', borderRadius: '3px', width: '65%', animation: 'shimmer 1.5s infinite' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
              {displayArticles.map((article, i) => (
                <div key={i}
                  style={{ background: '#1a1a1a', borderRadius: '10px', overflow: 'hidden', border: '1px solid #2a2a2a', transition: 'all 0.3s' }}
                  onMouseEnter={e => { if (!isMobile) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(204,0,0,0.2)'; }}}
                  onMouseLeave={e => { if (!isMobile) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}}
                >
                  <div style={{ position: 'relative' }}>
                    <img src={article.image || CATEGORY_IMAGES['Home']} alt={article.title}
                      style={{ width: '100%', height: isMobile ? '180px' : '160px', objectFit: 'cover' }}
                      onError={e => { e.target.src = CATEGORY_IMAGES['Home']; }}
                    />
                    <span style={{ position: 'absolute', top: 8, left: 8, background: '#cc0000', color: '#fff', fontSize: '9px', fontWeight: 800, padding: '2px 7px', borderRadius: '3px', letterSpacing: '1px', fontFamily: 'sans-serif' }}>LATEST</span>
                  </div>
                  <div style={{ padding: '14px' }}>
                    <h3 style={{ fontSize: isMobile ? '14px' : '13px', fontWeight: 700, lineHeight: '1.6', marginBottom: '8px', color: '#e0e0e0', fontFamily: 'Georgia, serif' }}>{article.title}</h3>
                    {article.description && (
                      <p style={{ fontSize: '12px', color: '#777', lineHeight: '1.6', marginBottom: '12px', fontFamily: 'sans-serif' }}>{article.description}</p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <a href={article.url} target="_blank" rel="noreferrer" style={{ color: '#cc0000', fontSize: '12px', fontWeight: 700, textDecoration: 'none', fontFamily: 'sans-serif', flex: 1 }}>Read More →</a>
                      <button onClick={() => toggleBookmark(article)} style={{ background: 'none', border: `1px solid ${isBookmarked(article) ? '#ffaa00' : '#333'}`, borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '11px', color: isBookmarked(article) ? '#ffaa00' : '#666', fontFamily: 'sans-serif' }}>
                        {isBookmarked(article) ? '🔖 Saved' : '🔖'}
                      </button>
                      <button onClick={() => handleShare(article, i)} style={{ background: 'none', border: '1px solid #333', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '11px', color: '#666', fontFamily: 'sans-serif' }}>
                        {copiedIndex === i ? '✓' : '↗'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {showBookmarks && bookmarks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#444', fontFamily: 'sans-serif' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔖</div>
              <p>No saved articles yet.</p>
            </div>
          )}
        </div>

        {/* RIGHT — hide on mobile */}
        {!isMobile && (
          <div style={{ borderLeft: '1px solid #1f1f1f', paddingLeft: '18px' }}>
            <div style={{ marginBottom: '22px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#cc0000', fontFamily: 'sans-serif', borderBottom: '2px solid #cc0000', paddingBottom: '6px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>🔥 Trending</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['Nifty','RBI','Sensex','IPO','Gold','Rupee','Infosys','Tata','HDFC','Adani'].map(t => (
                  <button key={t}
                    onClick={() => { setTopic(t); fetchNews(t, activeNav); }}
                    style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '20px', padding: '4px 12px', cursor: 'pointer', fontSize: '11px', color: '#aaa', fontFamily: 'sans-serif', fontWeight: 600, transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.target.style.background = '#cc0000'; e.target.style.color = '#fff'; e.target.style.borderColor = '#cc0000'; }}
                    onMouseLeave={e => { e.target.style.background = '#1a1a1a'; e.target.style.color = '#aaa'; e.target.style.borderColor = '#2a2a2a'; }}
                  >{t}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '22px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#cc0000', fontFamily: 'sans-serif', borderBottom: '2px solid #cc0000', paddingBottom: '6px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>📈 Top Gainers</div>
              {TOP_GAINERS.map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#e0e0e0', fontFamily: 'sans-serif' }}>{s.name}</div>
                    <div style={{ fontSize: '10px', color: '#555', fontFamily: 'sans-serif' }}>Vol: {s.vol}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'monospace', color: '#e0e0e0' }}>{s.price.toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: '11px', color: '#00ff88', fontWeight: 600, fontFamily: 'sans-serif' }}>▲ {s.change}%</div>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#cc0000', fontFamily: 'sans-serif', borderBottom: '2px solid #cc0000', paddingBottom: '6px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>🧭 Market Mood</div>
              <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', marginBottom: '4px' }}>😰</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ff4444', fontFamily: 'sans-serif' }}>Fear</div>
                <div style={{ fontSize: '10px', color: '#555', fontFamily: 'sans-serif', marginTop: '4px' }}>Market sentiment is cautious</div>
                <div style={{ background: '#1a1a1a', borderRadius: '4px', height: '6px', marginTop: '10px', overflow: 'hidden' }}>
                  <div style={{ background: 'linear-gradient(90deg,#cc0000,#ff8800)', width: '35%', height: '100%', borderRadius: '4px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#444', fontFamily: 'sans-serif', marginTop: '4px' }}>
                  <span>Fear</span><span>Greed</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile bottom trending bar */}
      {isMobile && (
        <div style={{ padding: '12px', borderTop: '1px solid #1f1f1f', background: '#111' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#cc0000', fontFamily: 'sans-serif', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>🔥 Trending</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {['Nifty','RBI','Sensex','IPO','Gold','Rupee','Infosys','Tata'].map(t => (
              <button key={t}
                onClick={() => { setTopic(t); fetchNews(t, activeNav); }}
                style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '20px', padding: '5px 14px', cursor: 'pointer', fontSize: '12px', color: '#aaa', fontFamily: 'sans-serif', fontWeight: 600 }}
              >{t}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <>
      <SignedOut><LoginPage /></SignedOut>
      <SignedIn><NewsApp /></SignedIn>
    </>
  );
}