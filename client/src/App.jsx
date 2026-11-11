import { useEffect, useMemo, useState } from 'react';
import { Routes, Route, Navigate, NavLink, Link, Outlet, useNavigate, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, LayoutDashboard, Library, BrainCircuit, NotebookTabs, Settings, Search,
  Bell, UserRound, Menu, X, PanelLeftClose, PanelLeftOpen, ChevronRight, ArrowUpRight,
  UploadCloud, Plus, FileText, Sparkles, MessageCircle, Mic2, Users, Bookmark,
  Highlighter, Clock3, CheckCircle2, AlertCircle, LoaderCircle, Send, Quote,
  LogOut, Moon, Sun, Trash2, Download, Headphones, ListFilter, SlidersHorizontal,
  Command, BookMarked, AudioLines, PanelTop, RefreshCw
} from 'lucide-react';
import { api, uploadFile, clearSession, getToken, getUser, setSession } from './lib/api';

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
  const [theme, setTheme] = useState(localStorage.getItem('litrova_theme') || 'light');
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
        <Route path="reader/:bookId" element={<BookRoutePage kind="reader" books={books} activeBook={activeBook} setActiveBook={setActiveBook} notify={notify}/>} />
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
      <div className="hero-visual" aria-label="Litrova book illustration"><div className="visual-halo halo-a"/><div className="visual-halo halo-b"/><div className="floating-tag tag-a"><Sparkles size={14}/> Ideas, connected.</div><div className="hero-book"><div className="hero-book-spine"/><div className="hero-book-cover"><span className="cover-symbol">L.</span><span className="cover-heading">The art<br/>of being<br/><i>human.</i></span><span className="cover-caption">A LITROVA READING EXPERIENCE</span></div></div><div className="floating-tag tag-b"><Quote size={14}/> Every page has more to say.</div><span className="visual-caption">READ · REFLECT · RESPOND</span></div></section>
    <section className="landing-section wrap" id="experience"><div className="section-heading"><span className="eyebrow">BEYOND THE PAGE</span><h2>Don't just read the story.<br/><em>Step into it.</em></h2><p>Litrova turns your books and documents into thoughtful companions. Bring your curiosity; the pages bring the context.</p></div><div className="feature-grid"><Feature n="01" icon={UploadCloud} title="Bring your book" text="Upload a PDF and let Litrova prepare its ideas and passages for exploration."/><Feature n="02" icon={MessageCircle} title="Start a conversation" text="Ask questions in your own words. Follow a thought wherever it leads."/><Feature n="03" icon={Quote} title="Go to the source" text="Explore the passages behind an answer and keep the book in view."/></div></section>
    <section className="landing-cta wrap" id="how"><div><span className="eyebrow">YOUR NEXT CHAPTER</span><h2>A library that<br/><em>talks back.</em></h2></div><button className="button-container button-container-invert" onClick={onStart}><span className="button-border"><span className="button-inner">Start exploring <ArrowUpRight size={17}/></span></span></button></section>
    <footer className="landing-footer wrap"><Brand/><span>Where Books Come Alive.</span><span>© 2026 Litrova</span></footer>
  </main>;
}
function Feature({ n, icon: Icon, title, text }) { return <article className="feature-card"><div className="feature-top"><span>{n}</span><Icon size={20}/></div><h3>{title}</h3><p>{text}</p></article>; }

function Auth({ onSuccess }) {
  const [mode, setMode] = useState('login'); const [form, setForm] = useState({ name: '', email: '', password: '' }); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function submit(e) { e.preventDefault(); setBusy(true); setError(''); try { const data = await api(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(form) }); onSuccess(data); } catch (err) { setError(err.message); } finally { setBusy(false); } }
  return <main className="auth-screen"><section className="auth-art"><Brand/><div><span className="eyebrow">A SPACE FOR CURIOSITY</span><h1>Every page has<br/>more to <em>say.</em></h1><p>Meet your books again, this time through conversation.</p></div><span className="auth-art-foot">LITROVA · WHERE BOOKS COME ALIVE</span></section><section className="auth-main"><Link to="/" className="quiet-link">← Back to home</Link><div className="auth-card"><span className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'BEGIN YOUR STORY'}</span><h2>{mode === 'login' ? 'Return to your library.' : 'Create your account.'}</h2><p>{mode === 'login' ? 'Your next conversation is waiting.' : 'A thoughtful reading space, made yours.'}</p><form onSubmit={submit}>{mode === 'signup' && <label>Your name<input required minLength="2" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your name"/></label>}<label>Email address<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com" autoComplete="username"/></label><label>Password<input required minLength="8" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="At least 8 characters" autoComplete={mode === 'login' ? 'current-password' : 'new-password'}/></label>{error && <div className="form-error"><AlertCircle size={15}/>{error}</div>}<button className="button-solid full" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'} <ArrowUpRight size={16}/></button></form><p className="auth-switch">{mode === 'login' ? 'New to Litrova?' : 'Already have an account?'} <button onClick={()=>{setMode(mode==='login'?'signup':'login');setError('')}}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p><div className="privacy-note"><CheckCircle2 size={15}/> Your library is private to your account.</div></div></section></main>;
}

