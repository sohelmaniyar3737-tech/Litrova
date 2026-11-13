import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';



import { Routes, Route, Navigate, NavLink, Link, Outlet, useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';



import { motion, AnimatePresence } from 'framer-motion';



import {



  BookOpen, LayoutDashboard, Library, BrainCircuit, NotebookTabs, Settings, Search,



  Bell, UserRound, Menu, X, PanelLeftClose, PanelLeftOpen, ChevronRight, ArrowUpRight,



  UploadCloud, Plus, FileText, Sparkles, MessageCircle, Mic2, Users, Bookmark,



  Highlighter, Clock3, CheckCircle2, AlertCircle, LoaderCircle, Send, Quote,



  LogOut, Moon, Sun, Trash2, Download, Headphones, ListFilter, SlidersHorizontal,



  Command, BookMarked, AudioLines, PanelTop, RefreshCw, MoreHorizontal, Pin, Pencil



} from 'lucide-react';



import { api, fetchFile, clearSession, getToken, getUser, setSession } from './lib/api';
import * as pdfjsLib from 'pdfjs-dist';
import { TextLayer } from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

import BorderGlow from './components/BorderGlow';

import LightRays from './components/LightRays';

import LatticeLoader from './components/LatticeLoader';
import Stepper, { Step } from './components/Stepper';







const NAV = [



  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },



  { to: '/library', label: 'My Library', icon: Library },



  { to: '/workspace', label: 'My Workspace', icon: NotebookTabs },



];



const BOOK_TABS = [



  { key: 'reader', label: 'Reader', icon: BookOpen },



  { key: 'intelligence', label: 'Intelligence', icon: BrainCircuit },



  { key: 'characters', label: 'Characters', icon: Users },



  { key: 'voice', label: 'Voice', icon: AudioLines },



];







function App() {



  const [theme, setTheme] = useState(localStorage.getItem('litrova_theme') || 'dark');



  const [user, setUser] = useState(getUser());



  const [books, setBooks] = useState([]);



  const [loadingBooks, setLoadingBooks] = useState(false);



  const [toast, setToast] = useState('');



  const [collapsed, setCollapsed] = useState(localStorage.getItem('litrova_sidebar') === 'collapsed');



  const [activeBook, setActiveBook] = useState(null);



  const navigate = useNavigate();



  const location = useLocation();



  const isAuth = !!getToken() && !!user;







  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('litrova_theme', theme); }, [theme]);



  useEffect(() => { localStorage.setItem('litrova_sidebar', collapsed ? 'collapsed' : 'expanded'); }, [collapsed]);



  useEffect(() => { if (user) loadBooks(); else setBooks([]); }, [user]);



  async function loadBooks() {



    setLoadingBooks(true);



    try { const data = await api('/books'); setBooks(data.books || []); }



    catch (error) { notify(error.message); }



    finally { setLoadingBooks(false); }



  }



  function notify(message) { setToast(message); window.clearTimeout(window.__litrovaToast); window.__litrovaToast = window.setTimeout(() => setToast(''), 3200); }



  function onAuth(session) { setSession(session.token, session.user); setUser(session.user); navigate('/dashboard'); }



  function logout() { clearSession(); setUser(null); setActiveBook(null); navigate('/'); notify('You have been signed out.'); }



 const bookRoute = location.pathname.match(/^\/(reader|intelligence|books)\/([^/]+)/);



  useEffect(() => { if (bookRoute?.[2]) { const found = books.find(b => String(b.id) === bookRoute[2]); if (found) setActiveBook(found); } }, [location.pathname, books]);







  return <div className="app-root">



    <AnimatePresence>{toast && <motion.div className="toast" initial={{ y: -14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }}><CheckCircle2 size={16}/>{toast}</motion.div>}</AnimatePresence>



    <Routes>



      <Route path="/" element={<Landing onStart={() => navigate(isAuth ? '/dashboard' : '/auth')} />} />



      <Route path="/auth" element={isAuth ? <Navigate to="/dashboard" replace/> : <Auth onSuccess={onAuth}/>} />



      <Route element={isAuth ? <AppShell user={user} books={books} loadingBooks={loadingBooks} reloadBooks={loadBooks} activeBook={activeBook} setActiveBook={setActiveBook} collapsed={collapsed} setCollapsed={setCollapsed} theme={theme} setTheme={setTheme} onLogout={logout} notify={notify}/> : <Navigate to="/auth" replace/>}>



        <Route path="/dashboard" element={<Dashboard user={user} books={books} loading={loadingBooks}/>} />



        <Route path="library" element={<LibraryPage books={books} loading={loadingBooks} reload={loadBooks} notify={notify} setActiveBook={setActiveBook}/>} />



        <Route path="reader/:bookId" element={<BookRoutePage kind="reader" books={books} activeBook={activeBook} setActiveBook={setActiveBook} setBooks={setBooks} notify={notify}/>} />



        <Route path="intelligence/:bookId" element={<BookRoutePage kind="intelligence" books={books} activeBook={activeBook} setActiveBook={setActiveBook} notify={notify}/>} />



        <Route path="books/:bookId/characters" element={<BookRoutePage kind="characters" books={books} activeBook={activeBook} setActiveBook={setActiveBook} notify={notify}/>} />



        <Route path="books/:bookId/voice" element={<BookRoutePage kind="voice" books={books} activeBook={activeBook} setActiveBook={setActiveBook} notify={notify}/>} />



        <Route path="workspace" element={<WorkspacePage books={books}/>} />



        <Route path="settings/*" element={<SettingsPage user={user} theme={theme} setTheme={setTheme}/>} />



        <Route path="help" element={<PlaceholderPage icon={MessageCircle} title="Help & support" description="Guides and support resources will live here."/>} />



      </Route>



      <Route path="*" element={<Navigate to={isAuth ? '/dashboard' : '/'} replace/>}/>



    </Routes>



  </div>;



}







function Brand({ small = false }) { return <Link to="/dashboard" className={`brand ${small ? 'brand-small' : ''}`}><span className="brand-mark"><BookOpen size={19}/><i/></span><span>litrova</span></Link>; }



