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
  { title: 'Sales', icon: Receipt, module: 'sales', subItems: ['Quotations', 'Sales Orders', 'Customers'] },
  { title: 'Purchases', icon: ShoppingCart, module: 'purchases', subItems: ['Bills', 'Suppliers'] },
  { title: 'Inventory', icon: Package, module: 'inventory', subItems: ['Stock List'] },
  { title: 'Accounting', icon: BookOpen, module: 'accounting', subItems: ['Chart of Accounts', 'Journal Entries', 'Payables (Bills)', 'Receivables (Invoices)', 'Bank Reconciliation', 'Account Analytics'] },
  { title: 'Projects', icon: Building2, module: 'projects', subItems: ['Active Projects', 'Project Ledger', 'Project Sub categories', 'Project Categories'] },
  { title: 'Reports', icon: BarChart3, module: 'reports', subItems: ['Profit & Loss', 'Balance Sheet (Horizontal)', 'Trial Balance', 'Project Cost Analysis'] },
  { title: 'Users', icon: Users, module: 'users', subItems: ['My Profile', 'Manage Users'] },
  { title: 'Master Data', icon: Settings, module: 'master-data', subItems: ['Company Details', 'System Config'] },
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
              <Card className="border-blue-100 shadow-sm border-none bg-white">
                <CardContent className="p-4">
                  <p className="text-[11px] text-blue-600 font-bold uppercase mb-1">Account Receivables</p>
                  <h3 className="text-2xl font-bold text-slate-800 tracking-tight">1,245,600.00</h3>
                  <p className="text-[10px] text-blue-600 mt-1 font-semibold underline cursor-pointer" onClick={() => { setCurrentModule('reports'); setCurrentSubModule('Balance Sheet (Horizontal)'); }}>View Horizontal Balance Sheet</p>
                </CardContent>
              </Card>
              <Card className="border-amber-100 shadow-sm border-none bg-white">
                <CardContent className="p-4">
                  <p className="text-[11px] text-amber-600 font-bold uppercase mb-1">Account Payables</p>
                  <h3 className="text-2xl font-bold text-slate-800 tracking-tight">842,150.25</h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">Including Sub-contractors</p>
                </CardContent>
              </Card>
              <Card className="border-orange-100 shadow-sm border-none bg-white">
                <CardContent className="p-4">
                  <p className="text-[11px] text-orange-600 font-bold uppercase mb-1">VAT Liability (15%)</p>
                  <h3 className="text-2xl font-bold text-orange-600 tracking-tight">60,517.46</h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">Current Period Accrual</p>
                </CardContent>
              </Card>
              <Card className="border-emerald-100 shadow-sm border-none bg-white border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <p className="text-[11px] text-blue-600 font-bold uppercase mb-1">Estimated Zakat</p>
                  <h3 className="text-2xl font-bold text-slate-800 tracking-tight">32,450.00</h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">Provision Based on Capital</p>
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
      <div className="h-screen w-full flex items-center justify-center bg-[#fdfbf7] p-4 relative overflow-hidden">
        {/* Subtle Decorative Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px] opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-bisque-100 rounded-full blur-[120px] opacity-50" />
        
        <Toaster position="top-center" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="w-full max-w-md z-10">
          <div className="text-center mb-8 space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200">
               <Building2 className="h-8 w-8 text-white" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-black tracking-tight text-blue-900 uppercase">Accounting & Fit-out</h1>
              <p className="text-[10px] text-blue-600/60 font-bold uppercase tracking-[0.2em]">Institutional Resource Planning</p>
            </div>
          </div>

          <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] bg-white rounded-3xl overflow-hidden">
            <CardContent className="p-10 space-y-8">
              <div className="space-y-2 text-center">
                <h2 className="text-2xl font-black text-slate-800">Login</h2>
                <p className="text-slate-400 text-xs font-medium">Enter your credentials to access the secure ledger.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Staff Identity</label>
                    <Input 
                      placeholder="Username" 
                      value={username} 
                      onChange={e => setUsername(e.target.value)} 
                      className="h-12 bg-slate-50 border-slate-100 focus:bg-white focus:ring-blue-500 transition-all rounded-xl font-semibold" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Security Key</label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      className="h-12 bg-slate-50 border-slate-100 focus:bg-white focus:ring-blue-500 transition-all rounded-xl font-semibold" 
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black tracking-widest text-[11px] rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98]">
                  AUTHENTICATE & ENTER
                </Button>
              </form>

              <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">© 2026 ERP v4.0</p>
                <div className="flex gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                   <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">System Online</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <p className="text-center text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em] mt-8 opacity-50">
            Powered by Itqan Core Technologies
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#fdfbf7] font-sans text-[#1e293b] antialiased overflow-hidden">
      <Toaster position="bottom-left" richColors />
      
      {/* --- SIDEBAR --- */}
      <aside className="w-56 lg:w-64 bg-slate-900 text-white flex flex-shrink-0 flex-col border-r border-slate-800 transition-all duration-300">
        <div className="p-4 lg:p-6 border-b border-slate-800">
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
               <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-[11px] font-black tracking-tight uppercase text-white leading-none mb-1">Accounting & Fit-out</h1>
              <p className="text-[9px] text-blue-400/60 font-bold uppercase tracking-widest">Enterprise Suite</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto pt-4 lg:pt-6 scrollbar-hide select-none">
          <div className="px-5 mb-3 text-[9px] lg:text-[10px] uppercase tracking-[0.2em] text-blue-500 font-bold">Main Menu</div>
          <div className="px-2 lg:px-3 space-y-1">
            {NAV_ITEMS.map((item) => (
              <div key={item.title}>
                <button
                  onClick={() => {
                    setCurrentModule(item.module);
                    setCurrentSubModule(''); // Reset sub-module when clicking main menu
                    if (item.subItems) toggleMenu(item.title);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded transition-all group text-sm ${
                    currentModule === item.module ? 'bg-blue-500 text-white font-semibold shadow-md' : 'text-blue-100 hover:bg-slate-800/50 hover:bg-[#3b82f6]/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`h-4 w-4 ${currentModule === item.module ? 'text-white' : 'text-blue-400 opacity-80'}`} />
                    {item.title}
                  </div>
                  {item.subItems && (
                    <motion.div animate={{ rotate: openMenus.includes(item.title) ? 90 : 0 }}>
                      <ChevronRight className={`h-3 w-3 ${currentModule === item.module ? 'text-white' : 'text-blue-600'}`} />
                    </motion.div>
                  )}
                </button>
                
                <AnimatePresence>
                  {item.subItems && openMenus.includes(item.title) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-1 mt-1 ml-4 border-l border-slate-700/50"
                    >
                      {item.subItems.map(sub => (
                        <button
                          key={sub}
                          onClick={() => {
                            setCurrentModule(item.module);
                            setCurrentSubModule(sub);
                          }}
                          className={`w-full text-left py-1.5 px-4 text-[11px] font-medium transition-all ${
                            currentModule === item.module && currentSubModule === sub ? 'text-white bg-blue-500/20' : 'text-blue-400 hover:text-white'
                          }`}
                        >
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

        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center gap-3 text-white">
          <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs uppercase shadow-inner">
            {user.username.slice(0, 2)}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-bold truncate leading-none mb-1">{user.username}</p>
            <p className="text-[10px] text-blue-400/60 font-semibold uppercase tracking-widest leading-none">Administrator</p>
          </div>
          <button onClick={handleLogout} className="p-1.5 hover:bg-slate-800 rounded transition-colors">
            <LogOut className="h-3.5 w-3.5 text-blue-500" />
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-6">
          </div>
          
          <div className="flex items-center gap-5">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">FISCAL YEAR 2026</span>
              <span className="text-[11px] font-bold text-blue-600">SAR (Saudi Riyals)</span>
            </div>
            <div className="w-9 h-9 border border-slate-200 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
              <span role="img" aria-label="notifications" className="text-sm">🔔</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <section className="flex-1 overflow-y-auto p-6 scroll-smooth bg-[#f8fafc]">
          <motion.div 
            key={`${currentModule}-${currentSubModule}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-screen-xl mx-auto space-y-6 pb-12"
          >
            {renderModule()}
          </motion.div>
        </section>
      </main>
    </div>
  );
}