function AppShell({ user, books, loadingBooks, reloadBooks, activeBook, setActiveBook, collapsed, setCollapsed, theme, setTheme, onLogout, notify }) {
  const [mobileOpen, setMobileOpen] = useState(false); const [searchOpen, setSearchOpen] = useState(false); const [search, setSearch] = useState(''); const location = useLocation();
  const isBookPath = /^\/(reader|intelligence|books)\//.test(location.pathname);
  const currentBookId = location.pathname.split('/').filter(Boolean)[1];
  const currentBook = books.find(b => String(b.id) === currentBookId) || activeBook;
  const results = useMemo(() => { const q = search.toLowerCase(); return books.filter(b => b.title?.toLowerCase().includes(q)); }, [books, search]);
  useEffect(() => { function onKey(e) { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(true); } if (e.key === 'Escape') setSearchOpen(false); } window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, []);
  function chooseBook(book) { setActiveBook(book); setSearchOpen(false); setSearch(''); }
  return <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
    <aside className={`app-sidebar ${mobileOpen ? 'mobile-open' : ''}`}><div className="sidebar-top"><Brand/><button className="icon-btn collapse-btn" title={collapsed?'Expand sidebar':'Collapse sidebar'} onClick={()=>setCollapsed(!collapsed)}>{collapsed?<PanelLeftOpen size={18}/>:<PanelLeftClose size={18}/>}</button><button className="icon-btn mobile-close" onClick={()=>setMobileOpen(false)}><X size={19}/></button></div><div className="sidebar-section-label">YOUR SPACE</div><nav className="primary-nav">{NAV.map(item=><NavLink key={item.to} to={item.to} title={collapsed?item.label:undefined} className={({isActive})=>`nav-item ${isActive?'active':''}`} onClick={()=>setMobileOpen(false)}><item.icon size={18}/><span>{item.label}</span></NavLink>)}</nav><div className="sidebar-section-label books-label"><span>RECENT BOOKS</span><span>{books.length}</span></div><div className="sidebar-book-list">{books.slice(0,6).map((book,i)=><Link key={book.id} to={`/intelligence/${book.id}`} title={collapsed?book.title:undefined} className={`sidebar-book ${String(currentBook?.id)===String(book.id)?'active':''}`} onClick={()=>{chooseBook(book);setMobileOpen(false)}}><span className={`mini-book mini-book-${i%4}`}><BookOpen size={13}/></span><span>{book.title}</span></Link>)}{!books.length && !loadingBooks && <span className="sidebar-empty">{collapsed?'—':'Your books will appear here'}</span>}</div><div className="sidebar-bottom"><NavLink to="/settings" title={collapsed?'Settings':undefined} className={({isActive})=>`nav-item ${isActive?'active':''}`} onClick={()=>setMobileOpen(false)}><Settings size={18}/><span>Settings</span></NavLink><div className="profile-mini"><span className="avatar">{user.name?.[0]?.toUpperCase()||'L'}</span><span className="profile-name"><b>{user.name || 'Reader'}</b><small>Personal library</small></span><button className="icon-btn signout-btn" title="Sign out" onClick={onLogout}><LogOut size={16}/></button></div></div></aside>
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
function BookCard({ book, index=0 }) { return <motion.article className="book-card" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:index*.05}}><Link to={`/intelligence/${book.id}`} className={`book-cover-card cover-tone-${index%4}`}><span className="cover-monogram">L.</span><BookOpen size={27}/><b>{book.title}</b><small>LITROVA LIBRARY</small></Link><div className="book-card-info"><b>{book.title}</b><small>{book.page_count || '—'} pages · {book.status==='ready'?'Ready':book.status}</small><Link to={`/reader/${book.id}`} className="text-action">Open book <ArrowUpRight size={14}/></Link></div></motion.article>; }
function EmptyState({ icon: Icon, title, text, action }) { return <div className="empty-state"><span className="empty-icon"><Icon size={24}/></span><h3>{title}</h3><p>{text}</p>{action}</div>; }