function Landing({ onStart }) {



  return <main className="landing-page">



    <nav className="landing-nav wrap"><Brand/><div className="landing-links"><a href="#experience">Experience</a><a href="#how">How it works</a><a href="#principles">Our approach</a></div><button className="button-container" onClick={onStart}><span className="button-border"><span className="button-inner">Open Litrova <ArrowUpRight size={16}/></span></span></button></nav>



    <section className="landing-hero wrap"><div className="hero-copy"><div className="eyebrow"><span/> A NEW WAY TO EXPERIENCE BOOKS</div><h1>Some books deserve<br/>a <em>conversation.</em></h1><p>Step inside the pages. Ask better questions, uncover hidden connections, and explore the ideas that stay with you.</p><div className="hero-actions"><button className="button-container" onClick={onStart}><span className="button-border"><span className="button-inner">Enter your library <ArrowUpRight size={17}/></span></span></button><a className="quiet-link" href="#how">Discover how it works <ChevronRight size={16}/></a></div><div className="hero-foot"><span className="tiny-orbit"><BookOpen size={14}/></span> A quieter, deeper way to read.</div></div>



      <div className="hero-visual" aria-label="Litrova book illustration"><LightRays className="hero-rays" raysColor="#879477" raysSpeed={0.35} lightSpread={0.7} rayLength={1.4} followMouse={false} noiseAmount={0.025} distortion={0.015} lightMode /><div className="visual-halo halo-a"/><div className="visual-halo halo-b"/><div className="floating-tag tag-a"><Sparkles size={14}/> Ideas, connected.</div><div className="hero-book"><div className="hero-book-spine"/><div className="hero-book-cover"><span className="cover-symbol">L.</span><span className="cover-heading">The art<br/>of being<br/><i>human.</i></span><span className="cover-caption">A LITROVA READING EXPERIENCE</span></div></div><div className="floating-tag tag-b"><Quote size={14}/> Every page has more to say.</div><span className="visual-caption">READ · REFLECT · RESPOND</span></div></section>



    <section className="landing-section wrap" id="experience"><div className="section-heading"><span className="eyebrow">BEYOND THE PAGE</span><h2>Don't just read the story.<br/><em>Step into it.</em></h2><p>Litrova turns your books and documents into thoughtful companions. Bring your curiosity; the pages bring the context.</p></div><div className="feature-grid"><Feature n="01" icon={UploadCloud} title="Bring your book" text="Upload a PDF and let Litrova prepare its ideas and passages for exploration."/><Feature n="02" icon={MessageCircle} title="Start a conversation" text="Ask questions in your own words. Follow a thought wherever it leads."/><Feature n="03" icon={Quote} title="Go to the source" text="Explore the passages behind an answer and keep the book in view."/></div></section>



    <section className="landing-cta wrap" id="how"><div><span className="eyebrow">YOUR NEXT CHAPTER</span><h2>A library that<br/><em>talks back.</em></h2></div><button className="button-container button-container-invert" onClick={onStart}><span className="button-border"><span className="button-inner">Start exploring <ArrowUpRight size={17}/></span></span></button></section>



    <footer className="landing-footer wrap"><Brand/><span>Where Books Come Alive.</span><span>© 2026 Litrova</span></footer>



  </main>;



}



function Feature({ n, icon: Icon, title, text }) { return <BorderGlow className="feature-glow" backgroundColor="#fbf8f1" borderRadius={15} glowRadius={18} glowIntensity={0.38} glowColor="84 18 52" colors={["#69765d", "#b8ad8d", "#d8dfce"]}><article className="feature-card"><div className="feature-top"><span>{n}</span><Icon size={20}/></div><h3>{title}</h3><p>{text}</p></article></BorderGlow>; }







function Auth({ onSuccess }) {



  const [mode, setMode] = useState('login'); const [form, setForm] = useState({ name: '', email: '', password: '' }); const [busy, setBusy] = useState(false); const [error, setError] = useState('');



  async function submit(e) { e.preventDefault(); setBusy(true); setError(''); try { const data = await api(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(form) }); onSuccess(data); } catch (err) { setError(err.message); } finally { setBusy(false); } }



  return <main className="auth-screen"><section className="auth-art"><Brand/><div><span className="eyebrow">A SPACE FOR CURIOSITY</span><h1>Every page has<br/>more to <em>say.</em></h1><p>Meet your books again, this time through conversation.</p></div><span className="auth-art-foot">LITROVA · WHERE BOOKS COME ALIVE</span></section><section className="auth-main"><Link to="/" className="quiet-link">← Back to home</Link><div className="auth-card"><span className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'BEGIN YOUR STORY'}</span><h2>{mode === 'login' ? 'Return to your library.' : 'Create your account.'}</h2><p>{mode === 'login' ? 'Your next conversation is waiting.' : 'A thoughtful reading space, made yours.'}</p><form onSubmit={submit}>{mode === 'signup' && <label>Your name<input required minLength="2" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your name"/></label>}<label>Email address<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com" autoComplete="username"/></label><label>Password<input required minLength="8" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="At least 8 characters" autoComplete={mode === 'login' ? 'current-password' : 'new-password'}/></label>{error && <div className="form-error"><AlertCircle size={15}/>{error}</div>}<button className="button-solid full" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'} <ArrowUpRight size={16}/></button></form><p className="auth-switch">{mode === 'login' ? 'New to Litrova?' : 'Already have an account?'} <button onClick={()=>{setMode(mode==='login'?'signup':'login');setError('')}}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p><div className="privacy-note"><CheckCircle2 size={15}/> Your library is private to your account.</div></div></section></main>;



}







