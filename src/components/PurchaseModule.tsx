import * as React from 'react';
import { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Truck, 
  Plus, 
  Search, 
  MoreHorizontal, 
  FileCheck,
  CreditCard,
  Building2,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  TrendingUp,
  FileText,
  Save,
  ChevronRight,
  PieChart as PieChartIcon,
  Users,
  Trash2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';

// --- SUPPLIER DETAILS ---
const SupplierDetails = ({ id, onBack, onEdit }: { id: number, onBack: () => void, onEdit: () => void }) => {
  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/suppliers/${id}`)
      .then(res => res.json())
      .then(data => {
        setSupplier(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="h-64 flex items-center justify-center text-slate-400 font-mono text-xs uppercase tracking-widest animate-pulse">Loading Supplier Profile...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="text-[10px] font-black uppercase tracking-widest text-[#2563eb] hover:bg-blue-50">
          ← Back to Registry
        </Button>
        <div className="flex gap-2">
          <Button onClick={onEdit} className="h-9 text-[10px] font-black uppercase tracking-widest bg-amber-500 hover:bg-amber-600">Edit Profile</Button>
        </div>
      </div>

      <Card className="border border-slate-200 shadow-xl bg-white overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 p-10">
          <div className="flex items-start justify-between">
            <div className="flex gap-6">
              <div className="w-20 h-20 bg-white border border-slate-200 rounded-3xl flex items-center justify-center text-3xl font-black text-[#2563eb] shadow-sm">
                {supplier.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{supplier.name}</h2>
                <div className="flex gap-4 mt-2">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <Users className="h-3.5 w-3.5 text-slate-300" /> {supplier.contact_person || 'No Lead Contact'}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    <Truck className="h-3.5 w-3.5 text-slate-300" /> Vendor ID: {supplier.id}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <Badge className="bg-blue-50 text-blue-600 border-blue-100 font-black text-[10px] uppercase tracking-[0.2em] px-3 py-1">Active Partner</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-10">
           <div className="grid grid-cols-3 gap-10">
              <div className="space-y-6">
                <div>
                   <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1 block font-mono italic underline">Primary Address</label>
                   <p className="text-sm font-bold text-slate-700 leading-relaxed">{supplier.address || 'No location data provided'}</p>
                </div>
                <div>
                   <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1 block">ZATCA Compliant VAT</label>
                   <p className="text-sm font-black text-slate-900 font-mono tracking-widest">{supplier.vat_number || 'NOT REGISTERED'}</p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                   <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1 block">Electronic Correspondence</label>
                   <p className="text-sm font-bold text-[#2563eb] underline underline-offset-4 cursor-pointer">{supplier.email || 'na@supplier-portal.sa'}</p>
                </div>
                <div>
                   <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1 block">Direct Hotline</label>
                   <p className="text-sm font-bold text-slate-700">{supplier.phone || 'No Active Line'}</p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 text-center flex flex-col justify-center">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Total Outstanding</label>
                 <p className="text-3xl font-black text-slate-900 tracking-tighter font-mono">SAR {(supplier.balance || 0).toLocaleString()}.00</p>
                 <Button className="mt-6 w-full h-10 bg-[#2563eb] text-[10px] font-black uppercase tracking-widest">Settle Liabilities</Button>
              </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
};

// --- PURCHASE DASHBOARD ---
const PurchaseDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/purchase-dashboard-stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-64 flex items-center justify-center text-slate-400 font-mono text-xs uppercase tracking-widest animate-pulse">Loading Procurement Intel...</div>;

  const COLORS = ['#2563eb', '#6366f1', '#8b5cf6', '#a78bfa'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-slate-200 bg-white/50 -mx-6 px-6 -mt-6 mb-6">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-800 uppercase">Procurement Analytics</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Commercial Supply Chain & Payable Monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-9 text-[10px] font-black uppercase tracking-widest border-slate-200">Export Report</Button>
          <Button className="h-9 text-[10px] font-black uppercase tracking-widest bg-[#2563eb] hover:bg-blue-700">Refresh Data</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden group">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <FileText className="h-4 w-4" />
              </div>
              <Badge className="bg-blue-50 text-blue-600 border-none text-[9px] font-black uppercase">+12% vs LY</Badge>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Active Bills</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{stats?.totalBills || 0}</h3>
          </CardContent>
        </Card>
        
        <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <Truck className="h-4 w-4" />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Registered Suppliers</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{stats?.totalSuppliers || 0}</h3>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-red-50 rounded-lg text-red-600">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 font-mono">Gross Payables (Unpaid)</p>
            <h3 className="text-2xl font-black text-red-600 tracking-tight">SAR {(stats?.totalPayable || 0).toLocaleString()}.00</h3>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg. Monthly Spend</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">SAR {( (stats?.trendData?.reduce((a:any,b:any)=>a+(b.spending||0),0) || 0) / 6).toLocaleString(undefined, {maximumFractionDigits:0})}</h3>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border border-slate-200 shadow-sm bg-white">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800">Procurement Intensity (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent className="p-10">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.trendData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#94a3b8" 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false}
                    className="font-black uppercase tracking-tighter"
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(v) => `SAR ${v/1000}k`}
                    className="font-black"
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }}
                    formatter={(v: any) => [`SAR ${v.toLocaleString()}`, 'Total Spend']}
                  />
                  <Bar dataKey="spending" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm bg-white">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800">Settlement Profiles</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.statusBreakdown || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(stats?.statusBreakdown || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    formatter={(v) => <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between border border-slate-100">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Vendors</span>
                <span className="text-xs font-black text-[#2563eb]">{stats?.totalSuppliers || 0} Entities</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// --- BILL FORM (Purchase Entry) ---
const BillForm = ({ onCancel, onSuccess, suppliers, projects }: { 
  onCancel: () => void, 
  onSuccess: () => void, 
  suppliers: any[], 
  projects: any[]
}) => {
  const [formData, setFormData] = useState({
    bill_number: `BILL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    supplier_id: '',
    project_id: '',
    date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    total_amount: 0,
    vat_amount: 0
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplier_id) {
      toast.error('Please select a supplier');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          total_amount: Number(formData.total_amount),
          vat_amount: Number(formData.total_amount) * 0.15,
          supplier_id: Number(formData.supplier_id),
          project_id: formData.project_id ? Number(formData.project_id) : null
        }),
      });

      if (!res.ok) throw new Error('Failed to record purchase entry');
      toast.success('Liability recorded successfully');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-800 uppercase">Purchase Entry Voucher</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
            <ShoppingCart className="h-3.5 w-3.5 text-[#2563eb]" /> Official Commercial Payable Record
          </p>
        </div>
        <Button variant="ghost" onClick={onCancel} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-800">
          ← Back to Ledger
        </Button>
      </div>

      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
        <form onSubmit={handleSubmit}>
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6 px-10">
            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-slate-800">
               Reference ID: <span className="text-[#2563eb]">{formData.bill_number}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-10 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6 border-r border-slate-100 pr-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-5 w-1 bg-[#2563eb] rounded-full"></div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800">Vendor Entity</h3>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Select Supplier</label>
                  <Select value={formData.supplier_id} onValueChange={(v) => setFormData(prev => ({ ...prev, supplier_id: v }))}>
                    <SelectTrigger className="h-10 border-slate-200 bg-white font-bold text-sm">
                      <SelectValue placeholder="Identify supplier entity" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map(s => (
                        <SelectItem key={s.id} value={s.id.toString()} className="font-bold text-xs uppercase">{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-3 w-3 text-slate-400" />
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Project Mapping (Optional)</label>
                  </div>
                  <Select value={formData.project_id} onValueChange={(v) => setFormData(prev => ({ ...prev, project_id: v }))}>
                    <SelectTrigger className="h-10 border-slate-200 bg-white font-bold text-sm">
                      <SelectValue placeholder="Allocate to Project Cost Center" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="font-black text-[9px] uppercase tracking-widest text-slate-300">Unallocated / General Overhead</SelectItem>
                      {projects.map(p => (
                        <SelectItem key={p.id} value={p.id.toString()} className="font-bold text-xs uppercase tracking-tight">{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">This will automatically appear in the project financial ledger.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-5 w-1 bg-slate-400 rounded-full"></div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800">Timeline & Exposure</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Post Date</label>
                    <Input type="date" value={formData.date} onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))} className="h-10 border-slate-200 bg-white font-bold text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-[#2563eb]">Due Date</label>
                    <Input type="date" value={formData.due_date} onChange={e => setFormData(prev => ({ ...prev, due_date: e.target.value }))} className="h-10 border-slate-200 bg-white font-bold text-sm text-[#2563eb]" />
                  </div>
                </div>

                <div className="space-y-1.5 pt-4">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Gross Invoice Value (Inc. VAT)</label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={formData.total_amount} 
                      onChange={e => setFormData(prev => ({ ...prev, total_amount: Number(e.target.value) }))} 
                      className="h-12 border-slate-200 bg-slate-50/50 focus:bg-white transition-all font-black text-xl pl-12 text-slate-900 shadow-inner" 
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">SAR</span>
                  </div>
                  <div className="flex justify-between items-center px-1 mt-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Calculated VAT (15%):</span>
                    <span className="text-[10px] font-black text-slate-800">SAR {(formData.total_amount * 0.15).toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 flex justify-end gap-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={onCancel} className="h-11 px-8 text-[11px] font-black uppercase tracking-widest border-slate-200">
                Discard
              </Button>
              <Button 
                type="submit" 
                disabled={submitting} 
                className="h-11 px-10 text-[11px] font-black uppercase tracking-widest bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-lg shadow-blue-500/10 gap-2"
              >
                {submitting ? 'Recording...' : <><Save className="h-4 w-4" /> Commit to Ledger</>}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
};

// --- SUPPLIER FORM ---
const SupplierForm = ({ id, onCancel, onSuccess }: { id?: number, onCancel: () => void, onSuccess: () => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    vat_number: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetch(`/api/suppliers/${id}`)
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
          setLoading(false);
        })
        .catch(() => {
          toast.error('Failed to load supplier data');
          setLoading(false);
        });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Please fill required fields (Entity Name)');
      return;
    }

    setSubmitting(true);
    try {
      const url = id ? `/api/suppliers/${id}` : '/api/suppliers';
      const method = id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error(id ? 'Failed to update supplier' : 'Failed to onboard supplier');
      toast.success(id ? 'Supplier record updated' : 'Supplier entity registered');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="h-64 flex items-center justify-center text-slate-400 font-mono text-xs uppercase tracking-widest animate-pulse">Retrieving Vendor Profile...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-800 uppercase">{id ? 'Edit Supplier' : 'Onboard Supplier'}</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Vendor Intelligence & Partner Registration</p>
        </div>
        <Button variant="ghost" onClick={onCancel} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-800">
          ← Back to Registry
        </Button>
      </div>

      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
        <form onSubmit={handleSubmit}>
          <CardContent className="p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Entity Name <span className="text-red-500">*</span></label>
                  <Input value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} className="h-10 border-slate-200 bg-white font-bold text-sm" placeholder="Commercial Name Ltd." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Contact Person</label>
                  <Input value={formData.contact_person} onChange={e => setFormData(prev => ({ ...prev, contact_person: e.target.value }))} className="h-10 border-slate-200 bg-white font-bold text-sm" placeholder="Technical/Sales Manager" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Email Address</label>
                  <Input type="email" value={formData.email} onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))} className="h-10 border-slate-200 bg-white font-bold text-sm font-mono" placeholder="accounts@supplier.sa" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">VAT Compliance Number</label>
                  <Input value={formData.vat_number} onChange={e => setFormData(prev => ({ ...prev, vat_number: e.target.value }))} className="h-10 border-slate-200 bg-white font-bold text-sm" placeholder="15-digit ZATCA ID" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Phone / Mobile</label>
                  <Input value={formData.phone} onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))} className="h-10 border-slate-200 bg-white font-bold text-sm" placeholder="+966 ..." />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Office Address</label>
              <Input value={formData.address} onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))} className="h-10 border-slate-200 bg-white font-bold text-sm" placeholder="Building, Street, District, City" />
            </div>

            <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={onCancel} className="h-11 px-8 text-[11px] font-black uppercase tracking-widest border-slate-200 uppercase tracking-widest">Cancel</Button>
              <Button type="submit" disabled={submitting} className="h-11 px-10 text-[11px] font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/10 gap-2">
                {submitting ? 'Registering...' : <><Plus className="h-4 w-4" /> Onboard Supplier</>}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
};

