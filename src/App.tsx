import * as React from 'react';
import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  BookOpen, 
  Building2, 
  ChevronDown, 
  ChevronRight, 
  ClipboardList, 
  CreditCard, 
  FileText, 
  LayoutDashboard, 
  LogOut, 
  Package, 
  Receipt, 
  Settings, 
  ShoppingCart, 
  Users, 
  Wallet,
  Calculator,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast, Toaster } from 'sonner';

// Custom Components
import QuotationEditor from './components/QuotationEditor';
import SalesModule from './components/SalesModule';
import PurchaseModule from './components/PurchaseModule';
import InventoryModule from './components/InventoryModule';
import AccountingModule from './components/AccountingModule';
import UserManagementModule from './components/UserManagement';
import ReportsModule from './components/ReportsModule';
import MasterDataModule from './components/MasterDataModule';
import ProjectsModule from './components/ProjectsModule';

// --- TYPES ---
interface User {
  username: string;
  role: string;
}

interface NavItem {
  title: string;
  icon: any;
  subItems?: string[];
  module: string;
}

// --- CONSTANTS ---
const NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, module: 'dashboard' },
  { title: 'Sales', icon: Receipt, module: 'sales', subItems: ['Quotations', 'Draft Quotations', 'Sales Orders', 'Customers'] },
  { title: 'Purchases', icon: ShoppingCart, module: 'purchases', subItems: ['Purchases', 'Suppliers'] },
  { title: 'Inventory', icon: Package, module: 'inventory', subItems: ['Stock List'] },
  { title: 'Accounting', icon: BookOpen, module: 'accounting', subItems: ['Chart of Accounts', 'Ledger', 'Journal Entries', 'Payables', 'Receivables', 'Bank Reconciliation', 'Account Analytics', 'Financial Tracking'] },
  { title: 'Projects', icon: Building2, module: 'projects', subItems: ['Financial Tracking', 'Active Projects', 'Units Registry', 'Project Sub categories', 'Project Categories'] },
  { title: 'Reports', icon: BarChart3, module: 'reports', subItems: ['Profit & Loss', 'Balance Sheet (Horizontal)', 'Trial Balance', 'Project Cost Analysis'] },
  { title: 'Users', icon: Users, module: 'users', subItems: ['My Profile', 'Manage Users'] },
  { title: 'Master Data', icon: Settings, module: 'master-data', subItems: ['Company Details'] },
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentModule, setCurrentModule] = useState('dashboard');
  const [currentSubModule, setCurrentSubModule] = useState('');
  const [urlParams, setUrlParams] = useState<URLSearchParams | null>(null);
  const [openMenus, setOpenMenus] = useState<string[]>(['Sales', 'Accounting', 'Reports']);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUrlParams(params);
    const mod = params.get('mod');
    const sub = params.get('sub');
    if (mod) setCurrentModule(mod);
    if (sub) setCurrentSubModule(sub);
    
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (err) {} finally { setLoading(false); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        // Refresh params on login
        const params = new URLSearchParams(window.location.search);
        setUrlParams(params);
        toast.success(`Access granted. Welcome to Itqan ERP.`);
      } else {
        toast.error('Invalid credentials');
      }
    } catch (err) {
      toast.error('Connection failed');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    setUser(null);
  };

  const toggleMenu = (title: string) => {
    setOpenMenus(prev => 
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const renderModule = () => {
    switch (currentModule) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Financial Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-none bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <p className="text-[11px] text-primary font-black uppercase mb-1.5 tracking-widest">Account Receivables</p>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter">1,245,600.00</h3>
                  <p className="text-[10px] text-primary mt-2 font-bold underline cursor-pointer hover:text-primary/70" onClick={() => { setCurrentModule('reports'); setCurrentSubModule('Balance Sheet (Horizontal)'); }}>View Analytics</p>
                </CardContent>
              </Card>
              <Card className="border-none bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <p className="text-[11px] text-slate-400 font-black uppercase mb-1.5 tracking-widest">Account Payables</p>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter">842,150.25</h3>
                  <p className="text-[10px] text-slate-400 mt-2 font-bold">Total Vendor Exposure</p>
                </CardContent>
              </Card>
              <Card className="border-none bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <p className="text-[11px] text-primary font-black uppercase mb-1.5 tracking-widest">VAT Liability (15%)</p>
                  <h3 className="text-2xl font-black text-primary tracking-tighter">60,517.46</h3>
                  <p className="text-[10px] text-slate-400 mt-2 font-bold">ZATCA Compliant Summary</p>
                </CardContent>
              </Card>
              <Card className="border-none bg-white shadow-sm border-l-4 border-l-primary hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <p className="text-[11px] text-primary font-black uppercase mb-1.5 tracking-widest">System Health</p>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter truncate">STABLE</h3>
                  <p className="text-[10px] text-slate-400 mt-2 font-bold">Nodes Fully Synchronized</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 border-slate-200 shadow-sm overflow-hidden flex flex-col border-none bg-white">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                  <h2 className="font-bold text-slate-800 text-sm">Project-Wise Financial Status</h2>
                  <div className="flex gap-2">
                     <span className="text-[10px] px-2 py-1 bg-slate-50 rounded border border-slate-200 font-bold text-slate-500">Sort: Cumulative Balance</span>
                  </div>
                </div>
                <CardContent className="p-0">
                  <Table className="text-xs">
                    <TableHeader className="bg-slate-50 border-b border-slate-100">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="p-3 font-bold text-slate-500">Project ID / Tag</TableHead>
                        <TableHead className="p-3 font-bold text-slate-500">Total Budget</TableHead>
                        <TableHead className="p-3 font-bold text-slate-500">Expenses</TableHead>
                        <TableHead className="p-3 font-bold text-slate-500 text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { id: '#PRJ-RYD-001', name: 'KAFD Office Fit-out', budget: '500,000', expenses: '320,400', balance: '+129,600', color: 'emerald' },
                        { id: '#PRJ-JED-042', name: 'Red Sea Resort Villa', budget: '1,200,000', expenses: '1,050,000', balance: '-150,000', color: 'red' },
                        { id: '#PRJ-RYD-009', name: 'Boulevard Mall Shop', budget: '150,000', expenses: '45,000', balance: '+30,000', color: 'emerald' }
                      ].map((prj) => (
                        <TableRow key={prj.id} className="border-b border-slate-50 hover:bg-blue-50/50">
                          <TableCell className="p-3">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800">{prj.id}</span>
                              <span className="text-[10px] text-slate-400 font-medium">{prj.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">{prj.budget}.00</TableCell>
                          <TableCell className="font-mono text-red-500">{prj.expenses}.00</TableCell>
                          <TableCell className={`text-right font-bold ${prj.color === 'red' ? 'text-red-700' : 'text-blue-700'}`}>
                            {prj.balance}.00
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end items-center gap-2">
                    <button className="text-[10px] text-[#2563eb] font-extrabold hover:underline uppercase tracking-wider">Download Detailed Project Report (PDF)</button>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="border-slate-200 shadow-sm border-none bg-white">
                  <CardHeader className="px-6 py-4 border-b border-slate-100">
                    <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Latest Quotations</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-3">
                    {[
                      { title: 'Fit-out Materials - Phase 1', status: 'Pending', amount: '45,000' },
                      { title: 'Electrical Fixtures Lot', status: 'Approved', amount: '12,800' }
                    ].map(q => (
                      <div key={q.title} className="flex items-center gap-3 p-3 border border-slate-100 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                        <div className="w-10 h-10 bg-slate-200 rounded flex items-center justify-center text-[8px] text-slate-500 font-black">IMG</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-slate-800 truncate">{q.title}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{q.amount}.00 SAR ({q.status})</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                      </div>
                    ))}
                    <Button variant="outline" className="w-full mt-2 h-9 text-[10px] font-black uppercase tracking-widest border-slate-200 hover:bg-slate-50 text-slate-600">View All Quotations</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );
      case 'sales':
        return <SalesModule subModule={currentSubModule} initialParams={urlParams} />;
      case 'purchases':
        return <PurchaseModule subModule={currentSubModule} initialParams={urlParams} />;
      case 'inventory':
        return <InventoryModule subModule={currentSubModule} initialParams={urlParams} />;
      case 'accounting':
        return <AccountingModule subModule={currentSubModule} initialParams={urlParams} />;
      case 'users':
        return <UserManagementModule subModule={currentSubModule} initialParams={urlParams} />;
      case 'reports':
        return <ReportsModule subModule={currentSubModule} initialParams={urlParams} />;
      case 'projects':
        return <ProjectsModule subModule={currentSubModule} initialParams={urlParams} />;
      case 'master-data':
        return <MasterDataModule subModule={currentSubModule} initialParams={urlParams} />;
      default:
        return <div className="p-20 text-center animate-pulse text-zinc-400 font-mono text-xs">BOOTING MODULE: {currentModule}...</div>;
    }
  };

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-[#fdfbf7]">
    <div className="flex flex-col items-center gap-6">
       <div className="h-12 w-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
       <div className="text-center space-y-1">
         <p className="text-[10px] font-black tracking-widest text-blue-800 uppercase">Accounting & Fit-out</p>
         <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">Initialising Secure Workspace...</p>
       </div>
    </div>
  </div>;

  if (!user) {
    return (
      <div className="min-h-screen elegant-bg flex items-center justify-center p-4 relative overflow-hidden">
        {/* Elegant backdrop elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full mix-blend-multiply filter blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full mix-blend-multiply filter blur-[120px] animate-pulse animation-delay-2000" />
        
        <Toaster position="top-center" richColors />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: "easeOut" }} className="w-full max-w-md z-10">
          <div className="text-center mb-10 space-y-4">
            <div className="mx-auto w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/20 border border-white/20">
               <Building2 className="h-10 w-10 text-white" />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase leading-none font-heading">ITQAN <span className="text-primary font-light italic">ERP</span></h1>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2">Institutional Intelligence System</p>
            </div>
          </div>

          <div className="elegant-card p-10 space-y-8">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">System Gateway</h2>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest opacity-60">Authentication Protocol Required</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] ml-1">Staff Identity</label>
                  <Input 
                    placeholder="Username" 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    className="h-14 bg-white/50 border-slate-200 focus:bg-white focus:ring-primary/20 focus:border-primary rounded-2xl font-bold text-sm px-5" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] ml-1">Security Key</label>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="h-14 bg-white/50 border-slate-200 focus:bg-white focus:ring-primary/20 focus:border-primary rounded-2xl font-bold text-sm px-5" 
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black tracking-[0.15em] text-[12px] rounded-2xl transition-all shadow-xl shadow-primary/20 active:scale-[0.98] uppercase">
                Initialize Access
              </Button>
            </form>

            <div className="pt-6 border-t border-slate-100 flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity">
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Core v4.2.0-STABLE</p>
              <div className="flex gap-2 items-center">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-tight">Mainframe Linked</span>
              </div>
            </div>
          </div>
          
          <p className="text-center text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-10 opacity-30">
            Powered by Itqan Core Technologies
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen elegant-bg font-sans text-[#1e293b] antialiased overflow-hidden">
      <Toaster position="bottom-left" richColors />
      
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-shrink-0 flex-col transition-all duration-500 shadow-2xl z-40">
        <div className="p-8 border-b border-sidebar-border bg-sidebar-accent/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 border border-white/40">
               <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-[13px] font-black tracking-tight uppercase text-sidebar-foreground leading-none mb-1.5 font-heading">ITQAN <span className="font-light italic text-primary">ERP</span></h1>
              <p className="text-[10px] text-primary/60 font-black uppercase tracking-[0.2em]">Institutional</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto pt-8 pb-10 scrollbar-hide select-none px-4 space-y-1.5">
          <div className="px-5 mb-4 text-[10px] uppercase tracking-[0.3em] text-primary font-black opacity-60">Strategic Navigation</div>
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <div key={item.title}>
                <button
                  onClick={() => {
                    if (item.subItems) {
                      toggleMenu(item.title);
                    } else {
                      setCurrentModule(item.module);
                      setCurrentSubModule('');
                    }
                  }}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 group text-[11px] uppercase tracking-wider font-black ${
                    currentModule === item.module 
                    ? 'bg-primary text-white shadow-xl shadow-primary/30' 
                    : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <item.icon className={`h-4 w-4 transition-transform duration-300 group-hover:scale-110 ${currentModule === item.module ? 'text-white' : 'text-primary/70'}`} />
                    {item.title}
                  </div>
                  {item.subItems && (
                    <motion.div animate={{ rotate: openMenus.includes(item.title) ? 90 : 0 }}>
                      <ChevronRight className={`h-3 w-3 ${currentModule === item.module ? 'text-white' : 'text-sidebar-foreground/30'}`} />
                    </motion.div>
                  )}
                </button>
                
                <AnimatePresence>
                  {item.subItems && openMenus.includes(item.title) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-1 mt-1.5 ml-6 border-l border-sidebar-border"
                    >
                      {item.subItems.map(sub => (
                        <button
                          key={sub}
                          onClick={() => {
                            setCurrentModule(item.module);
                            setCurrentSubModule(sub);
                          }}
                          className={`w-full text-left py-3 px-6 text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 relative group ${
                            currentModule === item.module && currentSubModule === sub 
                            ? 'text-primary bg-primary/5 shadow-inner' 
                            : 'text-sidebar-foreground/40 hover:text-sidebar-foreground hover:translate-x-2'
                          }`}
                        >
                          {currentModule === item.module && currentSubModule === sub && (
                            <motion.div layoutId="active-dot" className="absolute left-3 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-primary shadow-sm shadow-primary/50" />
                          )}
                          {sub}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </nav>

        <div className="p-6 border-t border-sidebar-border bg-sidebar-accent/30 backdrop-blur-xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-[11px] uppercase shadow-inner text-primary">
            {user.username.slice(0, 2)}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-[11px] font-black uppercase tracking-widest truncate leading-none mb-1.5 text-sidebar-foreground">{user.username}</p>
            <p className="text-[9px] text-primary/50 font-bold uppercase tracking-[0.3em] leading-none">{user.role}</p>
          </div>
          <button onClick={handleLogout} className="p-2.5 hover:bg-red-500/10 rounded-xl transition-all group active:scale-95">
            <LogOut className="h-4 w-4 text-sidebar-foreground/30 group-hover:text-red-500 transition-colors" />
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header Bar */}
        <header className="elegant-header px-10 h-24 flex items-center justify-between shrink-0">
          <div className="flex flex-col">
            <div className="flex items-center gap-3 text-[10px] font-black text-primary uppercase tracking-[0.4em] opacity-80 mb-2">
               <Shield className="h-3 w-3" />
               Itqan Secure Environment
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none font-heading">
              {currentModule.replace('-', ' ')} <span className="text-slate-300 font-light mx-2">/</span> <span className="text-primary">{currentSubModule || 'Overview'}</span>
            </h2>
          </div>
          
          <div className="flex items-center gap-8">

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 border-2 border-white bg-white/50 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-white hover:shadow-xl transition-all duration-500 group relative">
                <span role="img" aria-label="notifications" className="text-lg group-hover:scale-110 transition-transform">🔔</span>
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full translate-x-1 -translate-y-1" />
              </div>
              <div className="text-right hidden md:block">
                 <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest leading-none mb-1">{user.username}</p>
                 <p className="text-[9px] text-primary font-bold uppercase tracking-widest opacity-60">Project Controller</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <section className="flex-1 overflow-y-auto p-10 scroll-smooth custom-scrollbar relative">
          <motion.div 
            key={`${currentModule}-${currentSubModule}`}
            initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-screen-xl mx-auto space-y-10 pb-20"
          >
            {renderModule()}
          </motion.div>
        </section>
      </main>
    </div>
  );
}