function AppShell({ user, books, loadingBooks, reloadBooks, activeBook, setActiveBook, collapsed, setCollapsed, theme, setTheme, onLogout, notify }) {



  const [mobileOpen, setMobileOpen] = useState(false); const [searchOpen, setSearchOpen] = useState(false); const [search, setSearch] = useState(''); const [bookMenuId, setBookMenuId] = useState(null); const [bookMenuPosition, setBookMenuPosition] = useState({ top: 0, left: 0 }); const [pinnedBookIds, setPinnedBookIds] = useState(() => { try { return JSON.parse(localStorage.getItem('litrova_pinned_books') || '[]').map(String); } catch { return []; } }); const location = useLocation(); const navigate = useNavigate();



 const isBookPath = /^\/(reader|intelligence|books)\//.test(location.pathname);



  const currentBookId = location.pathname.split('/').filter(Boolean)[1];



  const currentBook = books.find(b => String(b.id) === currentBookId) || activeBook;



  const results = useMemo(() => { const q = search.toLowerCase(); return books.filter(b => b.title?.toLowerCase().includes(q)); }, [books, search]);



  useEffect(() => { function onKey(e) { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(true); } if (e.key === 'Escape') setSearchOpen(false); } window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, []);



  function chooseBook(book) { setActiveBook(book); setSearchOpen(false); setSearch(''); setBookMenuId(null); }
  function togglePinnedBook(bookId) {
    const id = String(bookId);
    setPinnedBookIds(current => { const next = current.includes(id) ? current.filter(item => item !== id) : [...current, id]; localStorage.setItem('litrova_pinned_books', JSON.stringify(next)); return next; });
    setBookMenuId(null);
    notify(pinnedBookIds.includes(id) ? 'Book unpinned.' : 'Book pinned to your sidebar.');
  }
  async function renameBook(book) {
    const nextTitle = window.prompt('Enter a new name for this book:', book.title || '');
    if (nextTitle === null) return;
    const title = nextTitle.trim();
    if (!title) { notify('Book name cannot be empty.'); return; }
    if (title.length > 180) { notify('Book name must be 180 characters or fewer.'); return; }
    if (title === book.title) { setBookMenuId(null); return; }
    try { await api(`/books/${book.id}`, { method: 'PATCH', body: JSON.stringify({ title }) }); await reloadBooks(); setBookMenuId(null); notify('Book renamed successfully.'); }
    catch (error) { notify(error.message || 'Could not rename this book.'); }
  }
  async function deleteBook(book) {
    if (!window.confirm(`Delete “${book.title}” from your library? This cannot be undone.`)) return;
    try {
      await api(`/books/${book.id}`, { method: 'DELETE' });
      setPinnedBookIds(current => { const next = current.filter(id => id !== String(book.id)); localStorage.setItem('litrova_pinned_books', JSON.stringify(next)); return next; });
      setBookMenuId(null);
      if (String(currentBook?.id) === String(book.id)) { setActiveBook(null); navigate('/library'); }
      await reloadBooks(); notify('Book deleted from your library.');
    } catch (error) { notify(error.message || 'Could not delete this book.'); }
  }
  const orderedBooks = [...books].sort((a,b) => Number(pinnedBookIds.includes(String(b.id))) - Number(pinnedBookIds.includes(String(a.id))));



  return <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>

    <LightRays className="app-shell-rays" raysOrigin="top-center" raysColor="#a9b99a" raysSpeed={0.18} lightSpread={0.8} rayLength={1.6} followMouse={false} noiseAmount={0.018} distortion={0.008} />

    <aside className={`app-sidebar ${mobileOpen ? 'mobile-open' : ''}`}><div className="sidebar-top"><Brand/><button className="icon-btn collapse-btn" title={collapsed?'Expand sidebar':'Collapse sidebar'} onClick={()=>setCollapsed(!collapsed)}>{collapsed?<PanelLeftOpen size={18}/>:<PanelLeftClose size={18}/>}</button><button className="icon-btn mobile-close" onClick={()=>setMobileOpen(false)}><X size={19}/></button></div><div className="sidebar-section-label">YOUR SPACE</div><nav className="primary-nav">{NAV.map(item=><NavLink key={item.to} to={item.to} title={collapsed?item.label:undefined} className={({isActive})=>`nav-item ${isActive?'active':''}`} onClick={()=>setMobileOpen(false)}><item.icon size={18}/><span>{item.label}</span></NavLink>)}</nav><div className="sidebar-section-label books-label"><span>RECENT BOOKS</span><span>{books.length}</span></div><div className="sidebar-book-list">{orderedBooks.slice(0,6).map((book,i)=><div key={book.id} className={`sidebar-book-row ${String(currentBook?.id)===String(book.id)?'active':''} ${pinnedBookIds.includes(String(book.id))?'is-pinned':''}`}><Link to={`/intelligence/${book.id}`} title={collapsed?book.title:undefined} className="sidebar-book" onClick={()=>{chooseBook(book);setMobileOpen(false)}}><span className={`mini-book mini-book-${i%4}`}><BookOpen size={13}/></span><span className="sidebar-book-title">{book.title}</span></Link><button className="sidebar-book-menu-trigger" aria-label={`Options for ${book.title}`} title="Book options" aria-haspopup="menu" aria-expanded={bookMenuId===String(book.id)} onClick={e=>{e.preventDefault();e.stopPropagation();if(bookMenuId===String(book.id)){setBookMenuId(null);return;}const rect=e.currentTarget.getBoundingClientRect();const menuWidth=204;const menuHeight=158;const left=Math.min(rect.right+8,window.innerWidth-menuWidth-12);const top=Math.max(12,Math.min(rect.top-4,window.innerHeight-menuHeight-12));setBookMenuPosition({top,left});setBookMenuId(String(book.id));}}><MoreHorizontal size={17}/></button>{bookMenuId===String(book.id)&&createPortal(<><button className="book-menu-dismiss" aria-label="Close book options" onClick={()=>setBookMenuId(null)}/><div className="book-options-menu" role="menu" style={{top:bookMenuPosition.top,left:bookMenuPosition.left}}><button role="menuitem" onClick={()=>togglePinnedBook(book.id)}><Pin size={15}/>{pinnedBookIds.includes(String(book.id))?'Unpin':'Pin'}</button><button role="menuitem" onClick={()=>renameBook(book)}><Pencil size={15}/>Rename</button><div className="book-menu-divider"/><button role="menuitem" className="danger" onClick={()=>deleteBook(book)}><Trash2 size={15}/>Delete</button></div></>,document.body)}</div>)}{!books.length && !loadingBooks && <span className="sidebar-empty">{collapsed?'—':'Your books will appear here'}</span>}</div><div className="sidebar-bottom"><NavLink to="/settings" title={collapsed?'Settings':undefined} className={({isActive})=>`nav-item ${isActive?'active':''}`} onClick={()=>setMobileOpen(false)}><Settings size={18}/><span>Settings</span></NavLink><div className="profile-mini"><span className="avatar">{user.name?.[0]?.toUpperCase()||'L'}</span><span className="profile-name"><b>{user.name || 'Reader'}</b><small>Personal library</small></span><button className="icon-btn signout-btn" title="Sign out" onClick={onLogout}><LogOut size={16}/></button></div></div></aside>



    {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={()=>setMobileOpen(false)}/>}



    <div className="app-main"><header className="topbar"><button className="icon-btn mobile-menu-btn" onClick={()=>setMobileOpen(true)}><Menu size={20}/></button><div className="breadcrumbs"><span>Litrova</span><ChevronRight size={14}/><b>{isBookPath ? (currentBook?.title || 'Book workspace') : pageName(location.pathname)}</b></div><div className="topbar-actions"><button className="global-search" onClick={()=>setSearchOpen(true)}><Search size={16}/><span>Search anything...</span><kbd>Ctrl K</kbd></button><button className="icon-btn" title="Toggle theme" onClick={()=>setTheme(theme==='light'?'dark':'light')}>{theme==='light'?<Moon size={18}/>:<Sun size={18}/>}</button><button className="icon-btn notification-btn" title="Notifications" onClick={()=>notify('You are all caught up.')}><Bell size={18}/><i/></button><span className="avatar top-avatar">{user.name?.[0]?.toUpperCase()||'L'}</span></div></header>



      {isBookPath && currentBook && <BookContextHeader book={currentBook} />}



      <main className="page-content"><OutletFallback/></main>



    </div>



    {searchOpen && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setSearchOpen(false)}}><div className="search-modal"><div className="search-modal-input"><Search size={19}/><input autoFocus placeholder="Search your books..." value={search} onChange={e=>setSearch(e.target.value)}/><kbd>ESC</kbd></div><div className="search-results">{results.map(book=><Link key={book.id} to={`/intelligence/${book.id}`} onClick={()=>chooseBook(book)}><span className="mini-book"><BookOpen size={15}/></span><span><b>{book.title}</b><small>{book.page_count || '—'} pages · Your library</small></span><ArrowUpRight size={16}/></Link>)}{!results.length && <p className="muted">{books.length?'No matching books found.':'Upload a book to start searching your library.'}</p>}</div><div className="search-modal-foot"><span><Command size={13}/> Search across your library</span><span>Press ESC to close</span></div></div></div>}



  </div>;



}



// Outlet is kept in a tiny component to make the shell markup easier to scan.



function OutletFallback(){ return <Outlet/>; }



function pageName(path) { if(path.startsWith('/dashboard'))return 'Dashboard'; if(path.startsWith('/library'))return 'My Library'; if(path.startsWith('/workspace'))return 'My Workspace'; if(path.startsWith('/settings'))return 'Settings'; return 'Litrova'; }



function BookContextHeader({ book }) { const { bookId } = useParams(); const id = bookId || book.id; const path = useLocation().pathname; const active = path.includes('/characters')?'characters':path.includes('/voice')?'voice':path.startsWith('/reader')?'reader':'intelligence'; return <div className="book-context"><div className="book-context-info"><div className="context-cover"><BookOpen size={21}/></div><div><b>{book.title}</b><small>{book.page_count || '—'} pages <span>·</span> {book.status === 'ready' ? 'Ready to explore' : (book.status || 'Book workspace')}</small></div></div><nav className="book-tabs">{BOOK_TABS.map(tab=>{const to=tab.key==='reader'?`/reader/${id}`:tab.key==='intelligence'?`/intelligence/${id}`:`/books/${id}/${tab.key}`;return <NavLink key={tab.key} to={to} className={active===tab.key?'active':''}><tab.icon size={16}/><span>{tab.label}</span></NavLink>})}</nav></div>; }







