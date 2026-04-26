import * as React from 'react';
import { useState, useEffect } from 'react';
import { 
  FileText, 
  Users, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Download, 
  ExternalLink,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShoppingCart,
  PackageCheck,
  TrendingUp,
  BarChart3,
  Save,
  PieChart as PieChartIcon,
  Trash2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import QuotationEditor from './QuotationEditor';
import SalesOrderEditor from './SalesOrderEditor';

// --- QUOTATIONS SUB-MODULE ---
const QuotationDetails = ({ id, onBack, onEdit }: { id: number, onBack: () => void, onEdit: () => void }) => {
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/quotations/${id}`)
      .then(res => res.json())
      .then(data => {
        setQuotation(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="h-64 flex items-center justify-center text-blue-400 font-mono text-xs uppercase tracking-widest animate-pulse">Loading Proposal Archive...</div>;
  if (!quotation) return <div className="p-12 text-center text-blue-400 font-bold uppercase tracking-widest">Document Not Found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-800">
          ← Back to Registry
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEdit} className="h-9 px-6 text-[10px] font-black uppercase tracking-widest border-blue-200 text-blue-600 rounded-xl">
            Edit Document
          </Button>
          <Button onClick={() => window.print()} className="h-9 px-6 text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white rounded-xl shadow-md">
            <Download className="mr-2 h-3.5 w-3.5" /> Export PDF
          </Button>
        </div>
      </div>

      <Card className="border border-blue-100 shadow-sm bg-white overflow-hidden rounded-2xl">
        <CardHeader className="bg-blue-50/50 border-b border-blue-100 p-8">
          <div className="flex justify-between items-start">
            <div>
              <Badge className="mb-3 bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-bold text-[10px] uppercase tracking-widest">{quotation.status}</Badge>
              <h2 className="text-3xl font-black text-blue-950 tracking-tight">{quotation.quotation_number}</h2>
              <p className="text-xs font-bold text-blue-600/60 uppercase tracking-widest mt-1">Institutional Technical Proposal</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Effective Date</p>
              <p className="text-sm font-bold text-slate-800">{quotation.date}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Valid Until</p>
              <p className="text-sm font-bold text-slate-800">{quotation.valid_until || 'N/A'}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-2 gap-12 mb-12">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 pb-2">Client Details</h3>
              <div className="space-y-1">
                <p className="text-base font-black text-slate-800 uppercase">{quotation.customer_name}</p>
                <p className="text-xs font-bold text-slate-500">Project: {quotation.project_name}</p>
              </div>
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 pb-2">Reference Info</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revision:</span>
                  <span className="text-[10px] font-black text-slate-800 uppercase">{quotation.revision}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Document ID:</span>
                  <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{quotation.id}</span>
                </div>
              </div>
            </div>
          </div>

          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-none">
                <TableHead className="text-[9px] font-black uppercase text-slate-400 tracking-widest">SN</TableHead>
                <TableHead className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-center">IMG</TableHead>
                <TableHead className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Description</TableHead>
                <TableHead className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-center">Unit</TableHead>
                <TableHead className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-center">Qty</TableHead>
                <TableHead className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-right">Rate</TableHead>
                <TableHead className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotation.items?.map((it: any) => (
                <TableRow key={it.id} className={it.is_lot ? "bg-slate-50/50 font-black border-slate-100" : "border-slate-50"}>
                  <TableCell className="text-[10px] font-bold text-slate-400 font-mono">{it.sn}</TableCell>
                  <TableCell className="p-2 text-center">
                    {it.image && (
                      <div className="w-10 h-10 rounded border border-slate-100 overflow-hidden mx-auto bg-white shadow-sm flex items-center justify-center">
                        <img src={it.image} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-slate-800 uppercase">{it.description}</TableCell>
                  <TableCell className="text-center text-[10px] font-bold text-slate-500 uppercase">{it.unit}</TableCell>
                  <TableCell className="text-center text-[10px] font-bold text-slate-800">{it.qty}</TableCell>
                  <TableCell className="text-right text-[10px] font-bold text-slate-800">{(it.unit_price || 0).toLocaleString()}.00</TableCell>
                  <TableCell className="text-right text-xs font-bold text-slate-900 font-mono">{(it.amount || 0).toLocaleString()}.00</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-8 flex justify-end">
            <div className="w-64 space-y-3">
              <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Gross Value</span>
                <span className="text-slate-800">{(quotation.total_amount - quotation.tax_amount + (quotation.discount || 0)).toLocaleString()}.00</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Discount</span>
                <span className="text-red-500">-{(quotation.discount || 0).toLocaleString()}.00</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                <span>VAT (15%)</span>
                <span className="text-slate-800">{(quotation.tax_amount || 0).toLocaleString()}.00</span>
              </div>
              <div className="flex justify-between pt-3 border-t-2 border-slate-900 text-sm font-black text-slate-900 uppercase tracking-tighter">
                <span>Final Total</span>
                <span className="text-lg">SAR {(quotation.total_amount || 0).toLocaleString()}.00</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const QuotationsView = ({ initialParams }: { initialParams?: URLSearchParams | null }) => {
  const [view, setView] = useState<'list' | 'create' | 'edit' | 'details'>(
    initialParams?.get('view') === 'details' && initialParams?.get('id') ? 'details' : 'list'
  );
  const [selectedId, setSelectedId] = useState<number | null>(
    initialParams?.get('id') ? Number(initialParams.get('id')) : null
  );
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuotations = async () => {
    try {
      const res = await fetch('/api/quotations');
      if (!res.ok) throw new Error('Failed to fetch quotations');
      const data = await res.json();
      setQuotations(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load quotations');
    } finally {
      setLoading(false);
    }
  };

  const [viewHistoryId, setViewHistoryId] = useState<number | null>(null);
  const [revisions, setRevisions] = useState<any[]>([]);

  const fetchRevisions = async (id: number) => {
    try {
      const res = await fetch(`/api/quotations/${id}/revisions`);
      const data = await res.json();
      setRevisions(Array.isArray(data) ? data : []);
      setViewHistoryId(id);
    } catch (err) {
      setRevisions([]);
      toast.error('Failed to load history');
    }
  };

  const deleteQuotation = async (id: number) => {
    if (!confirm('Are you sure you want to delete this quotation? This action is irreversible.')) return;
    try {
      const res = await fetch(`/api/quotations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete operation failed');
      toast.success('Document purged from registry');
      fetchQuotations();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  React.useEffect(() => {
    if (view === 'list') fetchQuotations();
  }, [view]);

  if (view === 'create') {
    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          onClick={() => setView('list')}
          className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-800 gap-2 mb-2"
        >
          ← Back to Quotations List
        </Button>
        <QuotationEditor />
      </div>
    );
  }

  if (view === 'edit' && selectedId) {
    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          onClick={() => setView('list')}
          className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-800 gap-2 mb-2"
        >
          ← Back to Registry
        </Button>
        <QuotationEditor id={selectedId.toString()} />
      </div>
    );
  }

  if (view === 'details' && selectedId) {
    return (
      <QuotationDetails 
        id={selectedId} 
        onBack={() => setView('list')} 
        onEdit={() => setView('edit')} 
      />
    );
  }

  if (loading) return <div className="h-64 flex items-center justify-center text-slate-400 font-mono text-xs uppercase tracking-widest animate-pulse">Loading Quotations...</div>;

  const getStatusBadge = (status: string) => {
    switch (status) {
        case 'confirmed': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-bold text-[10px]">CONFIRMED</Badge>;
        case 'draft': return <Badge className="bg-orange-50 text-orange-700 hover:bg-orange-50 border-none font-bold text-[10px]">DRAFT</Badge>;
        case 'sent': return <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50 border-none font-bold text-[10px]">SENT</Badge>;
        default: return <Badge variant="outline" className="uppercase text-[10px] border-blue-100 text-blue-600">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black tracking-tight text-blue-950 uppercase px-1">Project Quotations</h2>
        <div className="flex gap-2">
          <Button 
            onClick={() => setView('create')}
            className="bg-blue-600 h-9 text-[11px] font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all rounded-xl"
          >
            <Plus className="mr-2 h-4 w-4" /> Create New Quotation
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-blue-50 px-6 py-4 text-nowrap overflow-x-auto">
          <div className="flex items-center justify-between">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-400" />
              <Input placeholder="Search quotations..." className="pl-9 h-10 text-xs bg-slate-50 border-blue-100 focus:ring-blue-500/20 rounded-xl" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-10 text-[10px] font-black uppercase tracking-widest text-blue-600 border-blue-100 rounded-xl">
                <Filter className="mr-2 h-3.5 w-3.5" /> Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-blue-50/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-black text-blue-700/60 text-[10px] h-12 px-6 uppercase tracking-[0.1em] text-nowrap">Quote No.</TableHead>
                <TableHead className="font-black text-blue-700/60 text-[10px] h-12 px-6 uppercase tracking-[0.1em]">Client / Project</TableHead>
                <TableHead className="font-black text-blue-700/60 text-[10px] h-12 px-6 uppercase tracking-[0.1em]">Date</TableHead>
                <TableHead className="font-black text-blue-700/60 text-[10px] h-12 px-6 uppercase tracking-[0.1em] text-right">Value (SAR)</TableHead>
                <TableHead className="font-black text-blue-700/60 text-[10px] h-12 px-6 uppercase tracking-[0.1em] text-center">Status</TableHead>
                <TableHead className="h-12 px-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-blue-300 font-mono text-[10px] uppercase tracking-[0.2em]">No Quotations found</TableCell>
                </TableRow>
              ) : quotations.map((q) => (
                <TableRow key={q.id} className="hover:bg-blue-50/40 border-b border-blue-50/50 transition-colors">
                  <TableCell className="px-6 py-4 font-black text-blue-600 text-xs text-nowrap">
                    <button 
                      onClick={() => {
                        const url = new URL(window.location.href);
                        url.searchParams.set('mod', 'sales');
                        url.searchParams.set('sub', 'Quotations');
                        url.searchParams.set('view', 'details');
                        url.searchParams.set('id', q.id.toString());
                        window.open(url.toString(), '_blank');
                      }}
                      className="hover:underline cursor-pointer text-left"
                    >
                      {q.quotation_number}
                    </button>
                    <button 
                      onClick={() => { setSelectedId(q.id); setView('details'); }}
                      className="ml-2 text-[10px] text-blue-300 hover:text-blue-600"
                      title="View in Current Page"
                    >
                      (View Here)
                    </button>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-black text-blue-950 text-xs uppercase">{q.customer_name}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-blue-600/60 font-bold truncate max-w-[180px] uppercase">{q.project_name}</span>
                        {q.revision && q.revision !== '0' && (
                          <Badge variant="outline" className="text-[8px] h-3 px-1 border-blue-100 text-blue-400 uppercase font-black tracking-widest">{q.revision}</Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-blue-600 text-xs font-bold">{q.date}</TableCell>
                  <TableCell className="px-6 py-4 text-right font-black text-blue-950 text-xs">{(q.total_amount || 0).toLocaleString()}.00</TableCell>
                  <TableCell className="px-6 py-4 text-center">{getStatusBadge(q.status)}</TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:text-blue-700">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-white rounded-xl shadow-xl border-blue-50">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest text-blue-400 px-4 pt-3">Operations</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-blue-50" />
                          <DropdownMenuItem onClick={() => { setSelectedId(q.id); setView('details'); }} className="text-[11px] font-bold py-3 uppercase tracking-wide px-4 focus:bg-blue-50 focus:text-blue-700 cursor-pointer"><FileText className="mr-2 h-3.5 w-3.5 text-blue-500" /> Full Detail View</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedId(q.id); setView('edit'); }} className="text-[11px] font-bold py-3 uppercase tracking-wide px-4 focus:bg-blue-50 focus:text-blue-700 cursor-pointer"><ExternalLink className="mr-2 h-3.5 w-3.5 text-blue-600" /> Edit Document</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => fetchRevisions(q.id)} className="text-[11px] font-bold py-3 uppercase tracking-wide px-4 focus:bg-blue-50 focus:text-blue-700 cursor-pointer"><Clock className="mr-2 h-3.5 w-3.5 text-blue-600" /> Revision History</DropdownMenuItem>
                          <DropdownMenuItem className="text-[11px] font-bold py-3 uppercase tracking-wide px-4 focus:bg-blue-50 focus:text-blue-700 cursor-pointer"><Download className="mr-2 h-3.5 w-3.5 text-blue-500" /> Download PDF</DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-blue-50" />
                          <DropdownMenuItem onClick={() => deleteQuotation(q.id)} className="text-[11px] font-bold py-3 uppercase tracking-wide px-4 focus:bg-blue-50 text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer"><Trash2 className="mr-2 h-3.5 w-3.5" /> Purge Record</DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={viewHistoryId !== null} onOpenChange={() => setViewHistoryId(null)}>
        <DialogContent className="max-w-2xl bg-white focus:outline-none">
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" /> Document Revision History
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="text-[9px] font-black uppercase tracking-widest px-4">Rev No.</TableHead>
                  <TableHead className="text-[9px] font-black uppercase tracking-widest">Date</TableHead>
                  <TableHead className="text-right text-[9px] font-black uppercase tracking-widest">Value (SAR)</TableHead>
                  <TableHead className="text-center text-[9px] font-black uppercase tracking-widest">Status</TableHead>
                  <TableHead className="text-right text-[9px] font-black uppercase tracking-widest pr-4">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(revisions) && revisions.map((rev) => (
                  <TableRow key={rev.id} className="hover:bg-slate-50 border-b border-slate-50">
                    <TableCell className="font-black text-xs text-slate-800 tracking-tight px-4">{rev.revision}</TableCell>
                    <TableCell className="text-xs font-bold text-slate-500">{rev.date}</TableCell>
                    <TableCell className="text-right font-bold text-xs text-slate-800">{(rev.total_amount || 0).toLocaleString()}.00</TableCell>
                    <TableCell className="text-center">
                       {getStatusBadge(rev.status)}
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-[8px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800"
                        onClick={() => {
                          setSelectedId(rev.id);
                          setView('details');
                          setViewHistoryId(null);
                        }}
                      >
                        View Rev
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// --- SALES DASHBOARD SUB-MODULE ---
const SalesDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/sales-dashboard-stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
      toast.error('Dashboard synchronization failed');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Analytics...</p>
      </div>
    </div>
  );

  const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'];

  const conversionRate = stats?.totalQuotes > 0 
    ? ((stats.ordersFromQuotes / stats.totalQuotes) * 100).toFixed(1) 
    : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Quotations', value: stats?.totalQuotes, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Sales Orders', value: stats?.totalOrders, icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Orders from Quotes', value: stats?.ordersFromQuotes, icon: PackageCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Quote Conversion', value: `${conversionRate}%`, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-none shadow-sm shadow-slate-200/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{kpi.label}</p>
                  <h3 className="text-2xl font-black text-slate-800">{kpi.value}</h3>
                </div>
                <div className={`${kpi.bg} ${kpi.color} p-3 rounded-2xl`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Trend Chart */}
        <Card className="lg:col-span-2 border-none shadow-sm shadow-slate-200/50 bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" /> Sales & Pipeline Trend
                </CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold tracking-tight text-slate-400 mt-1">Comparison of Proposals vs Confirmed Orders</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 700 }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '20px' }} />
                  <Bar name="Quotations" dataKey="quotes" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={32} />
                  <Bar name="Sales Orders" dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quotation status breakdown */}
        <Card className="border-none shadow-sm shadow-slate-200/50 bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-orange-600" /> Proposal Status
            </CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold tracking-tight text-slate-400 mt-1">Distribution of active pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.statusBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats?.statusBreakdown.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 700 }}
                  />
                  <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// --- SALES ORDERS SUB-MODULE ---
const SalesOrderDetails = ({ id, onBack }: { id: number, onBack: () => void }) => {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/sales-orders/${id}`)
      .then(res => res.json())
      .then(data => {
        setOrder(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="h-64 flex items-center justify-center text-slate-400 font-mono text-xs uppercase tracking-widest animate-pulse">Loading Commercial Record...</div>;
  if (!order) return <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest">Order Not Found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-800">
          ← Back to Ledger
        </Button>
        <Button onClick={() => window.print()} className="h-9 px-6 text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white rounded-xl shadow-md">
          <Download className="mr-2 h-3.5 w-3.5" /> Export PDF
        </Button>
      </div>

      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
          <div className="flex justify-between items-start">
            <div>
              <Badge className="mb-3 bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-bold text-[10px] uppercase tracking-widest">{order.status}</Badge>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight font-mono">{order.order_number}</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Official Project Sales Order {order.revision !== '0' && `(Rev ${order.revision})`}</p>
            </div>
            <div className="text-right font-mono">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Date</p>
              <p className="text-sm font-bold text-slate-800">{order.date}</p>
              {order.valid_until && (
                <>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Valid Until</p>
                  <p className="text-sm font-bold text-slate-800">{order.valid_until}</p>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-2 gap-12 mb-12">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 pb-2">Debtor Information</h3>
              <div className="space-y-1">
                <p className="text-base font-black text-slate-800 uppercase">{order.customer_name}</p>
                {order.project_name && <p className="text-xs font-bold text-slate-500 uppercase">Project: {order.project_name}</p>}
                <p className="text-[10px] font-bold text-slate-400 uppercase">Customer Ref: #{order.customer_id}</p>
              </div>
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 pb-2">Reference Info</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quotation:</span>
                  <span className="text-[10px] font-black text-blue-600 uppercase">{order.quotation_id || 'Direct Entry'}</span>
                </div>
                {order.revision && (
                  <div className="flex justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revision:</span>
                    <span className="text-[10px] font-black text-slate-800 uppercase">{order.revision}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-none">
                <TableHead className="text-[9px] font-black uppercase text-slate-400 tracking-widest w-12">SN</TableHead>
                <TableHead className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-center w-16">IMG</TableHead>
                <TableHead className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Description</TableHead>
                <TableHead className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-center">Unit</TableHead>
                <TableHead className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-center">Qty</TableHead>
                <TableHead className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-right">Price</TableHead>
                <TableHead className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items?.map((it: any, idx: number) => (
                <TableRow key={idx} className={it.is_lot ? "bg-slate-50/50 font-black border-slate-100" : "border-slate-50"}>
                  <TableCell className="text-[10px] font-bold text-slate-400 font-mono">{it.sn}</TableCell>
                  <TableCell className="p-2 text-center">
                    {it.image_url && (
                      <div className="w-10 h-10 rounded border border-slate-100 overflow-hidden mx-auto bg-white shadow-sm flex items-center justify-center">
                        <img src={it.image_url} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-slate-800 uppercase tracking-tight">{it.description}</TableCell>
                  <TableCell className="text-center text-[10px] font-bold text-slate-500 uppercase font-mono">{it.unit}</TableCell>
                  <TableCell className="text-center text-[10px] font-bold text-slate-800 font-mono">{it.qty}</TableCell>
                  <TableCell className="text-right text-[10px] font-bold text-slate-800 font-mono">{(it.unit_price || 0).toLocaleString()}.00</TableCell>
                  <TableCell className="text-right text-xs font-black text-slate-900 font-mono">{(it.amount || 0).toLocaleString()}.00</TableCell>
                </TableRow>
              ))}
              {(!order.items || order.items.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-right py-8 pr-12 text-sm font-black text-slate-900 tracking-tighter">
                    SAR {(order.total_amount || 0).toLocaleString()}.00
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="mt-12 pt-8 border-t border-slate-100 flex justify-end">
            <div className="w-72 space-y-3">
              <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Gross Value</span>
                <span className="text-slate-800">{(order.total_amount - (order.tax_amount || 0) + (order.discount || 0)).toLocaleString()}.00</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>Special Discount</span>
                  <span className="text-red-500">-{(order.discount || 0).toLocaleString()}.00</span>
                </div>
              )}
              <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                <span>VAT (15%)</span>
                <span className="text-slate-800">{(order.tax_amount || 0).toLocaleString()}.00</span>
              </div>
              <div className="flex justify-between pt-4 border-t-2 border-slate-900 text-sm font-black text-slate-800 uppercase tracking-widest">
                <span>Grand Total</span>
                <span className="text-2xl font-mono text-slate-900 tracking-tighter">SAR {(order.total_amount || 0).toLocaleString()}.00</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const SalesOrdersView = () => {
  const [view, setView] = useState<'list' | 'create' | 'edit' | 'details'>('list');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordRes, custRes] = await Promise.all([
        fetch('/api/sales-orders'),
        fetch('/api/customers')
      ]);

      if (ordRes.status === 401) {
        window.location.reload();
        return;
      }

      const [ordData, custData] = await Promise.all([
        ordRes.json(),
        custRes.json()
      ]);

      setOrders(Array.isArray(ordData) ? ordData : []);
      setCustomers(Array.isArray(custData) ? custData : []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (id: number) => {
    if (!confirm('This will purge the commercial order from the database. OK?')) return;
    try {
      const res = await fetch(`/api/sales-orders/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Order Purged');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  if (view === 'create') {
    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          onClick={() => setView('list')}
          className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-800 gap-2 mb-2"
        >
          ← Back to Ledger
        </Button>
        <SalesOrderEditor />
      </div>
    );
  }

  if (view === 'edit' && selectedId) {
    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          onClick={() => setView('list')}
          className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-800 gap-2 mb-2"
        >
          ← Back to Ledger
        </Button>
        <SalesOrderEditor id={selectedId.toString()} />
      </div>
    );
  }

  if (view === 'details' && selectedId) {
    return <SalesOrderDetails id={selectedId} onBack={() => setView('list')} />;
  }

  if (loading) return <div className="h-64 flex items-center justify-center text-slate-400 font-mono text-xs uppercase tracking-widest animate-pulse">Loading Sales Orders...</div>;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50 border border-blue-100 font-black text-[9px] uppercase tracking-widest px-2">OPEN</Badge>;
      case 'confirmed': return <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50 border border-blue-100 font-black text-[9px] uppercase tracking-widest px-2">CONFIRMED</Badge>;
      case 'closed': return <Badge className="bg-slate-50 text-slate-500 hover:bg-slate-50 border border-slate-100 font-black text-[9px] uppercase tracking-widest px-2">CLOSED</Badge>;
      default: return <Badge variant="outline" className="uppercase text-[9px] font-black">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black tracking-tight text-blue-950 uppercase px-1">Sales Orders</h2>
        <Button 
          onClick={() => setView('create')}
          className="bg-blue-600 h-9 text-[11px] font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all rounded-xl"
        >
          <Plus className="mr-2 h-4 w-4" /> New Sales Order
        </Button>
      </div>

      <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-blue-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-400" />
              <Input placeholder="Search commercial orders..." className="pl-10 h-10 text-xs bg-slate-50 border-blue-100 focus:ring-blue-500/20 rounded-xl" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-10 text-[10px] font-black uppercase tracking-widest text-blue-600 border-blue-100 rounded-xl px-4">
                <Filter className="mr-2 h-3.5 w-3.5" /> Refine View
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-blue-50/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-black text-blue-700/60 text-[10px] h-12 px-8 uppercase tracking-[0.1em] text-nowrap">Order Ref.</TableHead>
                <TableHead className="font-black text-blue-700/60 text-[10px] h-12 px-8 uppercase tracking-[0.1em]">Customer Entity</TableHead>
                <TableHead className="font-black text-blue-700/60 text-[10px] h-12 px-8 uppercase tracking-[0.1em]">Posting Date</TableHead>
                <TableHead className="font-black text-blue-700/60 text-[10px] h-12 px-8 uppercase tracking-[0.1em] text-right">Value (SAR)</TableHead>
                <TableHead className="font-black text-blue-700/60 text-[10px] h-12 px-8 uppercase tracking-[0.1em] text-center">Status</TableHead>
                <TableHead className="h-12 px-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-blue-300 font-mono text-[10px] uppercase tracking-[0.2em]">No Commercial Orders Processed</TableCell>
                </TableRow>
              ) : orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-blue-50/40 border-b border-blue-50/50 transition-colors">
                  <TableCell className="px-8 py-5 font-black text-blue-600 text-xs text-nowrap font-mono">{order.order_number}</TableCell>
                  <TableCell className="px-8 py-5">
                    <span className="font-black text-blue-950 text-xs uppercase tracking-tight">{order.customer_name || 'Generic Client'}</span>
                  </TableCell>
                  <TableCell className="px-8 py-5 text-blue-600 text-xs font-bold uppercase tracking-tighter">{order.date}</TableCell>
                  <TableCell className="px-8 py-5 text-right font-black text-blue-950 text-xs font-mono tracking-tighter">{(order.total_amount || 0).toLocaleString()}.00</TableCell>
                  <TableCell className="px-8 py-5 text-center">{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="px-8 py-5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-400 hover:text-blue-700 transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-white rounded-xl shadow-xl border-blue-50">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest text-blue-400 px-4 pt-3">Operations</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-blue-50" />
                          <DropdownMenuItem onClick={() => { setSelectedId(order.id); setView('details'); }} className="text-[11px] font-bold py-3 uppercase tracking-wide px-4 focus:bg-blue-50 focus:text-blue-700 cursor-pointer"><FileText className="mr-2 h-3.5 w-3.5 text-blue-500" /> View Documentation</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedId(order.id); setView('edit'); }} className="text-[11px] font-bold py-3 uppercase tracking-wide px-4 focus:bg-blue-50 focus:text-blue-700 cursor-pointer"><ExternalLink className="mr-2 h-3.5 w-3.5 text-blue-600" /> Edit Order</DropdownMenuItem>
                          <DropdownMenuItem className="text-[11px] font-bold py-3 uppercase tracking-wide px-4 focus:bg-blue-50 focus:text-blue-700 cursor-pointer"><CheckCircle2 className="mr-2 h-3.5 w-3.5 text-blue-500" /> Fulfill Logistics</DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-blue-50" />
                          <DropdownMenuItem onClick={() => deleteOrder(order.id)} className="text-[11px] font-bold py-3 uppercase tracking-wide px-4 focus:bg-blue-50 text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer"><Trash2 className="mr-2 h-3.5 w-3.5" /> Purge Order</DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

