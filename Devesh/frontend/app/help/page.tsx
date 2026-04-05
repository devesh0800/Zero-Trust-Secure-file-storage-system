'use client';

import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import BackgroundAnimation from '../components/BackgroundAnimation';
import Script from 'next/script';

const CATEGORIES = [
  { id: 'security', icon: '🔐', title: 'Privacy & Security', desc: 'Secure storage, protecting your files, and safety rules.', color: 'ic-purple' },
  { id: 'files', icon: '📁', title: 'File Upload/Download', desc: 'Types of files, size limits, and how to upload.', color: 'ic-blue' },
  { id: 'sharing', icon: '🔗', title: 'File Sharing', desc: 'Sending files, links, and who can see them.', color: 'ic-green' },
  { id: '2fa', icon: '🔑', title: 'Extra Security & PIN', desc: 'Setup extra safety steps and your storage PIN.', color: 'ic-orange' },
  { id: 'network', icon: '🌐', title: 'Device & Sync', desc: 'Using multiple devices and connection help.', color: 'ic-teal' },
  { id: 'account', icon: '👤', title: 'Account & Access', desc: 'Signing in, roles, and resetting your password.', color: 'ic-pink' },
  { id: 'billing', icon: '💳', title: 'Plans & Billing', desc: 'Invoices, storage limits, and upgrades.', color: 'ic-yellow' },
  { id: 'all', icon: '🚀', title: 'Getting Started', desc: 'A simple guide for new users joining our platform.', color: 'ic-red' },
];