function Dashboard({ user, books, loading }) {



  const recent = [...books].slice(0,3); const totalPages = books.reduce((sum,b)=>sum+(Number(b.page_count)||0),0);



  return <div className="page-stack"><PageIntro eyebrow="YOUR READING HOME" title={<>A little more room<br/>for <em>curiosity.</em></>} description={`Welcome back, ${user.name?.split(' ')[0] || 'reader'}. What would you like to explore today?`} action={<Link className="button-solid" to="/library"><Plus size={17}/> Add a book</Link>}/>



    <div className="stats-grid"><Stat icon={Library} label="Books in library" value={loading?'—':books.length}/><Stat icon={BookOpen} label="Pages in your library" value={loading?'—':totalPages.toLocaleString()}/><Stat icon={MessageCircle} label="Conversations" value="—" note="Coming with chat history"/><Stat icon={Clock3} label="Reading activity" value="—" note="Activity tracking planned"/></div>



    <section className="section-block"><div className="section-title-row"><div><span className="eyebrow">PICK UP WHERE YOU LEFT OFF</span><h2>Recently added</h2></div><Link className="text-action" to="/library">View library <ArrowUpRight size={15}/></Link></div>{recent.length?<div className="dashboard-books">{recent.map((book,i)=><BookCard key={book.id} book={book} index={i}/>)}</div>:<EmptyState icon={BookOpen} title="Your library starts with a page." text="Upload a PDF to begin exploring ideas, passages and conversations." action={<Link className="button-solid" to="/library"><UploadCloud size={16}/> Upload your first book</Link>}/>}</section>



    <section className="dashboard-lower"><div className="quiet-panel"><span className="eyebrow">A THOUGHT TO KEEP</span><h3>Reading is not just about finding answers. It's about discovering better questions.</h3><p>Keep a note, follow an idea, or ask Litrova to look closer.</p></div><div className="quick-panel"><span className="eyebrow">QUICK ACCESS</span><Link to="/library"><UploadCloud size={17}/> Upload a new book <ArrowUpRight size={15}/></Link><Link to="/workspace"><NotebookTabs size={17}/> Open saved knowledge <ArrowUpRight size={15}/></Link><Link to="/settings"><Settings size={17}/> Reading preferences <ArrowUpRight size={15}/></Link></div></section>



  </div>;



}



function Stat({ icon: Icon, label, value, note }) { return <article className="stat-card"><span className="stat-icon"><Icon size={18}/></span><span className="stat-label">{label}</span><b>{value}</b>{note&&<small>{note}</small>}</article>; }



function PageIntro({ eyebrow, title, description, action }) { return <div className="page-intro"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action&&<div className="page-intro-action">{action}</div>}</div>; }



// Cover thumbnails are shared across Dashboard and Library and persisted in localStorage.
// This prevents downloading and rendering the same PDF again on every route change.
const bookCoverCache = new Map();
const bookCoverRequests = new Map();

function getStoredBookCover(bookId) {
  const key = String(bookId);
  if (bookCoverCache.has(key)) return bookCoverCache.get(key);
  try {
    const stored = localStorage.getItem(`litrova_cover_${key}`);
    if (stored) {
      bookCoverCache.set(key, stored);
      return stored;
    }
  } catch (error) {
    console.warn('Could not read cached book cover:', error);
  }
  return '';
}

function createBookCover(book) {
  const key = String(book.id);
  const cached = getStoredBookCover(key);
  if (cached) return Promise.resolve(cached);
  if (bookCoverRequests.has(key)) return bookCoverRequests.get(key);

  const request = (async () => {
    let pdfDocument;
    try {
      const file = await fetchFile(`/books/${book.id}/file`);
      const data = await file.arrayBuffer();
      pdfDocument = await pdfjsLib.getDocument({ data }).promise;
      const firstPage = await pdfDocument.getPage(1);
      const baseViewport = firstPage.getViewport({ scale: 1 });
      const scale = Math.min(280 / baseViewport.width, 380 / baseViewport.height, 0.72);
      const viewport = firstPage.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) throw new Error('Canvas is unavailable.');

      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await firstPage.render({ canvasContext: context, viewport }).promise;
      const image = canvas.toDataURL('image/jpeg', 0.76);
      canvas.width = 0;
      canvas.height = 0;

      // Keep an in-memory copy even if browser storage is full or unavailable.
      bookCoverCache.set(key, image);
      try {
        localStorage.setItem(`litrova_cover_${key}`, image);
      } catch (storageError) {
        console.warn('Book cover generated but could not be persisted:', storageError);
      }
      return image;
    } finally {
      if (pdfDocument) {
        try { await pdfDocument.destroy(); } catch { /* document may already be closed */ }
      }
    }
  })();

  bookCoverRequests.set(key, request);
  request.finally(() => {
    if (bookCoverRequests.get(key) === request) bookCoverRequests.delete(key);
  }).catch(() => {});
  return request;
}

function BookCoverThumbnail({ book, index = 0 }) {
  const [cover, setCover] = useState(() => getStoredBookCover(book.id));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setFailed(false);
    const cached = getStoredBookCover(book.id);
    if (cached) {
      setCover(cached);
      return () => { active = false; };
    }

    setCover('');
    createBookCover(book)
      .then(image => { if (active) setCover(image); })
      .catch(error => {
        console.warn(`Could not create cover thumbnail for ${book.title}:`, error);
        if (active) setFailed(true);
      });

    return () => { active = false; };
  }, [book.id]);

  return (
    <Link to={`/intelligence/${book.id}`} className={`book-cover-card cover-tone-${index % 4} ${cover ? 'has-real-cover' : ''}`} aria-label={`Open ${book.title}`}>
      {cover ? (
        <img className="book-cover-thumbnail" src={cover} alt={`${book.title} front cover`} loading="eager" />
      ) : (
        <>
          <span className="cover-monogram">L.</span>
          <BookOpen size={27}/>
          <b>{book.title}</b>
          <small>{failed ? 'LITROVA LIBRARY' : 'LOADING COVER'}</small>
        </>
      )}
    </Link>
  );
}

function BookCard({ book, index=0 }) {
  return <BorderGlow className="book-card-glow" backgroundColor="#fbf8f1" borderRadius={12} glowRadius={16} glowIntensity={0.32} glowColor="84 18 52" colors={["#69765d", "#b8ad8d", "#d8dfce"]}>
    <motion.article className="book-card" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:index*.05}}>
      <BookCoverThumbnail book={book} index={index}/>
      <div className="book-card-info"><b>{book.title}</b><small>{book.page_count || '—'} pages · {book.status==='ready'?'Ready':book.status}</small><Link to={`/reader/${book.id}`} className="text-action">Open book <ArrowUpRight size={14}/></Link></div>
    </motion.article>
  </BorderGlow>;
}



function EmptyState({ icon: Icon, title, text, action }) { return <div className="empty-state"><span className="empty-icon"><Icon size={24}/></span><h3>{title}</h3><p>{text}</p>{action}</div>; }