// --- CUSTOMERS SUB-MODULE ---
const CustomerDetails = ({ id, onBack, onEdit }: { id: number, onBack: () => void, onEdit: () => void }) => {
  const [customer, setCustomer] = useState<any>(null);
  const [quotes, setCustomerQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/customers/${id}`).then(res => res.json()),
      fetch(`/api/customers/${id}/quotations`).then(res => res.json())
    ]).then(([custData, quoteData]) => {
      setCustomer(custData && !custData.error ? custData : null);
      setCustomerQuotes(Array.isArray(quoteData) ? quoteData : []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="h-64 flex items-center justify-center text-slate-400 font-mono text-xs uppercase tracking-widest animate-pulse">Syncing Entity Directory...</div>;
  if (!customer) return <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-[#ef4444]">Client Record Nullified</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-800">
          ← Back to Registry
        </Button>
        <Button onClick={onEdit} className="h-9 px-6 text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white">
          Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border border-slate-200 shadow-sm bg-white">
          <CardContent className="p-8 flex flex-col items-center">
            <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-[#2563eb] mb-6 shadow-inner">
              <Users className="h-10 w-10" />
            </div>
            <h2 className="text-xl font-black text-slate-800 text-center uppercase tracking-tight">{customer.name}</h2>
            <Badge className="mt-3 bg-blue-50 text-blue-600 hover:bg-blue-50 border border-blue-100 font-bold text-[9px] uppercase tracking-[0.2em] px-3">Active Account</Badge>
            
            <div className="w-full mt-10 space-y-4">
               <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">VAT ID</span>
                  <p className="text-xs font-bold text-slate-700 font-mono">{customer.vat_number || 'UNREGISTERED'}</p>
               </div>
               <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Client ID</span>
                  <p className="text-xs font-bold text-slate-700 font-mono">#{customer.id}</p>
               </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/30 border-b border-slate-50 p-6">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Communication & Logistics</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-10">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Liaison</label>
                <p className="text-sm font-bold text-slate-800 uppercase tracking-tight">{customer.contact_person || 'N/A'}</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                <p className="text-sm font-bold text-[#2563eb] font-mono">{customer.email || 'N/A'}</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mobile Number</label>
                <p className="text-sm font-bold text-slate-800 font-mono">{customer.phone || 'N/A'}</p>
              </div>
              <div className="space-y-1.5 border-l border-slate-100 pl-8">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Registered Office</label>
                <p className="text-xs font-bold text-slate-500 leading-relaxed">{customer.address || 'N/A'}</p>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-50">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Recent Quotations</h4>
               {(!Array.isArray(quotes) || quotes.length === 0) ? (
                  <div className="h-32 flex items-center justify-center border-2 border-slate-50 border-dashed rounded-xl">
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">No Quotations Found</p>
                  </div>
               ) : (
                  <div className="space-y-3">
                    {quotes.map((q: any) => (
                      <div key={q.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-[#2563eb]/20 transition-all cursor-pointer group">
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 flex items-center justify-center bg-white rounded-lg border border-slate-200">
                             <FileText className="h-5 w-5 text-slate-400" />
                           </div>
                           <div>
                             <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{q.quotation_number} {q.revision !== '0' && `(Rev ${q.revision})`}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{q.project_name}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-8">
                           <div className="text-right">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</p>
                             <p className="text-xs font-black text-slate-800">SAR {q.total_amount.toLocaleString()}.00</p>
                           </div>
                           <Badge className="bg-[#2563eb] text-white text-[8px] font-black">ACTIVE</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
               )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const CustomerForm = ({ onCancel, onSuccess, id }: { onCancel: () => void, onSuccess: () => void, id?: number }) => {
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    vat_number: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetch(`/api/customers/${id}`)
        .then(res => res.json())
        .then(data => {
          setFormData({
            name: data.name || '',
            contact_person: data.contact_person || '',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
            vat_number: data.vat_number || ''
          });
        });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Customer name is required');
      return;
    }

    setSubmitting(true);
    try {
      const url = id ? `/api/customers/${id}` : '/api/customers';
      const method = id ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to sync customer record');
      }

      toast.success(id ? 'Client record updated' : 'Customer created successfully');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 uppercase">New Customer Registration</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Add a new institutional or retail client to the directory</p>
        </div>
        <Button variant="ghost" onClick={onCancel} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-800">
          ← Cancel & Return
        </Button>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/60 bg-white overflow-hidden">
        <form onSubmit={handleSubmit}>
          <CardHeader className="bg-slate-900 text-white py-4 px-8">
            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <Users className="h-4 w-4" /> Customer Profile Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Full Legal Name / Company Name</label>
                <Input 
                  required
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                  className="h-10 border-slate-200 bg-slate-50/50 focus:bg-white transition-all font-bold text-sm" 
                  placeholder="e.g. Saudi Aramco"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Primary Contact Person</label>
                <Input 
                  value={formData.contact_person} 
                  onChange={e => setFormData({ ...formData, contact_person: e.target.value })} 
                  className="h-10 border-slate-200 bg-slate-50/50 focus:bg-white transition-all font-bold text-sm"
                  placeholder="Full Name"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">VAT Registration Number</label>
                <Input 
                  value={formData.vat_number} 
                  onChange={e => setFormData({ ...formData, vat_number: e.target.value })} 
                  className="h-10 border-slate-200 bg-slate-50/50 focus:bg-white transition-all font-bold text-sm"
                  placeholder="15-digit VAT number"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Email Address</label>
                <Input 
                  type="email"
                  value={formData.email} 
                  onChange={e => setFormData({ ...formData, email: e.target.value })} 
                  className="h-10 border-slate-200 bg-slate-50/50 focus:bg-white transition-all font-bold text-sm"
                  placeholder="client@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Mobile / Phone Number</label>
                <Input 
                  value={formData.phone} 
                  onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                  className="h-10 border-slate-200 bg-slate-50/50 focus:bg-white transition-all font-bold text-sm"
                  placeholder="+966 ..."
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Registered physical address</label>
                <Input 
                  value={formData.address} 
                  onChange={e => setFormData({ ...formData, address: e.target.value })} 
                  className="h-10 border-slate-200 bg-slate-50/50 focus:bg-white transition-all font-bold text-sm"
                  placeholder="District, Street, City, KSA"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                className="h-10 px-6 text-[11px] font-black uppercase tracking-widest border-slate-200 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
                className="h-10 px-8 text-[11px] font-black uppercase tracking-widest bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-lg disabled:opacity-50"
              >
                {submitting ? 'Registering...' : 'Register Customer'}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
};

const CustomersView = () => {
  const [view, setView] = useState<'list' | 'create' | 'edit' | 'details'>('list');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = () => {
    setLoading(true);
    fetch('/api/customers')
      .then(async res => {
        if (res.status === 401) {
          window.location.reload();
          return;
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Failed to fetch customers (${res.status})`);
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setCustomers(data);
        } else {
          console.error('Customers data is not an array:', data);
          setCustomers([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        toast.error(err.message);
        setCustomers([]);
        setLoading(false);
      });
  };

  const deleteCustomer = async (id: number) => {
    if (!confirm('Purging this client will affect historical records. Proceed?')) return;
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Client Purged');
      fetchCustomers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  React.useEffect(() => {
    if (view === 'list') fetchCustomers();
  }, [view]);

  if (view === 'create') {
    return <CustomerForm onCancel={() => setView('list')} onSuccess={() => { setView('list'); fetchCustomers(); }} />;
  }

  if (view === 'edit' && selectedId) {
    return <CustomerForm id={selectedId} onCancel={() => setView('list')} onSuccess={() => { setView('list'); fetchCustomers(); }} />;
  }

  if (view === 'details' && selectedId) {
    return <CustomerDetails id={selectedId} onBack={() => setView('list')} onEdit={() => setView('edit')} />;
  }

  if (loading) return <div className="h-64 flex items-center justify-center text-slate-400 font-mono text-xs uppercase tracking-widest animate-pulse">Loading Customers...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-slate-800 uppercase px-1">Customer Directory</h2>
        <Button 
          onClick={() => setView('create')}
          className="bg-[#2563eb] h-9 text-[11px] font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="mr-2 h-4 w-4" /> Add New Customer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {customers.length === 0 ? (
          <div className="col-span-full h-48 border-2 border-dashed border-slate-100 rounded-3xl flex items-center justify-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">New Directory: No Customers Available</p>
          </div>
        ) : customers.map(customer => (
          <Card key={customer.id} className="border-none shadow-sm hover:shadow-xl transition-all bg-white group">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-slate-50 group-hover:bg-blue-50 rounded-2xl flex items-center justify-center font-black text-[#2563eb] text-sm transition-colors border border-slate-100">
                  {customer.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex gap-1">
                  {(customer.tags || []).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-[9px] font-bold uppercase py-0 px-1.5 h-4 bg-slate-50 text-slate-500 border border-slate-100">{tag}</Badge>
                  ))}
                  {customer.vat_number && <Badge className="text-[8px] font-black uppercase py-0 px-1.5 h-4 bg-blue-50 text-blue-600 border border-blue-100">VAT REG</Badge>}
                </div>
              </div>
              <CardTitle className="mt-4 text-sm font-black text-slate-800 uppercase tracking-tight truncate">{customer.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                  <Users className="h-3 w-3 text-slate-400" /> {customer.contact_person || 'No Contact Person'}
                </div>
                <div className="text-[10px] text-slate-400 truncate font-semibold underline cursor-pointer hover:text-[#2563eb] transition-colors">
                  {customer.email || 'no-email@provided.com'}
                </div>
              </div>
              <div className="pt-4 border-t border-slate-50 flex justify-between items-end">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Financial Exposure</p>
                  <p className="text-xl font-mono font-black text-slate-900 tracking-tighter">SAR {(customer.balance || 0).toLocaleString()}.00</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-8 w-8 rounded-full text-slate-300 hover:text-slate-800 hover:bg-slate-50 transition-all p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest text-slate-400">Account Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => { setSelectedId(customer.id); setView('details'); }} className="text-[10px] font-black py-2.5 uppercase tracking-wide text-slate-600">
                        <FileText className="mr-2 h-4 w-4 text-[#2563eb]" /> Full Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setSelectedId(customer.id); setView('edit'); }} className="text-[10px] font-black py-2.5 uppercase tracking-wide text-slate-600">
                        <ExternalLink className="mr-2 h-4 w-4 text-amber-500" /> Edit Record
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => deleteCustomer(customer.id)} className="text-[10px] font-black py-2.5 uppercase tracking-wide text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" /> Purge Client
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default function SalesModule({ subModule, initialParams }: { subModule: string, initialParams?: URLSearchParams | null }) {
  const [activeTab, setActiveTab] = useState(subModule || 'Dashboard');

  React.useEffect(() => {
    setActiveTab(subModule || 'Dashboard');
  }, [subModule]);

  return (
    <div className="space-y-6">
      {activeTab === 'Dashboard' && <SalesDashboard />}
      {activeTab === 'Quotations' && <QuotationsView initialParams={initialParams} />}
      {activeTab === 'Sales Orders' && <SalesOrdersView />}
      {activeTab === 'Customers' && <CustomersView />}
    </div>
  );
}

const ChevronRight = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"/></svg>
);