// --- BILLS SUB-MODULE ---
const BillsView = ({ onLogNewBill }: { onLogNewBill: () => void }) => {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'details'>('list');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bills');
      if (res.status === 401) { window.location.reload(); return; }
      if (!res.ok) throw new Error('Failed to fetch bills');
      const data = await res.json();
      setBills(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteBill = async (id: number) => {
    if (!confirm('This will purge the financial liability record. Continue?')) return;
    try {
      const res = await fetch(`/api/bills/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete bill');
      toast.success('Liability record purged');
      fetchBills();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  if (view === 'details' && selectedId) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setView('list')} className="text-[10px] font-black uppercase tracking-widest text-slate-400">← Back to Ledger</Button>
        <Card className="border border-slate-200 bg-white p-10">
           <h2 className="text-xl font-bold uppercase mb-4">Bill Details Coming Soon...</h2>
           <p className="text-sm text-slate-500">Full audit trail and document viewer for Bill ID: {selectedId}</p>
        </Card>
      </div>
    );
  }

  if (loading) return <div className="h-64 flex items-center justify-center text-slate-400 font-mono text-xs uppercase tracking-widest animate-pulse">Loading Commercial Ledger...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-slate-800 uppercase px-1">Purchase Bills</h2>
        <Button onClick={onLogNewBill} className="bg-[#2563eb] h-9 text-[11px] font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all">
          <Plus className="mr-2 h-4 w-4" /> Log New Bill
        </Button>
      </div>

      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search commercial bills..." className="pl-10 h-10 text-xs bg-slate-50 border-slate-200 font-medium" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-10 text-[10px] font-black uppercase tracking-widest text-slate-500 border-slate-200 px-4">
                <Filter className="mr-2 h-4 w-4" /> Refine View
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-b border-slate-100">
                <TableHead className="font-black text-slate-400 text-[10px] h-12 px-8 uppercase tracking-[0.15em] text-nowrap">Bill ID</TableHead>
                <TableHead className="font-black text-slate-400 text-[10px] h-12 px-8 uppercase tracking-[0.15em]">Supplier Entity</TableHead>
                <TableHead className="font-black text-slate-400 text-[10px] h-12 px-8 uppercase tracking-[0.15em]">Due Date</TableHead>
                <TableHead className="font-black text-slate-400 text-[10px] h-12 px-8 uppercase tracking-[0.15em]">Project Linked</TableHead>
                <TableHead className="font-black text-slate-400 text-[10px] h-12 px-8 uppercase tracking-[0.15em] text-right">Value (SAR)</TableHead>
                <TableHead className="font-black text-slate-400 text-[10px] h-12 px-8 uppercase tracking-[0.15em] text-center">Status</TableHead>
                <TableHead className="h-12 px-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-slate-300 font-mono text-[10px] uppercase tracking-[0.3em]">No Purchase Entries Found</TableCell>
                </TableRow>
              ) : bills.map((bill) => (
                <TableRow key={bill.id} className="hover:bg-slate-50/40 border-b border-slate-50 transition-colors group">
                  <TableCell className="px-8 py-5 font-black text-slate-900 text-xs text-nowrap font-mono">{bill.bill_number}</TableCell>
                  <TableCell className="px-8 py-5 font-bold text-slate-700 text-xs uppercase tracking-tight">{bill.supplier_name}</TableCell>
                  <TableCell className="px-8 py-5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-tighter">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" /> {bill.due_date}
                    </div>
                  </TableCell>
                  <TableCell className="px-8 py-5">
                    {bill.project_name ? (
                      <Badge variant="outline" className="text-[9px] font-black uppercase text-[#2563eb] border-blue-100 bg-blue-50/30">
                        {bill.project_name}
                      </Badge>
                    ) : (
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">General</span>
                    )}
                  </TableCell>
                  <TableCell className="px-8 py-5 text-right font-black text-slate-900 text-sm font-mono tracking-tighter">{(bill.total_amount || 0).toLocaleString()}.00</TableCell>
                  <TableCell className="px-8 py-5 text-center">
                  <Badge className={bill.status === 'paid' ? "bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-black text-[9px] uppercase tracking-widest px-2" : "bg-amber-50 text-amber-600 hover:bg-amber-50 border border-amber-100 font-black text-[9px] uppercase tracking-widest px-2"}>
                      {bill.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-8 py-5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-300 hover:text-slate-800 transition-colors">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      } />
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-2 py-1">Commercial Ops</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => { setSelectedId(bill.id); setView('details'); }} className="text-[10px] font-black py-2.5 uppercase tracking-wide text-slate-600">
                            <FileCheck className="mr-2 h-4 w-4 text-[#2563eb]" /> Audit Ledger
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteBill(bill.id)} className="text-[10px] font-black py-2.5 uppercase tracking-wide text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Purge Entry
                          </DropdownMenuItem>
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

// --- SUPPLIERS SUB-MODULE ---
const SuppliersView = ({ onOnboard }: { onOnboard: () => void }) => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'details' | 'edit'>('list');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const fetchSuppliers = () => {
    setLoading(true);
    fetch('/api/suppliers')
      .then(res => res.json())
      .then(data => {
        setSuppliers(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  };

  const deleteSupplier = async (id: number) => {
    if (!confirm('Are you sure you want to delete this supplier? This will remove all associated records.')) return;
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Supplier Deleted');
      fetchSuppliers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  if (view === 'details' && selectedId) {
    return <SupplierDetails id={selectedId} onBack={() => setView('list')} onEdit={() => setView('edit')} />;
  }

  if (view === 'edit' && selectedId) {
    return <SupplierForm id={selectedId} onCancel={() => setView('list')} onSuccess={() => { setView('list'); fetchSuppliers(); }} />;
  }

  if (loading) return <div className="h-64 flex items-center justify-center text-slate-400 font-mono text-xs uppercase tracking-widest animate-pulse">Scanning Vendor Database...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-slate-800 uppercase px-1">Supplier Registry</h2>
        <Button onClick={onOnboard} className="bg-blue-600 h-9 text-[11px] font-bold uppercase tracking-wider shadow-lg shadow-blue-600/10 hover:bg-blue-700 transition-all">
          <Plus className="mr-2 h-4 w-4" /> Onboard Supplier
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {suppliers.length === 0 ? (
          <div className="col-span-full h-48 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-300 font-black text-[10px] uppercase tracking-widest bg-white/50">
            No Strategic Partners Registered
          </div>
        ) : suppliers.map(sup => (
          <Card key={sup.id} className="border border-slate-200 shadow-sm bg-white hover:border-[#2563eb] transition-all group overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-5 min-w-0">
                  <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:border-blue-100 group-hover:text-[#2563eb] transition-all">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-black text-slate-900 text-base uppercase tracking-tight truncate mb-0.5">{sup.name}</h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-slate-800 transition-colors">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        } />
                        <DropdownMenuContent align="start" className="w-44">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest text-slate-400">Vendor Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setSelectedId(sup.id); setView('details'); }} className="text-[10px] font-black py-2.5 uppercase tracking-wide text-slate-600">
                               <FileText className="mr-2 h-4 w-4 text-[#2563eb]" /> Audit Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedId(sup.id); setView('edit'); }} className="text-[10px] font-black py-2.5 uppercase tracking-wide text-slate-600">
                               <ArrowUpRight className="mr-2 h-4 w-4 text-amber-500" /> Edit Record
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => deleteSupplier(sup.id)} className="text-[10px] font-black py-2.5 uppercase tracking-wide text-red-600 text-nowrap">
                               <Trash2 className="mr-2 h-4 w-4" /> Purge Vendor
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact:</span>
                       <span className="text-[10px] font-bold text-slate-600 truncate underline decoration-slate-200">{sup.contact_person}</span>
                    </div>
                    <div className="mt-2 flex gap-2">
                       <Badge variant="outline" className="text-[8px] font-black uppercase text-slate-400 border-slate-200">VAT: {sup.vat_number}</Badge>
                       <Badge variant="outline" className="text-[8px] font-black uppercase text-slate-400 border-slate-200">ID: {sup.id}</Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right border-l border-slate-100 pl-6 h-12 flex flex-col justify-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 text-nowrap">Payables Exposure</p>
                  <p className={`text-lg font-black tracking-tighter ${(sup.balance || 0) > 0 ? 'text-red-600 font-mono' : 'text-slate-300 font-mono'}`}>
                    SAR {(sup.balance || 0).toLocaleString()}.00
                  </p>
                </div>
              </div>
              <div className="bg-slate-50/50 border-t border-slate-50 px-6 py-2.5 flex justify-between items-center transition-colors group-hover:bg-slate-50">
                 <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-800"><ArrowUpRight className="h-4 w-4" /></Button>
                 </div>
                 <Button variant="ghost" className="h-7 text-[10px] font-black text-[#2563eb] hover:bg-transparent uppercase tracking-wider">
                   Full Audit Statement <ChevronRight className="ml-1 h-3 w-3" />
                 </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default function PurchaseModule({ subModule, initialParams }: { subModule: string, initialParams?: any }) {
  const [view, setView] = useState<string>('Dashboard');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    // If submodule passed from prop, prioritizing it (for sidebar navigation)
    if (subModule) setView(subModule);
  }, [subModule]);

  useEffect(() => {
    Promise.all([
      fetch('/api/suppliers').then(r => r.json()),
      fetch('/api/projects').then(r => r.json())
    ]).then(([s, p]) => {
      setSuppliers(Array.isArray(s) ? s : []);
      setProjects(Array.isArray(p) ? p : []);
    });
  }, []);

  const renderView = () => {
    switch (view) {
      case 'Bills':
        return <BillsView onLogNewBill={() => setView('LogBill')} />;
      case 'Suppliers':
        return <SuppliersView onOnboard={() => setView('OnboardSupplier')} />;
      case 'LogBill':
        return (
          <BillForm 
            onCancel={() => setView('Bills')} 
            onSuccess={() => setView('Bills')} 
            suppliers={suppliers} 
            projects={projects}
          />
        );
      case 'OnboardSupplier':
        return (
          <SupplierForm 
            onCancel={() => setView('Suppliers')} 
            onSuccess={() => setView('Suppliers')} 
          />
        );
      case 'Dashboard':
      default:
        return <PurchaseDashboard />;
    }
  };

  return (
    <div className="space-y-6">
      {renderView()}
    </div>
  );
}