function LibraryPage({ books, loading, reload, notify, setActiveBook }) {



  const [query,setQuery]=useState(''); const [file,setFile]=useState(null); const [title,setTitle]=useState(''); const [uploading,setUploading]=useState(false); const [filter,setFilter]=useState('all');



  const filtered=books.filter(b=>b.title?.toLowerCase().includes(query.toLowerCase())&&(filter==='all'||(filter==='ready'?b.status==='ready':b.status!=='ready')));



  async function uploadSelectedFile(){if(!file)return;setUploading(true);try{const body=new FormData();body.append('file',file);body.append('title',title);const result=await api('/books/upload',{method:'POST',body});notify(result.message||'Book uploaded.');setFile(null);setTitle('');await reload();}catch(err){notify(err.message);}finally{setUploading(false);}}



  return <div className="page-stack"><PageIntro eyebrow="YOUR PERSONAL COLLECTION" title={<>A library of <em>possibilities.</em></>} description="Every book is a new conversation waiting to happen." action={<label className="button-solid upload-label"><Plus size={17}/> Add a book<input type="file" accept="application/pdf,.pdf" hidden onChange={e=>setFile(e.target.files?.[0]||null)}/></label>}/>



    <div className="library-toolbar"><div className="input-search"><Search size={17}/><input placeholder="Search your library..." value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="filter-control"><ListFilter size={16}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All books</option><option value="ready">Ready</option><option value="processing">Processing</option></select></div><button className="icon-btn bordered" onClick={reload} title="Refresh library"><RefreshCw size={17}/></button></div>



    {file&&<section className="upload-stepper-card" aria-label="Prepare a book upload"><div className="upload-stepper-heading"><div><span className="eyebrow">ADD TO YOUR LIBRARY</span><h3>Let's prepare your book.</h3></div><button type="button" className="icon-btn" aria-label="Cancel upload" onClick={()=>{setFile(null);setTitle('');}}><X size={17}/></button></div><Stepper initialStep={1} onFinalStepCompleted={uploadSelectedFile} nextButtonText="Continue" backButtonText="Back" nextButtonProps={{disabled:uploading}}><Step><div className="upload-step-content"><span className="upload-step-number">01 / FILE</span><h4>Your document is selected</h4><div className="upload-file upload-file-step"><FileText size={22}/><span><b>{file.name}</b><small>{(file.size/1024/1024).toFixed(1)} MB · PDF document</small></span></div><p>Litrova will extract the text and prepare it for book conversations.</p></div></Step><Step><div className="upload-step-content"><span className="upload-step-number">02 / DETAILS</span><h4>Give your book a name</h4><label className="upload-title-field">Book title <span>Optional</span><input value={title} onChange={e=>setTitle(e.target.value)} maxLength={180} placeholder="e.g. Dracula by Bram Stoker"/></label><p>You can leave this blank and use the uploaded file name.</p></div></Step><Step><div className="upload-step-content"><span className="upload-step-number">03 / READY</span><h4>Everything looks ready.</h4><div className="upload-review-row"><FileText size={19}/><div><b>{title.trim()||file.name.replace(/\.pdf$/i,'')}</b><small>{(file.size/1024/1024).toFixed(1)} MB · PDF</small></div></div><p>Choose Complete to upload your document and start processing it.</p>{uploading&&<div className="upload-processing"><LatticeLoader label="Preparing your book" color="#69765d" cellSize={5} fontSize={11} showTimer={false}/></div>}</div></Step></Stepper></section>}



    {loading?<div className="loading-state"><LatticeLoader label="Loading your library" color="#69765d" cellSize={7} fontSize={12} showTimer={false}/></div>:filtered.length?<div className="library-grid">{filtered.map((book,i)=><BookCard key={book.id} book={book} index={i}/>)}</div>:<EmptyState icon={Library} title={books.length?'No books match your search.':'Your library is waiting for its first book.'} text={books.length?'Try a different title or filter.':'Add a text-based PDF and Litrova will prepare it for exploration.'} action={!books.length?<label className="button-solid upload-label"><UploadCloud size={16}/> Choose a PDF<input type="file" accept="application/pdf,.pdf" hidden onChange={e=>setFile(e.target.files?.[0]||null)}/></label>:null}/>}



  </div>;



}







function BookRoutePage({ kind, books, activeBook, setActiveBook, setBooks, notify }) {



  const { bookId }=useParams(); const book=books.find(b=>String(b.id)===bookId)||activeBook; const navigate=useNavigate();



  useEffect(()=>{if(book)setActiveBook(book);},[bookId,book]);



  if(!book)return <EmptyState icon={BookOpen} title="Book not found in this library." text="Return to your library and choose a book to continue." action={<Link className="button-solid" to="/library">Open library</Link>}/>;



  if(kind==='intelligence')return <IntelligencePage book={book} notify={notify}/>;



  if(kind==='reader')return <ReaderPage book={book} notify={notify} onPageCount={count=>setBooks?.(current=>current.map(item=>String(item.id)===String(book.id)?{...item,page_count:count}:item))}/>;



  if(kind==='characters')return <CharacterPage book={book}/>;



  return <VoicePage book={book}/>;



}



function ReaderPage({ book, notify, onPageCount }) {
  const [searchParams] = useSearchParams();
  const initialPage = Math.max(1, Number(searchParams.get('page')) || 1);
  const [page, setPage] = useState(initialPage);
  const [pageInput, setPageInput] = useState(String(initialPage));
  const [pageCount, setPageCount] = useState(Number(book.page_count) || 0);
  const [note, setNote] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [saved, setSaved] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState('');
  const [pdfDocument, setPdfDocument] = useState(null);
  const [rendering, setRendering] = useState(false);
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const renderTaskRef = useRef(null);

  useEffect(() => {
    let active = true;
    let loadedDocument;
    setPdfLoading(true);
    setPdfError('');
    setPdfDocument(null);
    fetchFile(`/books/${book.id}/file`)
      .then(blob => blob.arrayBuffer())
      .then(data => pdfjsLib.getDocument({ data }).promise)
      .then(async doc => {
        loadedDocument = doc;
        if (!active) { await doc.destroy(); return; }
        setPdfDocument(doc);
        setPageCount(doc.numPages);
        const correctedPage = Math.min(Math.max(1, initialPage), doc.numPages);
        setPage(correctedPage);
        setPageInput(String(correctedPage));
        if (Number(book.page_count) !== doc.numPages) {
          try {
            await api(`/books/${book.id}/page-count`, { method: 'PATCH', body: JSON.stringify({ pageCount: doc.numPages }) });
            onPageCount?.(doc.numPages);
          } catch (error) {
            console.warn('Could not sync PDF page count:', error.message);
            onPageCount?.(doc.numPages);
          }
        }
      })
      .catch(error => { if (active) setPdfError(error.message || 'Could not read this PDF.'); })
      .finally(() => { if (active) setPdfLoading(false); });
    return () => {
      active = false;
      if (renderTaskRef.current) renderTaskRef.current.cancel();
      if (loadedDocument) loadedDocument.destroy();
    };
  }, [book.id]);

  useEffect(() => {
    let cancelled = false;
    async function renderCurrentPage() {
      if (!pdfDocument || !canvasRef.current || !textLayerRef.current) return;
      setRendering(true);
      try {
        if (renderTaskRef.current) {
          try { renderTaskRef.current.cancel(); } catch { /* previous render may have completed */ }
        }
        const pdfPage = await pdfDocument.getPage(page);
        if (cancelled) return;
        const canvas = canvasRef.current;
        const textLayerElement = textLayerRef.current;
        const context = canvas.getContext('2d');
        const baseViewport = pdfPage.getViewport({ scale: 1 });
        const pageFrame = canvas.closest('.litrova-pdf-page');
        const availableWidth = Math.max(240, (pageFrame?.clientWidth || 900) - 26);
        const maxWidth = Math.min(850, availableWidth);
        const scale = Math.min(maxWidth / baseViewport.width, 1.8);
        const viewport = pdfPage.getViewport({ scale });
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        textLayerElement.replaceChildren();
        textLayerElement.style.width = `${Math.floor(viewport.width)}px`;
        textLayerElement.style.height = `${Math.floor(viewport.height)}px`;
        textLayerElement.style.setProperty('--scale-factor', String(scale));

        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        renderTaskRef.current = pdfPage.render({ canvasContext: context, viewport });
        await renderTaskRef.current.promise;
        if (cancelled) return;

        const textContent = await pdfPage.getTextContent();
        if (cancelled) return;
        const textLayer = new TextLayer({ textContentSource: textContent, container: textLayerElement, viewport });
        await textLayer.render();
      } catch (error) {
        if (error?.name !== 'RenderingCancelledException' && !cancelled) setPdfError(error.message || 'Could not render this page.');
      } finally {
        if (!cancelled) setRendering(false);
      }
    }
    renderCurrentPage();
    return () => { cancelled = true; if (renderTaskRef.current) renderTaskRef.current.cancel(); };
  }, [pdfDocument, page]);

  useEffect(() => {
    try {
      const bookmarks = JSON.parse(localStorage.getItem('litrova_bookmarks') || '[]');
      setSaved(bookmarks.some(item => String(item.bookId) === String(book.id) && Number(item.page) === page));
    } catch { setSaved(false); }
  }, [book.id, page]);

  useEffect(() => {
    setSelectedText('');
    setNote('');
    window.getSelection()?.removeAllRanges();
  }, [page]);

  function captureSelection() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const textLayer = textLayerRef.current;
    const anchorInsideLayer = textLayer?.contains(selection.anchorNode);
    const focusInsideLayer = textLayer?.contains(selection.focusNode);
    const rangeInsideLayer = textLayer?.contains(range.commonAncestorContainer);
    if (!anchorInsideLayer && !focusInsideLayer && !rangeInsideLayer) return;

    // PDF text is often split into many positioned spans. Normalize only
    // repeated spacing so the saved passage reads naturally in Notes.
    const text = selection.toString()
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t]+\n/g, '\n')
      .trim();
    if (text) setSelectedText(text);
  }

  function goToPage(value) {
    const requested = Number.parseInt(String(value), 10);
    if (!Number.isInteger(requested) || requested < 1 || requested > pageCount) {
      notify(`Enter a page number between 1 and ${pageCount || 'the available pages'}.`);
      setPageInput(String(page));
      return;
    }
    setPage(requested);
    setPageInput(String(requested));
  }

  function toggleBookmark() {
    let current = [];
    try { current = JSON.parse(localStorage.getItem('litrova_bookmarks') || '[]'); } catch { /* reset malformed local data */ }
    const exists = current.some(item => String(item.bookId) === String(book.id) && Number(item.page) === page);
    const next = exists
      ? current.filter(item => !(String(item.bookId) === String(book.id) && Number(item.page) === page))
      : [{ bookId: book.id, bookTitle: book.title, page, createdAt: new Date().toISOString() }, ...current];
    localStorage.setItem('litrova_bookmarks', JSON.stringify(next));
    setSaved(!exists);
    notify(exists ? 'Bookmark removed.' : `Page ${page} bookmarked.`);
  }

  function saveNote() {
    const cleanNote = note.trim();
    const cleanSelection = selectedText.trim();
    if (!cleanNote && !cleanSelection) return;
    let old = [];
    try { old = JSON.parse(localStorage.getItem('litrova_notes') || '[]'); } catch { /* reset malformed local data */ }
    localStorage.setItem('litrova_notes', JSON.stringify([
      { id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, bookId: book.id, bookTitle: book.title, page, selectedText: cleanSelection, note: cleanNote, createdAt: new Date().toISOString() },
      ...old
    ]));
    window.dispatchEvent(new Event('litrova-notes-updated'));
    setSelectedText('');
    setNote('');
    window.getSelection()?.removeAllRanges();
    notify('Passage and note saved to My Workspace.');
  }

  return <div className="reader-workspace">
    <div className="reader-toolbar">
      <div><span className="eyebrow">READING ROOM</span><b>{book.title}</b><small className="reader-status">{pdfLoading ? 'Opening your PDF…' : pdfError ? 'PDF unavailable' : `${pageCount} pages · Page ${page} of ${pageCount}`}</small></div>
      <div className="reader-tools">
        <button className={`icon-btn bordered ${saved ? 'is-saved' : ''}`} title={saved ? 'Remove bookmark' : 'Bookmark page'} onClick={toggleBookmark}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'}/></button>
        <button className="icon-btn bordered" title="Download original PDF" onClick={async()=>{try{const blob=await fetchFile(`/books/${book.id}/file`);const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=book.original_file_name||`${book.title}.pdf`;link.click();URL.revokeObjectURL(url);}catch(error){notify(error.message);}}}><Download size={17}/></button>
      </div>
    </div>

    <div className="reader-layout">
      <aside className="reader-toc">
        <span className="eyebrow">CONTENTS</span>
        <b>Document navigation</b>
        <p>Move through your book one page at a time.</p>
        <div className="reader-page-jump">
          <label htmlFor="reader-page-input">Go to page</label>
          <form onSubmit={event => { event.preventDefault(); goToPage(pageInput); }}>
            <input id="reader-page-input" type="number" inputMode="numeric" min="1" max={pageCount || undefined} step="1" value={pageInput} onChange={event => setPageInput(event.target.value)} disabled={pdfLoading || !!pdfError}/>
            <button className="button-solid" type="submit" disabled={pdfLoading || !!pdfError}>Go</button>
          </form>
        </div>
        <div className="toc-placeholder"><BookOpen size={16}/>{pageCount ? `${pageCount} pages in this document` : 'Reading PDF details…'}</div>
      </aside>

      <section className="reader-page-area">
        <div className="litrova-pdf-page">
          {pdfLoading && <div className="pdf-viewer-state"><LatticeLoader label="Opening your book" color="#69765d" cellSize={6} fontSize={12} showTimer={false}/></div>}
          {!pdfLoading && pdfError && <div className="pdf-viewer-state pdf-viewer-error"><AlertCircle size={25}/><h3>Could not open this PDF</h3><p>{pdfError}</p><button className="button-outline" onClick={()=>window.location.reload()}><RefreshCw size={15}/> Try again</button></div>}
          {!pdfLoading && !pdfError && <div className="litrova-pdf-document" onMouseUp={captureSelection} onKeyUp={captureSelection}>
            <canvas ref={canvasRef} className="litrova-pdf-canvas" aria-label={`Page ${page} of ${pageCount}`}/>
            <div ref={textLayerRef} className="litrova-pdf-text-layer"/>
          </div>}
          {rendering && <span className="pdf-rendering-indicator">Rendering page…</span>}
        </div>
        <div className="page-controls">
          <button className="button-outline" disabled={page <= 1 || pdfLoading || !!pdfError} onClick={() => goToPage(page - 1)}>← Previous</button>
          <span>Page <b>{page}</b> of <b>{pageCount || '—'}</b></span>
          <button className="button-outline" disabled={page >= pageCount || pdfLoading || !!pdfError} onClick={() => goToPage(page + 1)}>Next page →</button>
        </div>
      </section>

      <aside className="reader-notes">
        <span className="eyebrow">YOUR NOTES</span>
        <b>Keep a thought</b>
        {selectedText && <div className="selected-passage"><div><Quote size={14}/> SELECTED PASSAGE</div><p>{selectedText}</p><button type="button" className="clear-selection" onClick={()=>setSelectedText('')}>Clear passage</button></div>}
        <textarea placeholder={`Write a note about page ${page}...`} value={note} onChange={event => setNote(event.target.value)}/>
        <button className="button-solid" onClick={saveNote} disabled={!note.trim() && !selectedText.trim()}>Save to My Workspace</button>
        <p>Select text in the PDF, then add your own thought. Both are saved together.</p>
      </aside>
    </div>
  </div>;
}