function LibraryPage({ books, loading, reload, notify, setActiveBook }) {
  const [query,setQuery]=useState('');
  const [file,setFile]=useState(null);
  const [title,setTitle]=useState('');
  const [uploading,setUploading]=useState(false);
  const [uploadPercent,setUploadPercent]=useState(0);
  const [filter,setFilter]=useState('all');

  const filtered=books.filter(b=>b.title?.toLowerCase().includes(query.toLowerCase())&&(filter==='all'||(filter==='ready'?b.status==='ready':filter==='processing'?b.status==='processing':b.status==='failed')));
  const hasProcessing = books.some(book => book.status === 'processing');

  useEffect(() => {
    if (!hasProcessing) return undefined;
    const timer = window.setInterval(() => reload(), 2500);
    return () => window.clearInterval(timer);
  }, [hasProcessing, reload]);

  async function upload(e) {
    e.preventDefault();
    if (!file || uploading) return;
    setUploading(true);
    setUploadPercent(0);
    try {
      const body=new FormData();
      body.append('file',file);
      body.append('title',title);
      const result=await uploadFile('/books/upload',body,setUploadPercent);
      setFile(null);
      setTitle('');
      await reload();
      notify(result.message || 'PDF uploaded. Processing has started.');
    } catch(err) {
      notify(err.message);
    } finally {
      setUploading(false);
      setUploadPercent(0);
    }
  }

  const stageLabel = (book) => ({queued:'Queued',extracting:'Extracting PDF text',embedding:'Generating embeddings',saving:'Saving to your library',ready:'Ready to explore',failed:'Processing failed'}[book.processing_stage] || (book.status === 'processing' ? 'Preparing book' : book.status));

  return <div className="page-stack">
    <PageIntro eyebrow="YOUR PERSONAL COLLECTION" title={<>A library of <em>possibilities.</em></>} description="Every book is a new conversation waiting to happen." action={<label className="button-solid upload-label"><Plus size={17}/> Add a book<input type="file" accept="application/pdf,.pdf" hidden onChange={e=>setFile(e.target.files?.[0]||null)}/></label>}/>
    <div className="library-toolbar"><div className="input-search"><Search size={17}/><input placeholder="Search your library..." value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="filter-control"><ListFilter size={16}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All books</option><option value="ready">Ready</option><option value="processing">Processing</option><option value="failed">Failed</option></select></div><button className="icon-btn bordered" onClick={reload} title="Refresh library"><RefreshCw size={17}/></button></div>
    {file&&<form className="upload-card upload-card-stack" onSubmit={upload}>
      <div className="upload-file"><FileText size={20}/><span><b>{file.name}</b><small>{(file.size/1024/1024).toFixed(1)} MB · PDF</small></span></div>
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Book title (optional)"/>
      <button className="button-solid" disabled={uploading}>{uploading?<><LoaderCircle className="spin" size={16}/> Uploading {uploadPercent}%</>:'Upload & prepare'}</button>
      <button type="button" className="icon-btn" disabled={uploading} onClick={()=>setFile(null)}><X size={17}/></button>
      {uploading&&<div className="upload-progress"><div className="progress-track"><span style={{width:`${uploadPercent}%`}}/></div><small>Uploading PDF to Litrova… {uploadPercent}%</small></div>}
    </form>}
    {loading?<div className="loading-state"><LoaderCircle className="spin"/> Loading your library...</div>:filtered.length?<div className="library-grid">{filtered.map((book,i)=><div className="library-book-wrap" key={book.id}><BookCard book={book} index={i}/>{book.status==='processing'&&<div className="book-processing"><div className="processing-label"><LoaderCircle className="spin" size={14}/><b>{stageLabel(book)}</b><span>{book.processing_percent||0}%</span></div><div className="progress-track"><span style={{width:`${book.processing_percent||0}%`}}/></div><small>{book.processed_chunks||0} / {book.total_chunks||'—'} chunks processed</small></div>}{book.status==='failed'&&<div className="book-failed"><AlertCircle size={14}/><span>{book.processing_error||'Could not prepare this PDF. Delete it and try again.'}</span></div>}</div>)}</div>:<EmptyState icon={Library} title={books.length?'No books match your search.':'Your library is waiting for its first book.'} text={books.length?'Try a different title or filter.':'Add a text-based PDF and Litrova will prepare it for exploration.'} action={!books.length?<label className="button-solid upload-label"><UploadCloud size={16}/> Choose a PDF<input type="file" accept="application/pdf,.pdf" hidden onChange={e=>setFile(e.target.files?.[0]||null)}/></label>:null}/>}
  </div>;
}