const FAQ_DATA = [
  // --- PRIORITY: LOGIN & ACCESS PROTOCOLS ---
  { cat: 'login', q: 'Login related issues - Troubleshooting', a: 'Login problems usually depend on (1) Wrong Password: Reset via email. (2) Extra Security Sync: Check your device time. (3) Browser: Try Incognito mode. (4) Account Lock: Wait 15 mins after 5 failed attempts or contact Support.' },
  { cat: 'access', q: 'Forgot Safety PIN?', a: 'Go to Profile -> Security -> Update PIN. You will need to verify your identity via a code sent to your registered email.' },
  { cat: 'login', q: 'Is SSO supported?', a: 'Yes, we support easy login via Google or Microsoft. If your team has this enabled, use the "Login with Work Account" button.' },
  { cat: 'access', q: 'I am getting "Access Denied" error', a: 'Check if your Safety PIN is set correctly. If you are a team member, ensure the file owner has given you "View" or "Edit" access.' },
  { cat: 'login', q: 'Can I stay logged in forever?', a: 'For safety, sessions close after 24 hours of inactivity. You can manage your logins in Settings -> Security -> Active Logins.' },

  // --- SECURITY & ENCRYPTION ---
  { cat: 'security', q: 'SecureVault mein kaunsa safety use hota hai?', a: 'SecureVault military-grade encryption use karta hai—jo sabse strong safety standard hai. Aapki files upload hote hi safe ho jaati hain aur sirf aap unhe dekh sakte ho. Hamare servers ko bhi aapka data access nahi hota—yahi private storage ka matlab hai.' },
  { cat: 'security', q: 'Kya meri files third-party servers pe store hoti hain?', a: 'Nahi. Aapki files SecureVault ke dedicated servers pe store hoti hain. Data kabhi third-party ko share nahi hota. Aap apni pasand ka storage region bhi choose kar sakte hain.' },
  { cat: 'security', q: 'Kya SecureVault safety standard follow karta hai?', a: 'Haan. SecureVault world-class safety standards (ISO, SOC2, GDPR) follow karta hai. Hum regular safety audits bhi karte hain.' },
  { cat: 'security', q: 'Private Storage kaise kaam karta hai?', a: 'Iska matlab hai ki aapki secret keys sirf aapke paas hain. SecureVault staff bhi aapka data nahi dekh sakta kyunki unke paas keys nahi hoti.' },

  // --- FILES & STORAGE ---
  { cat: 'files', q: 'Kaunse file formats support hote hain?', a: 'SecureVault lagbhag sabhi formats support karta hai: Documents (PDF, DOCX, XLSX, PPTX), Images (JPG, PNG, WEBP, SVG), Videos (MP4, MOV, AVI), Archives (ZIP, RAR, 7Z), aur Code files (JS, PY, JSON etc.). Maximum file size enterprise plan mein 50GB per file hai.' },
  { cat: 'files', q: 'File upload fail ho rahi hai — kya karein?', a: 'Pehle check karo: (1) Internet connection stable hai? (2) File size limit cross toh nahi hui? (3) Browser cache clear karo aur dobara try karo. Agar phir bhi fail ho rahi hai toh incognito mode mein try karo.' },
  { cat: 'files', q: 'Deleted files recover ho sakti hain?', a: 'Haan! Deleted files 30 days tak Trash mein rehti hain. Dashboard → Trash → File select → Restore click karo. Enterprise plan mein yeh window 90 days tak extend ho sakti hai.' },
  { cat: 'files', q: 'Upload speed slow kyun hai?', a: 'Upload speed aapke internet provider aur hamare encryption engine pe depend karti hai. AES-256 encryption process mein thoda waqt lagta hai taaki file fully secure ho sake.' },

  // --- 2FA & ACCESS ---
  { cat: '2fa', q: 'Extra Security kaise setup karein?', a: 'Settings → Security → Extra Security → Enable karo. Apna security app (Google Authenticator) open karo aur QR code scan karo. 6-digit code enter karo confirm karne ke liye.' },
  { cat: '2fa', q: '6-Digit Storage PIN kya hai aur kaise set karein?', a: 'Storage PIN ek extra layer of safety hai jo private files ya folders access karne pe maanga jaata hai. Settings → Security → Safety PIN → Set PIN.' },
  { cat: '2fa', q: 'Security code nahi aa raha ya app kaam nahi kar raha?', a: 'Pehle apne phone ka time sync check karo. Agar phir bhi kaam na kare toh backup codes use karo jo aapne setup ke waqt save kiye the. Agar codes nahi hain toh humein support pe message karo.' },
  { cat: 'account', q: 'Password bhool gaya toh kya karein?', a: 'Login page pe "Forgot Password" click karein. Aapke email pe ek link aayegi. Yaad rakhein, password change karne ke baad puraani files access karne ke liye Privacy Key ki zarurat pad sakti hai.' },

  // --- SHARING & NETWORK ---
  { cat: 'sharing', q: 'File share karte waqt permissions kaise set karein?', a: 'File → Share → Permission type select karo: View Only, Comment, Edit, Full Access. Enterprise mein team-level aur department-level permissions bhi set ho sakti hain.' },
  { cat: 'sharing', q: 'Shared link ko expire kaise karein?', a: 'Share link banate waqt "Link Expiry" option mein date set karo. Existing links ke liye: Shared → Link Settings → Expiry Date change karo ya "Revoke Link" se turant disable karo.' },
  { cat: 'network', q: 'Kitne devices pe ek saath login ho sakta hoon?', a: 'Enterprise plan mein unlimited devices pe login ho sakte ho. Active sessions Settings → Security → Active Sessions mein dekh sakte ho.' },
  { cat: 'network', q: 'Offline access available hai?', a: 'Filhaal SecureVault ke liye internet connection zaruri hai taaki realtime encryption verify ho sake. Desktop app mein selective sync ka feature jald hi aane wala hai.' },

  // --- BILLING & TEAM ---
  { cat: 'billing', q: 'Enterprise invoice kahan milega?', a: 'Admin Panel -> Billing -> Invoice History mein saare invoices PDF format mein available hain.' },
  { cat: 'account', q: 'Naya team member kaise add karein?', a: 'Admin Panel -> Members -> "Invite Member" click karo. Email ID daalo aur role assign karo. Invite email automatically jaayegi.' }
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hello! I am SafetyAI, your safety assistant. How can I help you keep your files safe today?' }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredFaq = FAQ_DATA.filter(item => {
    const matchesTab = activeTab === 'all' || item.cat === activeTab;
    const matchesSearch = item.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleOpenChat = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setIsChatOpen(true);
  };

  const processResponse = (userText: string) => {
    const query = userText.toLowerCase().trim();
    setIsTyping(true);

    setTimeout(() => {
      let match = null;
      const isSupportQuery = query.includes("issue") || query.includes("problem") || query.includes("error") || query.includes("fail") || query.includes("trouble");

      if (isSupportQuery && (query.includes("login") || query.includes("signin") || query.includes("access"))) {
        match = FAQ_DATA.find(f => f.cat === 'login');
      }

      if (!match) {
        match = FAQ_DATA.find(f => 
          f.q.toLowerCase().includes(query) || 
          query.split(' ').some(word => word.length > 3 && f.q.toLowerCase().includes(word)) ||
          (query.includes(f.cat) && !query.includes("kitne"))
        );
      }

      const response = match 
        ? `SafetyAI: ${match.a}` 
        : (query.includes("hi") || query.includes("hello"))
        ? "Hi! I am SafetyAI, your safety assistant. Ask me anything about storage or access."
        : "I couldn't find a direct answer. Contact support@securevault.com for faster help.";

      setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setIsTyping(false);
      
      setTimeout(() => {
        const chatContainer = document.querySelector('.chat-msg-container');
        if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
      }, 60);
    }, 1000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    const text = inputMessage;
    setChatMessages(prev => [...prev, { role: 'user', content: text }]);
    setInputMessage('');
    processResponse(text);
  };

  const handleSuggestionClick = (text: string) => {
    setChatMessages(prev => [...prev, { role: 'user', content: text }]);
    processResponse(text);
  };

  return (
    <div className="min-h-screen bg-[#0d0d14] text-[#f0f0fa] font-['Outfit'] overflow-x-hidden">
      <Navbar />
      <BackgroundAnimation />
      
      <style jsx global>{`
        .ic-purple { background: rgba(124,58,237,0.15); }
        .ic-blue   { background: rgba(59,130,246,0.12); }
        .ic-green  { background: rgba(52,211,153,0.12); }
        .ic-orange { background: rgba(251,146,60,0.12); }
        .ic-red    { background: rgba(248,113,113,0.12); }
        .ic-yellow { background: rgba(251,191,36,0.12); }
        .ic-pink   { background: rgba(236,72,153,0.12); }
        .ic-teal   { background: rgba(20,184,166,0.12); }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          animation: fadeUp 0.6s ease both;
        }
      `}</style>

      <main className="relative z-10 max-w-[1080px] mx-auto px-7 pb-20 pt-24">
        {/* HERO */}
        <section className="text-center py-16 px-5 animate-fade-up">
          <div className="inline-flex items-center gap-2 bg-[#7c3aed1a] border border-[#7c3aed40] text-[#a78bfa] text-[0.72rem] font-semibold tracking-[1.8px] uppercase px-4 py-1.5 rounded-full mb-6">
            🛡️ &nbsp;SecureVault Help Center
          </div>
          <h1 className="text-[clamp(2rem,4.5vw,3.2rem)] font-extrabold leading-[1.15] tracking-tight mb-4">
            How can we <span className="bg-gradient-to-r from-[#9d6eff] to-[#a78bfa] bg-clip-text text-transparent">help you?</span>
          </h1>
          <p className="text-[#8b8ba8] text-lg max-w-[440px] mx-auto mb-9 leading-[1.7]">
            Search guides, FAQs, or contact our enterprise support team — available 24/7.
          </p>
          <div className="relative max-w-[560px] mx-auto">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b8ba8]" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            <input 
              type="text" 
              placeholder="Search for encryption, 2FA, file sharing…" 
              className="w-full bg-[#1a1a2e] border border-[#7c3aed33] text-[#f0f0fa] py-4 px-14 rounded-2xl outline-none focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed40] transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#7c3aed] text-white w-[30px] h-[30px] rounded-lg flex items-center justify-center hover:opacity-85 transition-opacity">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>
          </div>
        </section>

        {/* STATUS BANNER */}
        <div className="flex flex-col md:flex-row items-center justify-between bg-[#34d3990f] border border-[#34d3992e] rounded-xl p-5 mb-11 animate-fade-up [animation-delay:0.15s]">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#34d399] shadow-[0_0_8px_#34d399] animate-pulse"></div>
            <div>
              <div className="text-[0.85rem] font-semibold text-[#34d399]">All Systems Running Perfectly</div>
              <div className="text-[0.78rem] text-[#8b8ba8]">Everything is running smoothly and your files are safe.</div>
            </div>
          </div>
          <div className="hidden md:flex gap-5 mt-4 md:mt-0">
            <div className="text-center">
              <div className="font-mono text-[0.9rem] text-[#f0f0fa]">99.98%</div>
              <div className="text-[0.7rem] text-[#8b8ba8]">Uptime (30d)</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-[0.9rem] text-[#f0f0fa]">Secure</div>
              <div className="text-[0.7rem] text-[#8b8ba8]">Protection</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-[0.9rem] text-[#f0f0fa]">&lt; 80ms</div>
              <div className="text-[0.7rem] text-[#8b8ba8]">Avg Response</div>
            </div>
          </div>
        </div>

        {/* CATEGORIES */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[0.68rem] font-bold tracking-[2px] uppercase text-[#8b8ba8]">Browse by Topic</span>
          <div className="flex-1 h-px bg-white/5"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14 animate-fade-up [animation-delay:0.2s]">
          {CATEGORIES.map(cat => (
            <button 
              key={cat.id}
              onClick={() => { setActiveTab(cat.id); document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="bg-[#1a1a2e] border border-white/5 rounded-2xl p-5 text-left hover:border-[#7c3aed66] hover:-translate-y-1 hover:shadow-[0_14px_36px_#7c3aed1a] transition-all group"
            >
              <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center text-xl ${cat.color}`}>
                {cat.icon}
              </div>
              <h3 className="text-[0.9rem] font-bold mb-1">{cat.title}</h3>
              <p className="text-[0.77rem] text-[#8b8ba8] leading-normal">{cat.desc}</p>
              <div className="mt-3 text-[0.72rem] font-semibold text-[#a78bfa] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                View articles →
              </div>
            </button>
          ))}
        </div>

        {/* FAQ SECTION */}
        <div id="faq" className="mb-14 animate-fade-up [animation-delay:0.3s]">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[0.68rem] font-bold tracking-[2px] uppercase text-[#8b8ba8]">Frequently Asked Questions</span>
            <div className="flex-1 h-px bg-white/5"></div>
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            {['all', 'security', 'files', '2fa', 'sharing', 'network', 'account'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg border text-[0.82rem] font-medium transition-all ${
                  activeTab === tab 
                    ? 'bg-[#7c3aed1f] border-[#7c3aed4d] text-[#a78bfa]' 
                    : 'bg-transparent border-white/5 text-[#8b8ba8] hover:text-[#f0f0fa] hover:border-[#7c3aed]'
                }`}
              >
                {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1).replace('2fa', '2FA & PIN')}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2.5">
            {filteredFaq.length > 0 ? (
              filteredFaq.map((item, idx) => (
                <div key={idx} className={`bg-[#1a1a2e] border rounded-xl overflow-hidden transition-all ${openFaq === idx ? 'border-[#7c3aed59]' : 'border-white/5'}`}>
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:text-[#a78bfa]"
                    onClick={() => toggleFaq(idx)}
                  >
                    <span className="font-medium text-[0.92rem]">{item.q}</span>
                    <svg 
                      className={`w-4 h-4 text-[#8b8ba8] transition-transform duration-300 ${openFaq === idx ? 'rotate-180 text-[#a78bfa]' : ''}`} 
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                  <div className={`overflow-hidden transition-all duration-300 ${openFaq === idx ? 'max-h-[400px] p-4 pt-0' : 'max-h-0 px-4'}`}>
                    <p className="text-[0.86rem] text-[#8b8ba8] leading-[1.75] whitespace-pre-line">
                      {item.a}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-[#8b8ba8]">
                🔍 Koi result nahi mila. <a href="#contact" className="text-[#a78bfa] hover:underline">Support se contact karo →</a>
              </div>
            )}
          </div>
        </div>

        {/* CONTACT */}
        <section id="contact" className="mb-14 animate-fade-up [animation-delay:0.35s]">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[0.68rem] font-bold tracking-[2px] uppercase text-[#8b8ba8]">Contact Enterprise Support</span>
            <div className="flex-1 h-px bg-white/5"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="#" onClick={handleOpenChat} className="bg-[#1a1a2e] border border-white/5 rounded-2xl p-6 hover:border-[#7c3aed59] hover:-translate-y-1 hover:shadow-[0_12px_32px_#7c3aed1a] transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-[#34d3991f] flex items-center justify-center text-xl">💬</div>
                <span className="bg-[#34d3991f] text-[#34d399] text-[0.68rem] font-bold px-2.5 py-0.5 rounded-full">● Online Now</span>
              </div>
              <h4 className="text-[0.95rem] font-bold mb-1.5">Live Chat</h4>
              <p className="text-[0.8rem] text-[#8b8ba8] leading-relaxed">Hamare enterprise support specialists se turant baat karo. Real-time resolution guaranteed.</p>
              <div className="mt-3.5 text-[0.75rem] text-[#8b8ba8] flex items-center gap-1.5">⚡ Avg response: &lt; 2 minutes</div>
            </a>

            <a href="mailto:support@securevault.com" className="bg-[#1a1a2e] border border-white/5 rounded-2xl p-6 hover:border-[#7c3aed59] hover:-translate-y-1 hover:shadow-[0_12px_32px_#7c3aed1a] transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-[#7c3aed1f] flex items-center justify-center text-xl">📧</div>
                <span className="bg-[#7c3aed1f] text-[#a78bfa] text-[0.68rem] font-bold px-2.5 py-0.5 rounded-full">24hr SLA</span>
              </div>
              <h4 className="text-[0.95rem] font-bold mb-1.5">Email Support</h4>
              <p className="text-[0.8rem] text-[#8b8ba8] leading-relaxed">Detailed issues ke liye email karo. Screenshots aur logs attach karna helpful hota hai.</p>
              <div className="mt-3.5 text-[0.75rem] text-[#8b8ba8] flex items-center gap-1.5">📮 support@securevault.com</div>
            </a>

            <a href="tel:+911800000000" className="bg-[#1a1a2e] border border-white/5 rounded-2xl p-6 hover:border-[#7c3aed59] hover:-translate-y-1 hover:shadow-[0_12px_32px_#7c3aed1a] transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-[#3b82f61f] flex items-center justify-center text-xl">📞</div>
                <span className="bg-[#3b82f61f] text-[#60a5fa] text-[0.68rem] font-bold px-2.5 py-0.5 rounded-full">Mon–Sat 9AM–7PM</span>
              </div>
              <h4 className="text-[0.95rem] font-bold mb-1.5">Phone Support</h4>
              <p className="text-[0.8rem] text-[#8b8ba8] leading-relaxed">Critical issues ke liye seedha phone karo. Enterprise customers ko priority queue milti hai.</p>
              <div className="mt-3.5 text-[0.75rem] text-[#8b8ba8] flex items-center gap-1.5">📞 1800-000-0000</div>
            </a>
          </div>
        </section>

        {/* SECURITY NOTE */}
        <div className="flex flex-col md:flex-row gap-5 items-start bg-[#7c3aed0f] border border-[#7c3aed2e] rounded-2xl p-7 mb-14 animate-fade-up [animation-delay:0.4s]">
          <div className="text-3xl shrink-0">🛡️</div>
          <div>
            <h4 className="text-[0.95rem] font-bold text-[#a78bfa] mb-1.5">Enterprise Security Commitment</h4>
            <p className="text-[0.82rem] text-[#8b8ba8] leading-relaxed mb-4">
              SecureVault ka poora infrastructure zero-knowledge architecture pe based hai. Hamare engineers bhi aapka encrypted data access nahi kar sakte. Aapki security humari #1 priority hai.
            </p>
            <div className="flex flex-wrap gap-2">
              {['AES-256', 'ISO 27001', 'SOC 2 Type II', 'GDPR Compliant', 'Zero-Knowledge', 'End-to-End Encrypted'].map(badge => (
                <span key={badge} className="text-[0.7rem] font-semibold px-3 py-1 rounded bg-[#7c3aed1a] border border-[#7c3aed33] text-[#a78bfa] font-mono">
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/5 py-7 px-10 flex flex-col md:flex-row items-center justify-between text-[0.78rem] text-[#8b8ba8] gap-4">
        <span>© 2025 SecureVault Technologies Pvt. Ltd. · All rights reserved.</span>
        <div className="flex gap-5">
          <a href="#" className="hover:text-[#a78bfa] transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-[#a78bfa] transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-[#a78bfa] transition-colors">Security Whitepaper</a>
          <a href="/dashboard" className="hover:text-[#a78bfa] transition-colors">← Back to Dashboard</a>
        </div>
      </footer>

      {/* ═══════════════ VAULT AI CHAT DRAWER ═══════════════ */}
      {isChatOpen && (
        <div className="fixed bottom-6 right-6 w-[380px] h-[520px] bg-[#12121c] border border-[#7c3aed40] rounded-3xl shadow-2xl z-[500] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300 backdrop-blur-xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#7c3aed] to-[#5b21b6] p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl">🤖</div>
              <div>
                <h3 className="text-sm font-bold text-white">SafetyAI</h3>
                <p className="text-[10px] text-white/60">Your Safety Assistant</p>
              </div>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="text-white/60 hover:text-white transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar chat-msg-container">
            {/* Quick Suggestions */}
            {chatMessages.length === 1 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {['Encryption Details', 'Setup 2FA', 'Storage Limits', 'Forgotten Password'].map(s => (
                  <button 
                    key={s} 
                    onClick={() => handleSuggestionClick(s)}
                    className="text-[10px] bg-white/5 border border-white/10 px-3 py-1.5 rounded-full hover:bg-[#7c3aed33] hover:border-[#7c3aed] transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user' 
                  ? 'bg-[#7c3aed] text-white rounded-tr-none' 
                  : 'bg-[#1a1a2e] text-[#f0f0fa] border border-white/5 rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-[#1a1a2e] border border-white/5 p-4 rounded-2xl rounded-tl-none flex gap-1">
                  <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
            <div id="chat-bottom"></div>
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 bg-[#0d0d14] border-t border-white/5 flex gap-2">
            <input 
              type="text" 
              placeholder="Ask anything about security…" 
              className="flex-1 bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-[#7c3aed] transition-all"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
            />
            <button type="submit" className="bg-[#7c3aed] text-white p-2 rounded-xl hover:opacity-90 transition-opacity">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
            </button>
          </form>
        </div>
      )}

      {/* CHAT TRIGGER BUTTON (Optional floating icon) */}
      {!isChatOpen && (
        <button 
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-[#7c3aed] to-[#5b21b6] rounded-full shadow-2xl z-[450] flex items-center justify-center text-white hover:scale-110 transition-all group"
        >
          <svg className="w-6 h-6 group-hover:rotate-12 transition-transform" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </button>
      )}

    </div>
  );
}