function IntelligencePage({ book, notify }) {



  const [input, setInput] = useState('');



  const [messages, setMessages] = useState([]);



  const [sources, setSources] = useState([]);



  const [conversationId, setConversationId] = useState(null);



  const [conversations, setConversations] = useState([]);



  const [sending, setSending] = useState(false);



  const [loadingHistory, setLoadingHistory] = useState(true);







  async function loadConversationList(selectLatest = true) {



    const data = await api(`/chat/conversations?bookId=${encodeURIComponent(book.id)}`);



    const items = data.conversations || [];



    setConversations(items);



    if (selectLatest && items.length) await openConversation(items[0].id);



    else if (!items.length) {



      setConversationId(null);



      setMessages([]);



      setSources([]);



    }



  }







  async function openConversation(id) {



    setLoadingHistory(true);



    try {



      const data = await api(`/chat/conversations/${id}`);



      setConversationId(id);



      setMessages((data.messages || []).map(m => ({



        id: m.id,



        role: m.role,



        content: m.content,



        sources: m.sources || []



      })));



      const lastAssistant = [...(data.messages || [])].reverse().find(m => m.role === 'assistant');



      setSources(lastAssistant?.sources || []);



    } catch (error) {



      notify(error.message || 'Could not load this conversation.');



    } finally {



      setLoadingHistory(false);



    }



  }







  useEffect(() => {



    let cancelled = false;



    async function init() {



      setLoadingHistory(true);



      setConversationId(null);



      setMessages([]);



      setSources([]);



      try {



        const data = await api(`/chat/conversations?bookId=${encodeURIComponent(book.id)}`);



        if (cancelled) return;



        const items = data.conversations || [];



        setConversations(items);



        if (items.length) {



          const latest = await api(`/chat/conversations/${items[0].id}`);



          if (cancelled) return;



          setConversationId(items[0].id);



          setMessages((latest.messages || []).map(m => ({ id: m.id, role: m.role, content: m.content, sources: m.sources || [] })));



          const lastAssistant = [...(latest.messages || [])].reverse().find(m => m.role === 'assistant');



          setSources(lastAssistant?.sources || []);



        }



      } catch (error) {



        if (!cancelled) notify(error.message || 'Could not load conversation history.');



      } finally {



        if (!cancelled) setLoadingHistory(false);



      }



    }



    init();



    return () => { cancelled = true; };



  }, [book.id]);







  function startNewConversation() {



    if (sending) return;



    setConversationId(null);



    setMessages([]);



    setSources([]);



    setInput('');



  }







  async function send(e) {



    e?.preventDefault();



    if (!input.trim() || sending) return;



    const question = input.trim();



    const prior = messages;



    setMessages([...prior, { role: 'user', content: question }]);



    setInput('');



    setSending(true);



    try {



      const data = await api('/chat', {



        method: 'POST',



        body: JSON.stringify({ bookId: book.id, question, conversationId })



      });



      setConversationId(data.conversationId);



      setMessages(current => [...current, { role: 'assistant', content: data.answer, sources: data.sources || [] }]);



      setSources(data.sources || []);



      const list = await api(`/chat/conversations?bookId=${encodeURIComponent(book.id)}`);



      setConversations(list.conversations || []);



    } catch (err) {



      setMessages(current => [...current, { role: 'assistant', content: `I couldn't complete that request: ${err.message}` }]);



      if (err.conversationId) setConversationId(err.conversationId);



    } finally {



      setSending(false);



    }



  }







  async function deleteConversation(id) {



    if (sending) return;



    try {



      await api(`/chat/conversations/${id}`, { method: 'DELETE' });



      const remaining = conversations.filter(item => item.id !== id);



      setConversations(remaining);



      if (conversationId === id) {



        if (remaining.length) await openConversation(remaining[0].id);



        else startNewConversation();



      }



      notify('Conversation deleted.');



    } catch (error) { notify(error.message); }



  }







  return <div className="intelligence-layout">



    <aside className="conversation-rail">



      <div className="conversation-rail-head"><div><span className="eyebrow">YOUR HISTORY</span><h3>Conversations</h3></div><button className="button-solid conversation-new" onClick={startNewConversation} disabled={sending}><Plus size={14}/> New</button></div>



      <div className="conversation-list">



        {conversations.map(item => <div className={`conversation-item ${conversationId === item.id ? 'active' : ''}`} key={item.id}>



          <button className="conversation-select" onClick={() => openConversation(item.id)} disabled={loadingHistory || sending}>



            <b>{item.title || 'New conversation'}</b>



            <small>{item.message_count || 0} messages</small>



            <span>{item.last_message || 'No messages yet'}</span>



          </button>



          <button className="conversation-delete" title="Delete conversation" onClick={() => deleteConversation(item.id)} disabled={sending}><Trash2 size={14}/></button>



        </div>)}



        {!conversations.length && !loadingHistory && <p className="conversation-empty">Your book conversations will appear here.</p>}



        {loadingHistory && <p className="conversation-empty">Loading history…</p>}



      </div>



    </aside>



    <section className="intelligence-chat">



      <div className="intelligence-heading"><span className="eyebrow">BOOK INTELLIGENCE</span><h1>Think beyond<br/><em>the page.</em></h1><p>Ask questions, untangle concepts and follow ideas through <b>{book.title}</b>.</p></div>



      {!messages.length && !loadingHistory && <div className="prompt-suggestions"><button onClick={() => setInput('Give me a concise summary of this book.')}><Sparkles size={15}/> Summarize this book</button><button onClick={() => setInput('What are the most important ideas in this book?')}><BrainCircuit size={15}/> Key ideas</button><button onClick={() => setInput('Explain the central concept in simple language.')}><MessageCircle size={15}/> Explain a concept</button></div>}



      <div className="chat-messages">



        {loadingHistory && <p className="muted">Restoring your conversation…</p>}



        {messages.map((m, i) => <div key={m.id || `${m.role}-${i}`} className={`chat-message ${m.role}`}><span className="chat-avatar">{m.role === 'assistant' ? <BookOpen size={16}/> : <UserRound size={16}/>}</span><div><small>{m.role === 'assistant' ? 'Litrova' : 'You'}</small><p>{m.content}</p></div></div>)}



        {sending && <div className="chat-message assistant"><span className="chat-avatar"><BookOpen size={16}/></span><div><small>Litrova</small><p className="muted"><LatticeLoader label="Thinking through the pages" color="#69765d" cellSize={5} fontSize={11} showTimer={false}/></p></div></div>}



      </div>



      <form className="chat-composer" onSubmit={send}><textarea rows="2" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={`Ask something about ${book.title}...`}/><div><span><ShieldCheckIcon/> Grounded in your uploaded book</span><button disabled={!input.trim() || sending || loadingHistory}><Send size={17}/></button></div></form>



      <p className="chat-disclaimer">AI responses can make mistakes. Always check the cited passages.</p>



    </section>



    <aside className="source-rail"><div className="source-rail-head"><div><span className="eyebrow">BOOK CONTEXT</span><h3>Sources & passages</h3></div><Quote size={18}/></div>{sources.length ? sources.map(s => <article className="source-result" key={s.id}><small>SOURCE {s.id} · PAGE {s.pageStart || '?'}{s.pageEnd && s.pageEnd !== s.pageStart ? `–${s.pageEnd}` : ''}</small><p>{s.excerpt}…</p></article>) : <div className="source-empty"><FileText size={22}/><b>Your references will appear here</b><p>Ask a question and Litrova will show the passages used to shape its answer.</p></div>}<div className="source-trust"><CheckCircle2 size={15}/> Verify answers against the original text.</div></aside>



  </div>;



}