function BookRoutePage({ kind, books, activeBook, setActiveBook, notify }) {
  const { bookId }=useParams(); const book=books.find(b=>String(b.id)===bookId)||activeBook; const navigate=useNavigate();
  useEffect(()=>{if(book)setActiveBook(book);},[bookId,book]);
  if(!book)return <EmptyState icon={BookOpen} title="Book not found in this library." text="Return to your library and choose a book to continue." action={<Link className="button-solid" to="/library">Open library</Link>}/>;
  if(kind==='intelligence')return <IntelligencePage book={book} notify={notify}/>;
  if(kind==='reader')return <ReaderPage book={book} notify={notify}/>;
  if(kind==='characters')return <CharacterPage book={book}/>;
  return <VoicePage book={book}/>;
}
function ReaderPage({ book, notify }) {
  const [page,setPage]=useState(1);const [font,setFont]=useState(18);const [note,setNote]=useState('');const [saved,setSaved]=useState(false);
  const max=Number(book.page_count)||1;
  return <div className="reader-workspace"><div className="reader-toolbar"><div><span className="eyebrow">READING ROOM</span><b>{book.title}</b></div><div className="reader-tools"><button className="icon-btn bordered" title="Decrease text size" onClick={()=>setFont(Math.max(14,font-1))}>A−</button><button className="icon-btn bordered" title="Increase text size" onClick={()=>setFont(Math.min(26,font+1))}>A+</button><button className={`icon-btn bordered ${saved?'is-saved':''}`} title="Bookmark page" onClick={()=>{setSaved(!saved);notify(saved?'Bookmark removed':'Page bookmarked');}}><Bookmark size={17}/></button></div></div><div className="reader-layout"><aside className="reader-toc"><span className="eyebrow">CONTENTS</span><b>Document navigation</b><p>Chapter navigation will appear when the PDF outline is available.</p><div className="toc-placeholder"><ListFilter size={17}/> No table of contents detected yet</div></aside><section className="reader-page-area"><div className="paper-page"><span className="paper-kicker">{book.title}</span><h2>Let the reading begin.</h2><p style={{fontSize:font}}>Your uploaded document is stored and processed by Litrova. The embedded PDF reader and page rendering will be connected in the next implementation pass. For now, use the page controls to prepare the reading workspace.</p><p className="paper-muted">A good question can open a page in an entirely new way.</p><span className="paper-page-number">{page}</span></div><div className="page-controls"><button className="button-outline" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Previous</button><span>Page <b>{page}</b> of {max}</span><button className="button-outline" disabled={page>=max} onClick={()=>setPage(p=>p+1)}>Next page</button></div></section><aside className="reader-notes"><span className="eyebrow">YOUR NOTES</span><b>Keep a thought</b><textarea placeholder="Write a note about this page..." value={note} onChange={e=>setNote(e.target.value)}/><button className="button-solid" onClick={()=>{if(!note.trim())return;const old=JSON.parse(localStorage.getItem('litrova_notes')||'[]');localStorage.setItem('litrova_notes',JSON.stringify([{bookId:book.id,bookTitle:book.title,page,note,createdAt:new Date().toISOString()},...old]));setNote('');notify('Note saved to My Workspace.');}}>Save note</button><p>Notes are saved locally in this starter. Cloud sync will be added with the workspace API.</p></aside></div></div>;
}
function IntelligencePage({ book, notify }) {
  const [input,setInput]=useState('');const [messages,setMessages]=useState([]);const [sources,setSources]=useState([]);const [conversationId,setConversationId]=useState(null);const [sending,setSending]=useState(false);
  async function send(e){e?.preventDefault();if(!input.trim()||sending)return;const question=input.trim();const prior=messages;setMessages([...prior,{role:'user',content:question}]);setInput('');setSending(true);try{const data=await api('/chat',{method:'POST',body:JSON.stringify({bookId:book.id,question,conversationId,history:prior})});setConversationId(data.conversationId);setMessages([...prior,{role:'user',content:question},{role:'assistant',content:data.answer}]);setSources(data.sources||[]);}catch(err){setMessages([...prior,{role:'user',content:question},{role:'assistant',content:`I couldn't complete that request: ${err.message}`}]);}finally{setSending(false);}}
  return <div className="intelligence-layout"><section className="intelligence-chat"><div className="intelligence-heading"><span className="eyebrow">BOOK INTELLIGENCE</span><h1>Think beyond<br/><em>the page.</em></h1><p>Ask questions, untangle concepts and follow ideas through <b>{book.title}</b>.</p></div>{!messages.length&&<div className="prompt-suggestions"><button onClick={()=>setInput('Give me a concise summary of this book.')}> <Sparkles size={15}/> Summarize this book</button><button onClick={()=>setInput('What are the most important ideas in this book?')}> <BrainCircuit size={15}/> Key ideas</button><button onClick={()=>setInput('Explain the central concept in simple language.')}> <MessageCircle size={15}/> Explain a concept</button></div>}<div className="chat-messages">{messages.map((m,i)=><div key={i} className={`chat-message ${m.role}`}><span className="chat-avatar">{m.role==='assistant'?<BookOpen size={16}/>:<UserRound size={16}/>}</span><div><small>{m.role==='assistant'?'Litrova':'You'}</small><p>{m.content}</p></div></div>)}{sending&&<div className="chat-message assistant"><span className="chat-avatar"><BookOpen size={16}/></span><div><small>Litrova</small><p className="muted">Thinking through the pages…</p></div></div>}</div><form className="chat-composer" onSubmit={send}><textarea rows="2" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}} placeholder={`Ask something about ${book.title}...`}/><div><span><ShieldCheckIcon/> Grounded in your uploaded book</span><button disabled={!input.trim()||sending}><Send size={17}/></button></div></form><p className="chat-disclaimer">AI responses can make mistakes. Always check the cited passages.</p></section><aside className="source-rail"><div className="source-rail-head"><div><span className="eyebrow">BOOK CONTEXT</span><h3>Sources & passages</h3></div><Quote size={18}/></div>{sources.length?sources.map(s=><article className="source-result" key={s.id}><small>SOURCE {s.id} · PAGE {s.pageStart||'?'}{s.pageEnd&&s.pageEnd!==s.pageStart?`–${s.pageEnd}`:''}</small><p>{s.excerpt}…</p></article>):<div className="source-empty"><FileText size={22}/><b>Your references will appear here</b><p>Ask a question and Litrova will show the passages used to shape its answer.</p></div>}<div className="source-trust"><CheckCircle2 size={15}/> Verify answers against the original text.</div></aside></div>;
}
function ShieldCheckIcon(){return <CheckCircle2 size={13}/>;}
function CharacterPage({ book }) { return <div className="page-stack"><PageIntro eyebrow="CHARACTER STUDIO" title={<>Step inside<br/><em>the story.</em></>} description={`Explore the people and perspectives within ${book.title}.`}/><div className="feature-banner"><span className="banner-icon"><Users size={24}/></span><div><span className="eyebrow">CHARACTER INTELLIGENCE</span><h2>Meet the minds behind the pages.</h2><p>Character detection, profiles, relationships and book-faithful point-of-view conversations are planned for this studio.</p></div></div><div className="feature-grid three"><Feature n="01" icon={Users} title="Character directory" text="Discover characters and their roles, traits and relationships."/><Feature n="02" icon={MessageCircle} title="Point-of-view chat" text="Ask a character questions while respecting what they know in the story."/><Feature n="03" icon={Clock3} title="Story timeline" text="Explore character development and key events across chapters."/></div><div className="notice-line"><AlertCircle size={16}/> Character detection and POV chat are not connected in this starter build yet.</div></div>; }
function VoicePage({ book }) { const [listening,setListening]=useState(false);return <div className="voice-studio"><span className="eyebrow">VOICE STUDIO · {book.title.toUpperCase()}</span><div className="voice-orb"><div className="orb-ring ring-one"/><div className="orb-ring ring-two"/><span><AudioLines size={35}/></span></div><h1>Let the book<br/><em>speak to you.</em></h1><p>Ask a question out loud and listen to a book-grounded explanation.</p><button className={`voice-button ${listening?'listening':''}`} onClick={()=>setListening(!listening)}><Mic2 size={19}/>{listening?'Stop listening':'Hold to talk'}</button><small>{listening?'Voice capture is a visual prototype; speech recognition is not connected yet.':'Voice conversations are planned for a later implementation phase.'}</small><div className="voice-settings"><span><Headphones size={16}/> Voice output</span><span>Not connected</span><span><SlidersHorizontal size={16}/> Language</span><span>English · Hindi planned</span></div></div>; }
function WorkspacePage({ books }) { const notes=JSON.parse(localStorage.getItem('litrova_notes')||'[]');const [tab,setTab]=useState('notes');return <div className="page-stack"><PageIntro eyebrow="YOUR KNOWLEDGE, KEPT" title={<>A space for <em>what stays.</em></>} description="Bring together the passages, thoughts and answers worth returning to."/><div className="workspace-tabs">{[{k:'notes',t:'Notes',i:NotebookTabs},{k:'bookmarks',t:'Bookmarks',i:Bookmark},{k:'highlights',t:'Highlights',i:Highlighter},{k:'answers',t:'Saved answers',i:Sparkles}].map(x=><button className={tab===x.k?'active':''} key={x.k} onClick={()=>setTab(x.k)}><x.i size={16}/>{x.t}</button>)}</div>{tab==='notes'?notes.length?<div className="saved-notes">{notes.map((n,i)=><article key={i}><span className="eyebrow">{n.bookTitle} · PAGE {n.page}</span><p>{n.note}</p><small>{new Date(n.createdAt).toLocaleDateString()}</small></article>)}</div>:<EmptyState icon={NotebookTabs} title="Your notes will live here." text="Save thoughts from Reader Studio and return to them whenever you need."/>:<EmptyState icon={tab==='bookmarks'?Bookmark:tab==='highlights'?Highlighter:Sparkles} title="Nothing saved here yet." text="This collection will fill up as you explore and save useful ideas."/>}</div>; }
function SettingsPage({ user, theme, setTheme }) { const [tab,setTab]=useState('profile');return <div className="page-stack"><PageIntro eyebrow="YOUR ACCOUNT" title={<>Make this space<br/><em>your own.</em></>} description="Manage your profile and reading preferences."/><div className="settings-layout"><nav>{[{k:'profile',t:'Profile',i:UserRound},{k:'appearance',t:'Appearance',i:Sun},{k:'preferences',t:'Preferences',i:SlidersHorizontal},{k:'account',t:'Account',i:Settings}].map(x=><button className={tab===x.k?'active':''} key={x.k} onClick={()=>setTab(x.k)}><x.i size={17}/>{x.t}</button>)}</nav><section className="settings-panel"><span className="eyebrow">{tab.toUpperCase()}</span>{tab==='profile'?<><h2>Profile details</h2><div className="profile-detail"><span className="avatar large">{user.name?.[0]?.toUpperCase()||'L'}</span><div><b>{user.name||'Reader'}</b><small>{user.email}</small></div></div><p className="muted">Your account details are managed securely by Litrova.</p></>:tab==='appearance'?<><h2>Appearance</h2><p>Choose the reading environment that feels right.</p><div className="theme-options"><button className={theme==='light'?'selected':''} onClick={()=>setTheme('light')}><Sun size={19}/> Warm light</button><button className={theme==='dark'?'selected':''} onClick={()=>setTheme('dark')}><Moon size={19}/> Dark mode</button></div></>:<><h2>{tab==='preferences'?'Reading preferences':'Account settings'}</h2><p className="muted">More controls will be added as the account and reading features are implemented.</p><div className="notice-line"><AlertCircle size={16}/> This section is part of the UI foundation; settings sync is not connected yet.</div></>}</section></div></div>; }
function PlaceholderPage({ icon:Icon, title, description }) { return <EmptyState icon={Icon} title={title} text={description}/>; }

export default App;