function ShieldCheckIcon(){return <CheckCircle2 size={13}/>;}



function CharacterPage({ book }) { return <div className="page-stack"><PageIntro eyebrow="CHARACTER STUDIO" title={<>Step inside<br/><em>the story.</em></>} description={`Explore the people and perspectives within ${book.title}.`}/><div className="feature-banner"><span className="banner-icon"><Users size={24}/></span><div><span className="eyebrow">CHARACTER INTELLIGENCE</span><h2>Meet the minds behind the pages.</h2><p>Character detection, profiles, relationships and book-faithful point-of-view conversations are planned for this studio.</p></div></div><div className="feature-grid three"><Feature n="01" icon={Users} title="Character directory" text="Discover characters and their roles, traits and relationships."/><Feature n="02" icon={MessageCircle} title="Point-of-view chat" text="Ask a character questions while respecting what they know in the story."/><Feature n="03" icon={Clock3} title="Story timeline" text="Explore character development and key events across chapters."/></div><div className="notice-line"><AlertCircle size={16}/> Character detection and POV chat are not connected in this starter build yet.</div></div>; }



function VoicePage({ book }) { const [listening,setListening]=useState(false);return <div className="voice-studio"><span className="eyebrow">VOICE STUDIO · {book.title.toUpperCase()}</span><div className="voice-orb"><div className="orb-ring ring-one"/><div className="orb-ring ring-two"/><span><AudioLines size={35}/></span></div><h1>Let the book<br/><em>speak to you.</em></h1><p>Ask a question out loud and listen to a book-grounded explanation.</p><button className={`voice-button ${listening?'listening':''}`} onClick={()=>setListening(!listening)}><Mic2 size={19}/>{listening?'Stop listening':'Hold to talk'}</button><small>{listening?'Voice capture is a visual prototype; speech recognition is not connected yet.':'Voice conversations are planned for a later implementation phase.'}</small><div className="voice-settings"><span><Headphones size={16}/> Voice output</span><span>Not connected</span><span><SlidersHorizontal size={16}/> Language</span><span>English · Hindi planned</span></div></div>; }



function WorkspacePage({ books }) {
  let storedNotes = [];
  let storedBookmarks = [];
  try { storedNotes = JSON.parse(localStorage.getItem('litrova_notes') || '[]'); } catch { /* ignore malformed local data */ }
  try { storedBookmarks = JSON.parse(localStorage.getItem('litrova_bookmarks') || '[]'); } catch { /* ignore malformed local data */ }
  const [notes, setNotes] = useState(storedNotes);
  const [bookmarks] = useState(storedBookmarks);
  const [tab, setTab] = useState('notes');
  const bookMap = new Map(books.map(book => [String(book.id), book]));

  useEffect(() => {
    function refreshNotes() {
      try { setNotes(JSON.parse(localStorage.getItem('litrova_notes') || '[]')); } catch { setNotes([]); }
    }
    window.addEventListener('storage', refreshNotes);
    window.addEventListener('litrova-notes-updated', refreshNotes);
    return () => {
      window.removeEventListener('storage', refreshNotes);
      window.removeEventListener('litrova-notes-updated', refreshNotes);
    };
  }, []);

  return <div className="page-stack">
    <PageIntro eyebrow="YOUR KNOWLEDGE, KEPT" title={<>A space for <em>what stays.</em></>} description="Bring together the passages, thoughts and answers worth returning to."/>
    <div className="workspace-tabs">{[{k:'notes',t:'Notes',i:NotebookTabs},{k:'bookmarks',t:'Bookmarks',i:Bookmark},{k:'highlights',t:'Highlights',i:Highlighter},{k:'answers',t:'Saved answers',i:Sparkles}].map(item=><button className={tab===item.k?'active':''} key={item.k} onClick={()=>setTab(item.k)}><item.i size={16}/>{item.t}</button>)}</div>
    {tab === 'notes' ? notes.length ? <div className="saved-notes">{notes.map((item,index)=><article key={item.id || `${item.bookId}-${item.createdAt}-${index}`}>
      <span className="eyebrow">{item.bookTitle} · PAGE {item.page}</span>
      {item.selectedText && <blockquote className="saved-passage">{item.selectedText}</blockquote>}
      {item.note && <p>{item.note}</p>}
      <small>{new Date(item.createdAt).toLocaleDateString()}</small>
      {bookMap.has(String(item.bookId)) && <Link className="text-action" to={`/reader/${item.bookId}?page=${item.page}`}>Return to this page <ArrowUpRight size={14}/></Link>}
    </article>)}</div> : <EmptyState icon={NotebookTabs} title="Your notes will live here." text="Select a passage in Reader Studio, add a thought, and save it here."/> :
    tab === 'bookmarks' ? bookmarks.length ? <div className="saved-notes">{bookmarks.map((item,index)=><article className="saved-bookmark" key={`${item.bookId}-${item.page}-${index}`}><span className="eyebrow">{item.bookTitle} · PAGE {item.page}</span><p>Bookmarked page {item.page}</p>{bookMap.has(String(item.bookId)) && <Link className="text-action" to={`/reader/${item.bookId}?page=${item.page}`}>Open this page <ArrowUpRight size={14}/></Link>}</article>)}</div> : <EmptyState icon={Bookmark} title="No bookmarked pages yet." text="Bookmark a page in Reader Studio to find it here."/> :
    <EmptyState icon={tab==='highlights'?Highlighter:Sparkles} title="Nothing saved here yet." text="This collection will fill up as you explore and save useful ideas."/>}
  </div>;
}


function SettingsPage({ user, theme, setTheme }) { const [tab,setTab]=useState('profile');return <div className="page-stack"><PageIntro eyebrow="YOUR ACCOUNT" title={<>Make this space<br/><em>your own.</em></>} description="Manage your profile and reading preferences."/><div className="settings-layout"><nav>{[{k:'profile',t:'Profile',i:UserRound},{k:'appearance',t:'Appearance',i:Sun},{k:'preferences',t:'Preferences',i:SlidersHorizontal},{k:'account',t:'Account',i:Settings}].map(x=><button className={tab===x.k?'active':''} key={x.k} onClick={()=>setTab(x.k)}><x.i size={17}/>{x.t}</button>)}</nav><section className="settings-panel"><span className="eyebrow">{tab.toUpperCase()}</span>{tab==='profile'?<><h2>Profile details</h2><div className="profile-detail"><span className="avatar large">{user.name?.[0]?.toUpperCase()||'L'}</span><div><b>{user.name||'Reader'}</b><small>{user.email}</small></div></div><p className="muted">Your account details are managed securely by Litrova.</p></>:tab==='appearance'?<><h2>Appearance</h2><p>Choose the reading environment that feels right.</p><div className="theme-options"><button className={theme==='light'?'selected':''} onClick={()=>setTheme('light')}><Sun size={19}/> Warm light</button><button className={theme==='dark'?'selected':''} onClick={()=>setTheme('dark')}><Moon size={19}/> Dark mode</button></div></>:<><h2>{tab==='preferences'?'Reading preferences':'Account settings'}</h2><p className="muted">More controls will be added as the account and reading features are implemented.</p><div className="notice-line"><AlertCircle size={16}/> This section is part of the UI foundation; settings sync is not connected yet.</div></>}</section></div></div>; }



function PlaceholderPage({ icon:Icon, title, description }) { return <EmptyState icon={Icon} title={title} text={description}/>; }







export default App;
