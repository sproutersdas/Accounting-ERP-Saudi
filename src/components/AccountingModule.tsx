import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  ExternalLink, 
  ArrowRightLeft, 
  Wallet, 
  FileText, 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal, 
  CheckCircle2,
  LayoutDashboard,
  Upload,
  AlertCircle,
  CheckCircle,
  FileSearch,
  Printer,
  DollarSign,
  TrendingUp,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  Save,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
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
  Cell 
} from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import FinancialTracking from './FinancialTracking';
import LedgerManager from './LedgerManager';

// --- INVOICES VIEW (MOVED FROM SALES) ---
const InvoicesView = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [newInvoice, setNewInvoice] = useState<any>({
    invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    customer_id: '',
    date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    total_amount: '',
    vat_amount: '',
    payment_mode: 'Cash',
    payment_reference: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, custRes, compRes] = await Promise.all([
        fetch('/api/invoices'),
        fetch('/api/customers'),
        fetch('/api/company-details')
      ]);

      if (invRes.status === 401) {
        window.location.reload();
        return;
      }

      const [invData, custData, compData] = await Promise.all([
        invRes.json(),
        custRes.json(),
        compRes.json()
      ]);

      setInvoices(Array.isArray(invData) ? invData : []);
      setCustomers(Array.isArray(custData) ? custData : []);

      if (Array.isArray(compData) && compData.length > 0) {
        setCompany(compData[0]);
      } else if (compData && compData.name) {
        setCompany(compData);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.customer_id) {
      toast.error('Please select a customer');
      return;
    }

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newInvoice,
          total_amount: Number(newInvoice.total_amount),
          vat_amount: Number(newInvoice.total_amount) * 0.15,
          customer_id: Number(newInvoice.customer_id)
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to create invoice');
      }

      toast.success('Invoice created successfully');
      setIsAddOpen(false);
      setNewInvoice({
        invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        customer_id: '',
        date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        total_amount: 0,
        vat_amount: 0
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-bold text-[10px]">PAID</Badge>;
      case 'pending': return <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-bold text-[10px]">PENDING</Badge>;
      case 'overdue': return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none font-bold text-[10px]">OVERDUE</Badge>;
      default: return <Badge variant="outline" className="uppercase text-[10px]">{status}</Badge>;
    }
  };

  const [printingInvoice, setPrintingInvoice] = useState<any>(null);

  const handlePrint = (invoice: any) => {
    setPrintingInvoice(invoice);
    setTimeout(() => {
      window.print();
      setPrintingInvoice(null);
    }, 100);
  };

  if (loading) return <div className="h-64 flex items-center justify-center text-slate-400 font-mono text-xs uppercase tracking-widest animate-pulse">Loading Invoices...</div>;

  return (
    <div className="space-y-6 relative">
      {/* Hidden Print View for Invoices */}
      {printingInvoice && (
        <div className="fixed inset-0 bg-white z-[9999] p-12 hidden print:block overflow-y-auto">
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-10">
            <div className="flex items-center gap-6">
              {company?.logo_url ? (
                <img src={company.logo_url} alt="Logo" className="h-20 w-20 object-contain" />
              ) : (
                <div className="h-20 w-20 bg-slate-100 flex items-center justify-center border border-slate-200 rounded-lg">
                  <TrendingUp className="h-10 w-10 text-slate-300" />
                </div>
              )}
              <div className="space-y-1">
                <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">{company?.name || 'Institutional Enterprise'}</h1>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                  CR: {company?.cr_number || '1010992376'} | VAT: {company?.vat_number || '312100807900003'}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {company?.address || '6644 AL Ahsa st'}, {company?.city || 'Riyadh'}, {company?.country || 'KSA'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-black uppercase tracking-tighter text-blue-600">TAX INVOICE</h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Ref: {printingInvoice.invoice_number}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12 mb-12">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase text-slate-300 tracking-widest border-b border-slate-100 pb-1">Billed To</h3>
              <p className="text-lg font-black text-slate-900 uppercase">{printingInvoice.customer_name}</p>
              <div className="text-xs font-bold text-slate-500 space-y-1">
                <p>Tax ID: {printingInvoice.customer_tax_id || 'N/A'}</p>
                <p>Status: Registered Account</p>
              </div>
            </div>
            <div className="space-y-4 text-right">
              <h3 className="text-[10px] font-black uppercase text-slate-300 tracking-widest border-b border-slate-100 pb-1">Logistics</h3>
              <div className="text-xs font-bold text-slate-500 space-y-1">
                <p><span className="text-slate-300">Date:</span> {printingInvoice.date}</p>
                <p><span className="text-slate-300">Due:</span> {printingInvoice.due_date}</p>
              </div>
            </div>
          </div>

          <table className="w-full mb-12">
            <thead>
              <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-widest h-10">
                <th className="text-left pl-6">Description</th>
                <th className="text-right pr-6">Amount (SAR)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100 h-16">
                <td className="pl-6 font-bold text-slate-800">Professional Services / Supply of Goods as per PO</td>
                <td className="text-right pr-6 font-mono font-bold text-slate-900">{printingInvoice.total_amount.toLocaleString()}.00</td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-72 space-y-3">
              <div className="flex justify-between text-[11px] font-black uppercase text-slate-400">
                <span>Sub-Total</span>
                <span>{printingInvoice.total_amount.toLocaleString()}.00</span>
              </div>
              <div className="flex justify-between text-[11px] font-black uppercase text-slate-400">
                <span>VAT (15%)</span>
                <span>{printingInvoice.vat_amount.toLocaleString()}.00</span>
              </div>
              <div className="pt-3 border-t-2 border-slate-900 flex justify-between text-xl font-black text-slate-900">
                <span>Total Due</span>
                <span>SAR {(printingInvoice.total_amount + printingInvoice.vat_amount).toLocaleString()}.00</span>
              </div>
            </div>
          </div>

          <div className="mt-24 pt-12 border-t border-slate-100 grid grid-cols-2 gap-12">
            <div className="space-y-6">
              <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Digital Verification</p>
              <div className="h-24 w-24 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center">
                 <div className="text-[9px] font-bold text-slate-300 text-center px-2">QR ENCODED DATA SYNCED</div>
              </div>
            </div>
            <div className="flex flex-col items-end justify-end">
               <div className="w-48 border-b-2 border-slate-900 h-12"></div>
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-3">Authorized Signature</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between print:hidden">
        <h2 className="text-xl font-bold tracking-tight text-slate-800">Tax Invoices</h2>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={
            <Button className="bg-blue-600 hover:bg-blue-700 text-white h-9 text-[11px] font-bold uppercase tracking-wider rounded-xl shadow-md">
              <Plus className="mr-2 h-4 w-4" /> Create New Invoice
            </Button>
          } />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm font-black uppercase tracking-widest text-blue-600">Create Tax Invoice</DialogTitle>
            </DialogHeader>
             <form onSubmit={handleCreateInvoice} className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">Invoice No.</Label>
                  <Input size="sm" readOnly value={newInvoice.invoice_number} className="bg-slate-50 font-mono" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">Customer</Label>
                <Combobox
                  options={customers.map(c => ({ label: c.name, value: c.id.toString() }))}
                  value={newInvoice.customer_id?.toString() || ""}
                  onValueChange={(v) => setNewInvoice(prev => ({ ...prev, customer_id: v }))}
                  placeholder="Select Customer"
                  className="h-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Issue Date</Label>
                  <Input type="date" value={newInvoice.date} onChange={e => setNewInvoice(prev => ({ ...prev, date: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Due Date</Label>
                  <Input type="date" value={newInvoice.due_date} onChange={e => setNewInvoice(prev => ({ ...prev, due_date: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">Amount (Excl. VAT)</Label>
                <Input 
                   icon={DollarSign}
                   type="number" 
                   step="0.01" 
                   value={newInvoice.total_amount} 
                   onChange={e => setNewInvoice((prev: any) => ({ ...prev, total_amount: e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value)) }))} 
                   min="0"
                />
                <p className="text-[10px] text-slate-400 font-medium pl-4">VAT (15%) will be calculated as: {(Number(newInvoice.total_amount) * 0.15).toLocaleString()}.00 SAR</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">Mode of Payment</Label>
                <Combobox
                  options={[
                    { label: 'Cash', value: 'Cash' },
                    { label: 'Bank Transfer', value: 'Bank Transfer' },
                    { label: 'Cheque', value: 'Cheque' }
                  ]}
                  value={newInvoice.payment_mode || "Cash"}
                  onValueChange={(v) => setNewInvoice((prev: any) => ({ ...prev, payment_mode: v }))}
                  placeholder="Select Payment Mode"
                  className="h-10"
                />
              </div>

              {(newInvoice.payment_mode === 'Bank Transfer' || newInvoice.payment_mode === 'Cheque') && (
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400">
                    {newInvoice.payment_mode === 'Cheque' ? 'Cheque Number' : 'Transaction ID'}
                  </Label>
                  <Input 
                    value={newInvoice.payment_reference} 
                    onChange={e => setNewInvoice((prev: any) => ({ ...prev, payment_reference: e.target.value }))} 
                    placeholder={newInvoice.payment_mode === 'Cheque' ? 'CHQ-...' : 'TRN-...'}
                  />
                </div>
              )}

              <DialogFooter>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 text-xs font-black uppercase tracking-[0.1em] rounded-xl shadow-lg shadow-blue-600/20">Generate Invoice</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="border-b border-slate-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="relative w-72">
              <Input icon={Search} placeholder="Search invoices..." />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-9 text-[10px] font-bold text-slate-600 border-slate-200">
                <Filter className="mr-2 h-3.5 w-3.5" /> Filter
              </Button>
              <Button variant="outline" size="sm" className="h-9 text-[10px] font-bold text-slate-600 border-slate-200">
                <Download className="mr-2 h-3.5 w-3.5" /> Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-slate-500 text-[11px] h-10 px-6 uppercase tracking-wider">Invoice ID</TableHead>
                <TableHead className="font-bold text-slate-500 text-[11px] h-10 px-6 uppercase tracking-wider">Customer</TableHead>
                <TableHead className="font-bold text-slate-500 text-[11px] h-10 px-6 uppercase tracking-wider">Date</TableHead>
                <TableHead className="font-bold text-slate-500 text-[11px] h-10 px-6 uppercase tracking-wider text-right">Amount (SAR)</TableHead>
                <TableHead className="font-bold text-slate-500 text-[11px] h-10 px-6 uppercase tracking-wider text-center">Status</TableHead>
                <TableHead className="h-10 px-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-400 font-mono text-[10px] uppercase tracking-[0.2em]">No records found</TableCell>
                </TableRow>
              ) : invoices.map((inv) => (
                <TableRow key={inv.id} className="hover:bg-slate-50/80 border-b border-slate-50 transition-colors">
                  <TableCell className="px-6 py-4 font-bold text-slate-800 text-xs">{inv.invoice_number}</TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700 text-xs">{inv.customer_name}</span>
                      <span className="text-[10px] text-slate-400 font-medium">Due: {inv.due_date}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-slate-500 text-xs font-medium">{inv.date}</TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-slate-800 text-xs">{(inv.total_amount || 0).toLocaleString()}.00</span>
                      <span className="text-[9px] text-blue-600 font-bold">VAT: {(inv.vat_amount || 0).toLocaleString()}.00</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center">{getStatusBadge(inv.status)}</TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handlePrint(inv)} 
                        className="h-8 px-4 text-[10px] font-black uppercase tracking-widest border-none bg-blue-600 text-white hover:bg-blue-700 rounded-xl shadow-sm gap-1.5"
                      >
                        <Printer className="h-3 w-3" /> Print
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-800">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuGroup>
                            <DropdownMenuItem className="text-[11px] font-bold py-2 uppercase tracking-wide"><ExternalLink className="mr-2 h-3.5 w-3.5" /> View Details</DropdownMenuItem>
                            <DropdownMenuItem className="text-[11px] font-bold py-2 uppercase tracking-wide"><Download className="mr-2 h-3.5 w-3.5" /> Download PDF</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-[11px] font-bold py-2 uppercase tracking-wide text-blue-600"><CheckCircle2 className="mr-2 h-3.5 w-3.5" /> Mark as Paid</DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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

export function ChartOfAccounts() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({ code: '', name: '', type: 'Asset' });

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/coa');
      const data = await res.json();
      setAccounts(data);
    } catch (err) {
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/coa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccount)
      });
      if (!res.ok) throw new Error('Failed to create account');
      toast.success('Account created');
      setIsAddOpen(false);
      setNewAccount({ code: '', name: '', type: 'Asset' });
      fetchAccounts();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) return <div className="h-48 flex items-center justify-center text-slate-400 font-mono text-[10px] animate-pulse">Consulting General Ledger...</div>;

  return (
    <Card className="border-slate-200 shadow-sm border-none bg-white">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 py-4 px-6 text-nowrap">
        <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Chart of Accounts</CardTitle>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button size="sm" className="gap-2 bg-[#2563eb] h-8 text-[11px] font-bold uppercase tracking-wider"><Plus className="h-3.5 w-3.5" /> New Account</Button>} />
          <DialogContent>
            <DialogHeader><DialogTitle className="text-sm font-black uppercase tracking-widest">Register New Account</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">Account Code</Label>
                <Input required value={newAccount.code} onChange={e => setNewAccount({...newAccount, code: e.target.value})} placeholder="e.g. 1100" className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">Account Name</Label>
                <Input required value={newAccount.name} onChange={e => setNewAccount({...newAccount, name: e.target.value})} placeholder="e.g. Petty Cash" className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">Type</Label>
                <Combobox
                  options={['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'].map(t => ({ label: t, value: t }))}
                  value={newAccount.type || ""}
                  onValueChange={v => setNewAccount({ ...newAccount, type: v })}
                  placeholder="Select Type"
                  className="h-10"
                />
              </div>
              <Button type="submit" className="w-full bg-[#2563eb] h-11 text-xs font-black uppercase tracking-widest">Create Account</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="h-10 hover:bg-transparent">
              <TableHead className="px-6 text-[10px] font-black uppercase tracking-wider">Account Code</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-wider">Account Name</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-wider">Category</TableHead>
              <TableHead className="text-right text-[10px] font-black uppercase tracking-wider">Balance (SAR)</TableHead>
              <TableHead className="text-right px-6 text-[10px] font-black uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map(acc => (
              <TableRow key={acc.code} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                <TableCell className="px-6 font-mono text-[11px] font-bold text-slate-400">{acc.code}</TableCell>
                <TableCell className="font-bold text-sm text-slate-800">{acc.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[9px] font-black uppercase tracking-[0.15em] border-slate-200 bg-white text-slate-500 whitespace-nowrap">{acc.type}</Badge>
                </TableCell>
                <TableCell className="text-right font-mono font-bold text-slate-700">{(acc.balance || 0).toLocaleString()}.00</TableCell>
                <TableCell className="text-right px-6">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:text-blue-700 transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    } />
                    <DropdownMenuContent align="end" className="w-44 bg-white rounded-xl shadow-xl border-blue-50">
                      <DropdownMenuGroup>
                        <DropdownMenuItem className="text-[11px] font-bold py-3 uppercase tracking-wide px-4 focus:bg-blue-50 focus:text-blue-700 cursor-pointer">
                          <Eye className="mr-2 h-3.5 w-3.5 text-blue-500" /> View Ledger
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-[11px] font-bold py-3 uppercase tracking-wide px-4 focus:bg-blue-50 focus:text-blue-700 cursor-pointer">
                          <Edit className="mr-2 h-3.5 w-3.5 text-primary" /> Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-blue-50" />
                        <DropdownMenuItem className="text-[11px] font-bold py-3 uppercase tracking-wide px-4 focus:bg-red-50 text-red-600 focus:text-red-700 cursor-pointer">
                          <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete Account
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
  );
}

export function JournalEntries() {
  const [view, setView] = useState<'list' | 'form'>('list');

  return (
    <div className="space-y-6 text-nowrap">
      {view === 'list' ? (
        <JournalEntriesList onPost={() => setView('form')} />
      ) : (
        <JournalEntryForm onBack={() => setView('list')} />
      )}
    </div>
  );
}

function JournalEntriesList({ onPost }: { onPost: () => void }) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/journal-entries');
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to load accounting data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  if (loading) return <div className="h-48 flex items-center justify-center text-slate-400 font-mono text-[10px] animate-pulse">Consulting General Ledger...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-slate-800 uppercase">Double-Entry Journals</h2>
        <Button 
          onClick={onPost} 
          className="bg-blue-500 hover:bg-blue-600 text-white h-10 px-8 text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 rounded-xl transition-all"
        >
          <Plus className="mr-2 h-4 w-4" /> Post Entry
        </Button>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="h-12 border-none">
                <TableHead className="px-6 text-[10px] font-black uppercase tracking-widest">Entry Date</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Description</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Ref</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Debit Amount</TableHead>
                <TableHead className="px-6 text-right text-[10px] font-black uppercase tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-32 text-center text-slate-400 uppercase text-[10px] tracking-widest">No posted journals found</TableCell></TableRow>
              ) : entries.map(je => (
                <TableRow key={je.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50">
                  <TableCell className="px-6 py-4 font-bold text-slate-500 text-xs">{je.date}</TableCell>
                  <TableCell className="font-bold text-slate-800 text-xs">{je.description}</TableCell>
                  <TableCell className="text-[11px] font-mono text-slate-400">{je.reference || '--'}</TableCell>
                  <TableCell className="text-right font-bold text-slate-700 text-sm">{(je.total_debit || 0).toLocaleString()}.00</TableCell>
                  <TableCell className="px-6 text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-4 text-[10px] font-black uppercase tracking-widest text-white bg-blue-500 hover:bg-blue-600 rounded-xl shadow-sm"
                    >
                      Explore
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function JournalEntryForm({ onBack }: { onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [newEntry, setNewEntry] = useState<any>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    items: [
      { account_id: '', debit: '', credit: '', memo: '' },
      { account_id: '', debit: '', credit: '', memo: '' }
    ]
  });

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch('/api/coa');
        const data = await res.json();
        setAccounts(Array.isArray(data) ? data : []);
      } catch (err) {
        toast.error('Failed to load accounts');
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalDebit = newEntry.items.reduce((s, i) => s + (Number(i.debit) || 0), 0);
    const totalCredit = newEntry.items.reduce((s, i) => s + (Number(i.credit) || 0), 0);

    if (totalDebit !== totalCredit) {
      toast.error('Entry is not balanced! Debits must equal Credits.');
      return;
    }

    try {
      const res = await fetch('/api/journal-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry)
      });
      if (!res.ok) throw new Error('Failed to post entry');
      toast.success('Journal entry posted');
      onBack();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const addLine = () => setNewEntry({...newEntry, items: [...newEntry.items, { account_id: '', debit: '', credit: '', memo: '' }]});
  const removeLine = (idx: number) => {
    if (newEntry.items.length <= 2) {
      toast.error('Journal entry requires at least 2 lines');
      return;
    }
    const items = newEntry.items.filter((_, i) => i !== idx);
    setNewEntry({...newEntry, items});
  };

  if (loading) return <div className="h-48 flex items-center justify-center text-slate-400 font-mono text-[10px] animate-pulse uppercase tracking-widest">Hydrating Accounting Matrix...</div>;

  return (
    <form onSubmit={handlePost} className="space-y-6 min-h-[80vh]">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-blue-50">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" onClick={onBack} size="icon" className="text-blue-400 hover:bg-blue-50 rounded-full">
            <ArrowRightLeft className="h-5 w-5 rotate-180" />
          </Button>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-blue-950">New Journal Entry</h2>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Double-entry ledger synchronization</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="ghost" onClick={onBack} className="h-10 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Abort Changes</Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest px-8 shadow-xl shadow-blue-600/20 rounded-xl h-10">
            <Save className="mr-2 h-4 w-4" /> Commit Transaction
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1 border-none shadow-sm bg-white p-6 space-y-5 rounded-2xl">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-blue-600/60 tracking-widest">Entry Date</Label>
            <Input type="date" required value={newEntry.date} onChange={e => setNewEntry({...newEntry, date: e.target.value})} className="h-11 font-bold text-xs border-blue-50 bg-blue-50/10 focus:ring-2 focus:ring-blue-500/20 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-blue-600/60 tracking-widest">Reference / Document #</Label>
            <Input value={newEntry.reference} onChange={e => setNewEntry({...newEntry, reference: e.target.value})} placeholder="e.g. JV-100" className="h-11 font-bold text-xs border-blue-50 bg-blue-50/10 focus:ring-2 focus:ring-blue-500/20 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-blue-600/60 tracking-widest">Description</Label>
            <textarea 
              required 
              value={newEntry.description} 
              onChange={e => setNewEntry({...newEntry, description: e.target.value})} 
              placeholder="Provide explicit transaction details for audit trails..." 
              className="w-full min-h-[150px] p-4 text-xs font-bold text-slate-700 border border-blue-50 bg-blue-50/10 rounded-2xl focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
            />
          </div>
        </Card>

        <Card className="md:col-span-3 border-none shadow-sm bg-white overflow-hidden rounded-2xl">
          <div className="p-0">
            <Table>
              <TableHeader className="bg-slate-50 border-b border-slate-100">
                <TableRow className="h-10 hover:bg-transparent">
                  <TableHead className="px-6 text-[9px] font-black uppercase tracking-widest">Account</TableHead>
                  <TableHead className="text-[9px] font-black uppercase tracking-widest text-right">Debit</TableHead>
                  <TableHead className="text-[9px] font-black uppercase tracking-widest text-right">Credit</TableHead>
                  <TableHead className="px-6 text-right text-[9px] font-black uppercase tracking-widest">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {newEntry.items.map((item, idx) => (
                  <TableRow key={idx} className="border-b border-slate-50 last:border-none">
                    <TableCell className="px-6 py-2">
                      <Combobox
                        options={accounts.map(acc => ({ label: acc.display_name, value: acc.id.toString() }))}
                        value={(item.account_id || "").toString()}
                        onValueChange={v => {
                          const items = [...newEntry.items];
                          items[idx].account_id = v;
                          setNewEntry({ ...newEntry, items });
                        }}
                        placeholder="Select Account"
                        className="h-9 text-xs border-slate-100 bg-white shadow-none font-bold uppercase transition-colors"
                      />
                    </TableCell>
                    <TableCell className="w-32">
                      <Input 
                        type="number" 
                        className="h-9 text-xs text-right border-slate-100 font-black" 
                        value={item.debit} 
                        onChange={e => {
                          const items = [...newEntry.items];
                          items[idx].debit = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value));
                          setNewEntry({...newEntry, items});
                        }}
                        min="0"
                      />
                    </TableCell>
                    <TableCell className="w-32">
                      <Input 
                        type="number" 
                        className="h-9 text-xs text-right border-slate-100 font-black" 
                        value={item.credit} 
                        onChange={e => {
                          const items = [...newEntry.items];
                          items[idx].credit = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value));
                          setNewEntry({...newEntry, items});
                        }}
                        min="0"
                      />
                    </TableCell>
                    <TableCell className="px-6 text-right">
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeLine(idx)} className="h-8 w-8 text-slate-300 hover:text-red-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <div className="p-4 bg-slate-50/50 flex justify-between items-center border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={addLine} className="h-8 text-[10px] font-black uppercase text-blue-600 border-blue-100 hover:bg-blue-50">
                <Plus className="mr-2 h-3 w-3" /> Add Transaction Line
              </Button>
              <div className="flex gap-10 text-[11px] font-black uppercase tracking-widest text-slate-900">
                <div className="flex flex-col items-end">
                  <span className="text-[8px] text-slate-400">Total Debits</span>
                  <span>SAR {newEntry.items.reduce((s, i) => s + (Number(i.debit) || 0), 0).toLocaleString()}.00</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[8px] text-slate-400">Total Credits</span>
                  <span>SAR {newEntry.items.reduce((s, i) => s + (Number(i.credit) || 0), 0).toLocaleString()}.00</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </form>
  );
}

export function BankReconciliation() {
  const [recons, setRecons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [matchingMode, setMatchingMode] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [statementData, setStatementData] = useState<any[]>([]);
  const [systemTransactions, setSystemTransactions] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  
  const [newRecon, setNewRecon] = useState<any>({
    account_id: '',
    statement_date: new Date().toISOString().split('T')[0],
    statement_balance: '',
    ledger_balance: ''
  });

  const fetchData = async () => {
    try {
      const [rRes, aRes] = await Promise.all([
        fetch('/api/bank-reconciliations'),
        fetch('/api/coa')
      ]);
      const [rData, aData] = await Promise.all([rRes.json(), aRes.json()]);
      setRecons(Array.isArray(rData) ? rData : []);
      setAccounts(Array.isArray(aData) ? aData.filter((a: any) => a.type === 'Asset' || a.name.toLowerCase().includes('bank')) : []);
    } catch (err) {
      toast.error('Failed to load reconciliation data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedAccountId) {
      toast.error('Please select an account first');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const data = lines.slice(1).map(line => {
        const [date, desc, amount] = line.split(',');
        if (!date || !amount) return null;
        return { 
          date: date.trim(), 
          description: desc?.trim(), 
          amount: parseFloat(amount.trim()),
          id: Math.random().toString(36).substr(2, 9)
        };
      }).filter(Boolean);
      
      setStatementData(data);
      await fetchSystemTransactions(selectedAccountId);
      autoMatch(data);
    };
    reader.readAsText(file);
  };

  const fetchSystemTransactions = async (accountId: string) => {
    try {
      const res = await fetch(`/api/reconciliation/transactions/${accountId}`);
      if (!res.ok) throw new Error('Failed to fetch ledger transactions');
      const data = await res.json();
      setSystemTransactions(data);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const autoMatch = (statement: any[]) => {
    // Basic matching algorithm
    const newMatches: any[] = [];
    const usedSystemIds = new Set();

    statement.forEach(s => {
      const match = systemTransactions.find(sys => 
        !usedSystemIds.has(sys.id) &&
        Math.abs(sys.amount - s.amount) < 0.01 &&
        sys.date === s.date
      );

      if (match) {
        newMatches.push({ statementId: s.id, systemId: match.id, status: 'matched' });
        usedSystemIds.add(match.id);
      }
    });

    setMatches(newMatches);
    toast.success(`Automatically matched ${newMatches.length} transactions`);
  };

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/bank-reconciliations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecon)
      });
      if (!res.ok) throw new Error('Failed to start reconciliation');
      toast.success('Reconciliation period started');
      setIsAddOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) return <div className="h-48 flex items-center justify-center text-slate-400 font-mono text-[10px] animate-pulse">Reconciling Statements...</div>;

  if (matchingMode) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setMatchingMode(false)}>
              <ArrowRightLeft className="mr-2 h-4 w-4 rotate-180" /> Back
            </Button>
            <h2 className="text-xl font-bold tracking-tight text-slate-800 uppercase">Matching Engine</h2>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-blue-100 text-blue-600 border-none uppercase text-[9px] font-black px-3">{statementData.length} Stmt Items</Badge>
            <Badge className="bg-blue-200 text-blue-700 border-none uppercase text-[9px] font-black px-3">{matches.length} Matched</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Statement Side */}
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3 px-6 text-center">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bank Statement Data</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <Table>
                 <TableHeader className="bg-slate-50/30">
                   <TableRow className="h-10 hover:bg-transparent">
                     <TableHead className="px-6 text-[9px] font-black uppercase text-slate-400">Date</TableHead>
                     <TableHead className="text-[9px] font-black uppercase text-slate-400">Description</TableHead>
                     <TableHead className="text-[9px] font-black uppercase text-slate-400 text-right">Amount</TableHead>
                     <TableHead className="w-10"></TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {statementData.map(s => {
                     const isMatched = matches.find(m => m.statementId === s.id);
                     return (
                       <TableRow key={s.id} className={`h-12 border-b border-slate-50 ${isMatched ? 'bg-blue-50/30' : ''}`}>
                         <TableCell className="px-6 text-[11px] font-bold text-slate-600">{s.date}</TableCell>
                         <TableCell className="text-[11px] font-medium text-slate-700 truncate max-w-[150px]">{s.description}</TableCell>
                         <TableCell className="text-[11px] font-black text-right text-slate-900">{s.amount.toLocaleString()}</TableCell>
                         <TableCell className="px-4">
                           {isMatched ? <CheckCircle className="h-4 w-4 text-blue-500" /> : <AlertCircle className="h-4 w-4 text-primary" />}
                         </TableCell>
                       </TableRow>
                     );
                   })}
                 </TableBody>
               </Table>
            </CardContent>
          </Card>

          {/* Ledger Side */}
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3 px-6 text-center">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Ledger Entries</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <Table>
                 <TableHeader className="bg-slate-50/30">
                   <TableRow className="h-10 hover:bg-transparent">
                     <TableHead className="px-6 text-[9px] font-black uppercase text-slate-400">Date</TableHead>
                     <TableHead className="text-[9px] font-black uppercase text-slate-400">Reference</TableHead>
                     <TableHead className="text-[9px] font-black uppercase text-slate-400 text-right">Ledger Amt</TableHead>
                     <TableHead className="w-10"></TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {systemTransactions.map(sys => {
                     const isMatched = matches.find(m => m.systemId === sys.id);
                     const amount = sys.amount;
                     return (
                       <TableRow key={sys.id} className={`h-12 border-b border-slate-50 ${isMatched ? 'bg-blue-50/30' : ''}`}>
                         <TableCell className="px-6 text-[11px] font-bold text-slate-600">
                           <div className="flex flex-col">
                             <span>{sys.date}</span>
                             <Badge variant="outline" className="w-fit text-[7px] px-1 py-0 border-none bg-slate-100 text-slate-400 font-bold uppercase">{sys.type}</Badge>
                           </div>
                         </TableCell>
                         <TableCell className="text-[11px] font-medium text-slate-700 truncate max-w-[150px]">{sys.reference || sys.description}</TableCell>
                         <TableCell className={`text-[11px] font-black text-right ${amount < 0 ? 'text-red-500' : 'text-blue-600'}`}>{amount.toLocaleString()}</TableCell>
                         <TableCell className="px-4">
                            {isMatched ? <CheckCircle className="h-4 w-4 text-blue-500" /> : <div className="h-4 w-4" />}
                         </TableCell>
                       </TableRow>
                     );
                   })}
                 </TableBody>
               </Table>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex justify-end pt-4">
          <Button disabled={matches.length === 0} className="bg-blue-600 hover:bg-blue-700 h-11 px-8 text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">Finalize Reconciliation</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 uppercase">Bank Reconciliation</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Match bank statements with accounting ledger</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger render={<Button variant="outline" className="h-10 text-[11px] font-bold uppercase tracking-wider border-slate-200"><Plus className="mr-2 h-4 w-4" /> Period</Button>} />
            <DialogContent>
              <DialogHeader><DialogTitle className="text-sm font-black uppercase tracking-widest text-slate-800">Setup Reconciliation Period</DialogTitle></DialogHeader>
              <form onSubmit={handleStart} className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Target Bank Account</Label>
                  <Combobox
                    options={accounts.map(acc => ({ label: acc.display_name, value: acc.id.toString() }))}
                    value={newRecon.account_id ? newRecon.account_id.toString() : ""}
                    onValueChange={v => setNewRecon({ ...newRecon, account_id: v })}
                    placeholder="Select Account"
                    className="h-11 border-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Statement Cut-off Date</Label>
                  <Input type="date" required value={newRecon.statement_date} onChange={e => setNewRecon({...newRecon, statement_date: e.target.value})} className="h-11 border-slate-200" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Stmt Ending Balance</Label>
                    <Input type="number" step="0.01" required value={newRecon.statement_balance} onChange={e => setNewRecon({...newRecon, statement_balance: e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value))})} className="h-11 border-slate-200" min="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400">System Balance</Label>
                    <Input type="number" step="0.01" required value={newRecon.ledger_balance} onChange={e => setNewRecon({...newRecon, ledger_balance: e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value))})} className="h-11 border-slate-200" min="0" />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-slate-900 h-12 text-xs font-black uppercase tracking-widest">Create Record</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Button 
            onClick={() => {
              if (!selectedAccountId) {
                toast.error('Select an account to start matching');
                return;
              }
              setMatchingMode(true);
            }} 
            className="bg-[#2563eb] hover:bg-blue-700 h-10 text-[11px] font-bold uppercase tracking-wider shadow-lg shadow-blue-500/20"
          >
            <FileSearch className="mr-2 h-4 w-4" /> Matching Tool
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
           <div className="flex-1 w-full space-y-2">
             <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Select Account to Analyze</Label>
             <Combobox
               options={accounts.map(acc => ({ label: acc.display_name, value: acc.id.toString() }))}
               value={selectedAccountId ? selectedAccountId.toString() : ""}
               onValueChange={setSelectedAccountId}
               placeholder="Begin by choosing a bank account..."
               className="h-12 border-slate-200 bg-slate-50/50"
             />
           </div>
           
           <div className="flex-1 w-full">
             <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50 group hover:bg-blue-50/30 hover:border-blue-200 transition-all cursor-pointer relative overflow-hidden">
               <input 
                 type="file" 
                 accept=".csv"
                 onChange={handleFileUpload}
                 className="absolute inset-0 opacity-0 cursor-pointer z-10"
               />
               <Upload className="h-8 w-8 text-slate-300 group-hover:text-blue-500 mx-auto mb-3 transition-colors" />
               <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-600 transition-colors">Upload Statement (CSV)</p>
               <p className="text-[10px] text-slate-400 mt-1 font-medium">Format: Date, Description, Amount</p>
             </div>
           </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recons.map(r => (
          <Card key={r.id} className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all border border-slate-100">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between space-y-0">
               <div>
                 <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">PERIOD ENDING</p>
                 <p className="text-xs font-black text-slate-800">{new Date(r.statement_date).toLocaleDateString()}</p>
               </div>
               <Badge className={`text-[8px] font-black uppercase border-none rounded-sm px-2 py-0.5 ${r.status === 'open' ? 'bg-primary/10 text-primary' : 'bg-blue-100 text-blue-600'}`}>{r.status}</Badge>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <Wallet className="h-5 w-5" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ACCOUNT</p>
                  <p className="text-xs font-bold text-slate-700 truncate">{r.account_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">STMT BAL</p>
                   <p className="text-xs font-black text-slate-900">SAR {r.statement_balance.toLocaleString()}</p>
                </div>
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">DIFF</p>
                   <p className={`text-xs font-black ${Math.abs(r.statement_balance - r.ledger_balance) < 0.01 ? 'text-blue-600' : 'text-red-600'}`}>
                     SAR {(r.statement_balance - r.ledger_balance).toLocaleString()}
                   </p>
                </div>
              </div>

              <Button variant="outline" className="w-full h-10 text-[10px] font-black uppercase tracking-widest border-none bg-blue-600 text-white hover:bg-blue-700 transition-all rounded-xl shadow-md">
                View History <ArrowRightLeft className="ml-2 h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


export function HorizontalBalanceSheet() {
  const assets = [
    { name: 'Cash at Bank', amount: 125000 },
    { name: 'Accounts Receivable', amount: 305100 },
    { name: 'Fixed Assets', amount: 450000 },
  ];
  const liabilities = [
    { name: 'Accounts Payable', amount: 85000 },
    { name: 'VAT Payable (15%)', amount: 45200 },
    { name: 'Zakat Provision', amount: 15000 },
  ];
  const equity = [
    { name: 'Share Capital', amount: 200000 },
    { name: 'Retained Earnings', amount: 534900 },
  ];

  const totalAssets = assets.reduce((s, a) => s + a.amount, 0);
  const totalLiabEq = liabilities.reduce((s, l) => s + l.amount, 0) + equity.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800 uppercase">Statement of Financial Position</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Single Entity Presentation | As of April 19, 2026</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-slate-200 border border-slate-200 rounded-xl overflow-hidden shadow-md">
        {/* ASSETS SIDE */}
        <div className="bg-white p-8 space-y-6 flex flex-col h-full">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 pb-3 mb-2">Assets</h3>
          <div className="space-y-5 flex-1">
            {assets.map(item => (
              <div key={item.name} className="flex justify-between items-center text-sm group">
                <span className="text-slate-500 font-medium group-hover:text-slate-800 transition-colors uppercase tracking-wide text-[11px]">{item.name}</span>
                <span className="font-mono font-bold text-slate-700 tracking-tight">{item.amount.toLocaleString()}.00</span>
              </div>
            ))}
          </div>
          <div className="pt-6 mt-8 border-t-2 border-slate-900 border-double flex justify-between font-black text-xl text-slate-900 uppercase tracking-tight">
            <span>Total Assets</span>
            <span className="font-mono">SAR {totalAssets.toLocaleString()}.00</span>
          </div>
        </div>

        {/* LIABILITIES & EQUITY SIDE */}
        <div className="bg-slate-50 p-8 space-y-8 flex flex-col h-full border-l border-slate-100">
          <div className="flex-1 space-y-8">
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 pb-3 mb-4">Liabilities</h3>
              <div className="space-y-4">
                {liabilities.map(item => (
                  <div key={item.name} className="flex justify-between items-center text-[11px] font-medium group">
                    <span className="text-slate-500 group-hover:text-slate-800 transition-colors uppercase tracking-wide">{item.name}</span>
                    <span className="font-mono font-bold text-slate-700">{item.amount.toLocaleString()}.00</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 pb-3 mb-4">Equity</h3>
              <div className="space-y-4">
                {equity.map(item => (
                  <div key={item.name} className="flex justify-between items-center text-[11px] font-medium group">
                    <span className="text-slate-500 group-hover:text-slate-800 transition-colors uppercase tracking-wide">{item.name}</span>
                    <span className="font-mono font-bold text-slate-700">{item.amount.toLocaleString()}.00</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="pt-6 border-t-2 border-slate-900 border-double flex justify-between font-black text-xl text-slate-900 uppercase tracking-tight">
            <span>Total Liab & Equity</span>
            <span className="font-mono text-blue-600">SAR {totalLiabEq.toLocaleString()}.00</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const AccountingOverview = ({ accounts }: { accounts: any[] }) => {
  const typeData = accounts.reduce((acc: any[], curr: any) => {
    const existing = acc.find(item => item.name === curr.type);
    const balance = Math.abs(curr.balance || 0);
    if (existing) {
      existing.value += balance;
    } else {
      acc.push({ name: curr.type, value: balance });
    }
    return acc;
  }, []);

  const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="border-b border-slate-50 pb-4">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Wealth Distribution by Account Type (Abs SAR)</CardTitle>
          </CardHeader>
          <CardContent className="h-72 pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '12px' }}
                  formatter={(value: number) => `SAR ${value.toLocaleString()}`} 
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}/>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="border-b border-slate-50 pb-4">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-blue-900/60">Portfolio Focus: Highest Exposure Accounts</CardTitle>
          </CardHeader>
          <CardContent className="h-72 pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={accounts.sort((a,b) => Math.abs(b.balance||0) - Math.abs(a.balance||0)).slice(0, 6)}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#dbeafe" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} mirror={false} fontSize={10} tick={{ fontSize: 9, fontWeight: 700, fill: '#1e3a8a' }} />
                <Tooltip 
                  cursor={{ fill: '#eff6ff' }}
                  contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '12px' }}
                  formatter={(value: number) => `SAR ${value.toLocaleString()}`} 
                />
                <Bar dataKey="balance" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {accounts.map(acc => (
           <Card key={acc.code} className="border-none bg-white shadow-sm flex flex-col items-center justify-center p-6 space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{acc.name}</span>
              <span className="text-xl font-black text-slate-800 tabular-nums">{(acc.balance || 0).toLocaleString()}</span>
              <Badge variant="outline" className="text-[8px] border-slate-100 uppercase tracking-tighter text-slate-400">{acc.type}</Badge>
           </Card>
         ))}
      </div>
    </div>
  );
};

function AccountAnalytics({ accounts }: { accounts: any[] }) {
  const COLORS = ['#2563eb', '#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#10b981'];
  
  const typeData = accounts.reduce((acc: any[], curr) => {
    const existing = acc.find(i => i.name === curr.type);
    if (existing) {
      existing.value += Math.abs(curr.balance || 0);
    } else {
      acc.push({ name: curr.type, value: Math.abs(curr.balance || 0) });
    }
    return acc;
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="border-b border-slate-50 py-4">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Balance Distribution by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-80 pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {typeData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '10px' }}
                  formatter={(value: number) => `SAR ${value.toLocaleString()}`}
                />
                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="border-b border-slate-50 py-4">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Asset Liquidity Matrix</CardTitle>
          </CardHeader>
          <CardContent className="h-80 pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={accounts.filter(a => a.type === 'Asset').sort((a,b) => (b.balance||0) - (a.balance||0)).slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={9} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis fontSize={9} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v/1000}k`} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '10px' }}
                />
                <Bar dataKey="balance" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// --- PAYABLES ---
const PayablesView = () => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      {view === 'list' ? (
        <PayablesList 
          onCreate={() => { setSelectedId(null); setView('form'); }} 
          onEdit={(id) => { setSelectedId(id); setView('form'); }} 
        />
      ) : (
        <PayableForm id={selectedId} onBack={() => setView('list')} />
      )}
    </div>
  );
};

const PayablesList = ({ onCreate, onEdit }: { onCreate: () => void, onEdit: (id: number) => void }) => {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBills = async () => {
    try {
      const res = await fetch('/api/bills');
      const data = await res.json();
      setBills(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to load payables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBills(); }, []);

  const deleteBill = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payable?')) return;
    try {
      const res = await fetch(`/api/bills/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Payable record deleted');
        fetchBills();
      }
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  if (loading) return <div className="p-12 text-center animate-pulse text-blue-400 font-mono text-xs uppercase tracking-widest">Syncing Payables Ledger...</div>;

  return (
    <Card className="border-none shadow-sm bg-white overflow-hidden elegant-card">
      <CardHeader className="border-b border-blue-50 px-6 py-4 flex flex-row items-center justify-between bg-blue-50/30">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-blue-900">AP Registry</h2>
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-0.5">Manage vendor payables and accruals</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-400" />
            <Input placeholder="Search payables..." className="pl-9 h-10 text-xs border-blue-100 bg-white rounded-xl" />
          </div>
          <Button onClick={onCreate} className="h-10 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest gap-2 rounded-xl shadow-lg shadow-blue-500/20">
            <Plus className="h-4 w-4" /> Book New Payable
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-blue-50/20">
            <TableRow className="h-12">
              <TableHead className="px-8 text-[10px] font-black uppercase tracking-widest text-blue-400">Doc #</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-blue-400">Vendor / Supplier</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-blue-400">Project Link</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-blue-400 text-center">Date</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-blue-400 text-right">Amount (SAR)</TableHead>
              <TableHead className="text-center text-[10px] font-black uppercase tracking-widest text-blue-400">Status</TableHead>
              <TableHead className="px-8 text-right text-[10px] font-black uppercase tracking-widest text-blue-400">Operations</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-48 text-center text-slate-300 font-mono text-[10px] uppercase tracking-widest">No Active Payables found in current cycle</TableCell></TableRow>
            ) : bills.map((bill) => (
              <TableRow key={bill.id} className="hover:bg-blue-50/30 border-b border-blue-50/50 transition-colors">
                <TableCell className="px-8 py-5 font-black text-xs text-blue-600">#{bill.bill_number}</TableCell>
                <TableCell className="text-xs font-black text-blue-950 uppercase tracking-tight">{bill.vendor_name}</TableCell>
                <TableCell className="text-[10px] font-black text-emerald-600 uppercase tracking-tight">{bill.project_name || '-'}</TableCell>
                <TableCell className="text-center text-xs font-bold text-slate-500 font-mono">{bill.date}</TableCell>
                <TableCell className="text-right font-black text-sm text-blue-950 px-8">SAR {bill.total_amount.toLocaleString()}.00</TableCell>
                <TableCell className="text-center">
                  <Badge className={`text-[8px] font-black px-3 py-1 rounded-lg ${bill.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-primary/10 text-primary'}`}>
                    {bill.status.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="px-8 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(bill.id)} className="h-9 w-9 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-full">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteBill(bill.id)} className="h-9 w-9 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

const PayableForm = ({ id, onBack }: { id: number | null, onBack: () => void }) => {
  const [loading, setLoading] = useState(id ? true : false);
  const [vendors, setVendors] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({
    bill_number: `AP-${Date.now().toString().slice(-6)}`,
    supplier_id: '',
    project_id: '',
    date: new Date().toISOString().split('T')[0],
    due_date: '',
    total_amount: '',
    tax_amount: '',
    status: 'draft',
    payment_mode: 'Cash',
    payment_reference: '',
    notes: '',
    items: [{ description: '', account_id: '', amount: '', tax_amount: '' }]
  });

  useEffect(() => {
    const fetchMeta = async () => {
      const [vRes, aRes, pRes] = await Promise.all([
        fetch('/api/suppliers'), 
        fetch('/api/coa'),
        fetch('/api/projects')
      ]);
      setVendors(await vRes.json());
      const accData = await aRes.json();
      setAccounts(Array.isArray(accData) ? accData : []);
      const projData = await pRes.json();
      setProjects(Array.isArray(projData) ? projData : []);

      if (id) {
        const bRes = await fetch(`/api/bills/${id}`);
        const bData = await bRes.json();
        setFormData(bData);
        setLoading(false);
      }
    };
    fetchMeta();
  }, [id]);

  const addItem = () => setFormData({ ...formData, items: [...formData.items, { description: '', account_id: '', amount: '', tax_amount: '' }] });
  const removeItem = (idx: number) => setFormData({ ...formData, items: formData.items.filter((_: any, i: number) => i !== idx) });
  const updateItem = (idx: number, key: string, val: any) => {
    const newItems = [...formData.items];
    newItems[idx] = { ...newItems[idx], [key]: val };
    const total = newItems.reduce((acc, curr) => acc + Number(curr.amount), 0);
    const tax = newItems.reduce((acc, curr) => acc + Number(curr.tax_amount), 0);
    setFormData({ ...formData, items: newItems, total_amount: total + tax, tax_amount: tax });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/bills/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, id })
      });
      if (res.ok) {
        toast.success('Payable synchronized');
        onBack();
      }
    } catch (err) {
      toast.error('Financial sync failed');
    }
  };

  if (loading) return <div className="p-12 text-center animate-pulse text-blue-400 font-mono text-xs uppercase tracking-widest">Retrieving Document Schema...</div>;

  return (
    <form onSubmit={handleSubmit} className="max-w-[1030px] mx-auto space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" onClick={onBack} size="icon" className="h-10 w-10 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-full">
            <ArrowRightLeft className="h-5 w-5 rotate-180" />
          </Button>
          <h2 className="text-lg font-black uppercase tracking-tight text-blue-950">{id ? 'Editing Payable Record' : 'Post New Payable Entry'}</h2>
        </div>
        <div className="flex gap-4">
          <Button type="button" variant="ghost" onClick={onBack} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 px-6 h-11 rounded-xl">Discard</Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest px-8 h-11 rounded-xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all">Commit to GL</Button>
        </div>
      </div>

      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden p-8 min-h-[350px] elegant-card rounded-2xl">
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest px-1">Payable Ref #</Label>
              <Input value={formData.bill_number} onChange={e => setFormData({ ...formData, bill_number: e.target.value })} className="h-10 font-black text-xs border-blue-100 uppercase rounded-xl" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest px-1">Supplier / Vendor</Label>
              <Combobox
                options={vendors.map(v => ({ label: v.name, value: v.id.toString() }))}
                value={(formData.supplier_id || "").toString()}
                onValueChange={v => setFormData({ ...formData, supplier_id: Number(v) })}
                placeholder="Select Vendor"
                className="h-10 border-blue-100 bg-blue-50/30 font-black text-xs uppercase rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest px-1">Project Link</Label>
              <Combobox
                options={[
                  { label: 'No Project (Global)', value: 'none' },
                  ...projects.map(p => ({ label: p.name, value: p.id.toString() }))
                ]}
                value={(formData.project_id || "none").toString()}
                onValueChange={v => setFormData({ ...formData, project_id: v === 'none' ? null : Number(v) })}
                placeholder="Direct Expense"
                className="h-10 border-blue-100 bg-emerald-50/10 font-bold text-xs uppercase rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest px-1">Date</Label>
              <Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="h-10 font-bold text-[10px] border-blue-100 rounded-xl" required />
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-50">
            <div className="flex items-center justify-between mb-2">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-400">Transaction Breakdown</h3>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-4 px-2">
                 <div className="col-span-6 text-[8px] font-black text-slate-400 uppercase tracking-widest">Description of Expense</div>
                 <div className="col-span-4 text-[8px] font-black text-slate-400 uppercase tracking-widest">GL Account</div>
                 <div className="col-span-2 text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">Amount (SAR)</div>
              </div>
              {formData.items.map((item: any, idx: number) => (
                <div key={idx} className="grid grid-cols-12 gap-4 items-center group animate-in fade-in slide-in-from-left-2 transition-all">
                  <div className="col-span-6">
                    <Input 
                      size="sm"
                      value={item.description} 
                      onChange={(e) => updateItem(idx, 'description', e.target.value)} 
                      placeholder="Line item detail..." 
                      className="h-10 font-bold text-xs" 
                    />
                  </div>
                  <div className="col-span-4">
                    <Combobox
                      options={accounts.map(acc => ({ label: `${acc.code} - ${acc.name}`, value: acc.id.toString() }))}
                      value={(item.account_id || "").toString()}
                      onValueChange={v => updateItem(idx, 'account_id', v)}
                      placeholder="Select Account"
                      className="h-10 border-slate-200 text-[10px] font-black uppercase rounded-xl bg-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" size="sm" value={item.amount} onChange={e => updateItem(idx, 'amount', e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value)))} className="h-10 text-right font-black font-mono text-xs" min="0" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-end pt-6 border-t border-slate-50">
            <div className="space-y-4 max-w-sm">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest px-1">Payment Mode</Label>
                        <Combobox
                          options={[
                            { label: 'Cash', value: 'Cash' },
                            { label: 'Bank Transfer', value: 'Bank Transfer' },
                            { label: 'Cheque', value: 'Cheque' }
                          ]}
                          value={formData.payment_mode || "Cash"}
                          onValueChange={v => setFormData({ ...formData, payment_mode: v })}
                          placeholder="Mode"
                          className="h-10 border-blue-100 font-bold text-xs rounded-xl"
                        />
                    </div>
                    {['Bank Transfer', 'Cheque'].includes(formData.payment_mode) && (
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest px-1">Ref #</Label>
                            <Input 
                                value={formData.payment_reference || ''} 
                                onChange={e => setFormData({ ...formData, payment_reference: e.target.value })} 
                                className="h-10 font-bold text-xs border-blue-100 rounded-xl" 
                                placeholder="Ref..."
                            />
                        </div>
                    )}
                </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase text-blue-600/40 tracking-[0.2em] mb-1">Total Liability</p>
              <p className="text-4xl font-black text-blue-950 tracking-tighter">SAR {formData.total_amount.toLocaleString()}.00</p>
            </div>
          </div>
        </div>
      </Card>
    </form>

  );
};

// --- RECEIVABLES ---
const ReceivablesView = () => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      {view === 'list' ? (
        <ReceivablesList 
          onCreate={() => { setSelectedId(null); setView('form'); }} 
          onEdit={(id) => { setSelectedId(id); setView('form'); }} 
        />
      ) : (
        <ReceivablesForm id={selectedId} onBack={() => setView('list')} />
      )}
    </div>
  );
};

const ReceivablesList = ({ onCreate, onEdit }: { onCreate: () => void, onEdit: (id: number) => void }) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/invoices');
      const data = await res.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to load receivables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, []);

  const deleteInvoice = async (id: number) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Receivable invoice record deleted');
        fetchInvoices();
      }
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  if (loading) return <div className="p-12 text-center animate-pulse text-blue-400 font-mono text-xs uppercase tracking-widest">Compiling Receivables Matrix...</div>;

  return (
    <Card className="border-none shadow-sm bg-white overflow-hidden elegant-card">
      <CardHeader className="border-b border-blue-50 px-6 py-4 flex flex-row items-center justify-between bg-blue-50/30">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-blue-900">AR Registry</h2>
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-0.5">Track customer billings and collections</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-400" />
            <Input placeholder="Search invoices..." className="pl-9 h-10 text-xs border-blue-100 bg-white rounded-xl" />
          </div>
          <Button onClick={onCreate} className="h-10 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest gap-2 rounded-xl shadow-lg shadow-blue-500/20">
            <Plus className="h-4 w-4" /> Issue New Invoice
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-blue-50/20">
            <TableRow className="h-12">
              <TableHead className="px-8 text-[10px] font-black uppercase tracking-widest text-blue-400">Inv #</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-blue-400">Customer</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-blue-400">Project Link</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-blue-400 text-center">Date</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-blue-400 text-right">Amount (SAR)</TableHead>
              <TableHead className="text-center text-[10px] font-black uppercase tracking-widest text-blue-400">Status</TableHead>
              <TableHead className="px-8 text-right text-[10px] font-black uppercase tracking-widest text-blue-400">Operations</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-48 text-center text-slate-300 font-mono text-[10px] uppercase tracking-widest">No Active Receivables found in current ledger</TableCell></TableRow>
            ) : invoices.map((inv) => (
              <TableRow key={inv.id} className="hover:bg-blue-50/30 border-b border-blue-50/50 transition-colors">
                <TableCell className="px-8 py-5 font-black text-xs text-blue-700">{inv.invoice_number}</TableCell>
                <TableCell className="text-xs font-black text-blue-950 uppercase tracking-tight">{inv.customer_name}</TableCell>
                <TableCell className="text-[10px] font-black text-emerald-600 uppercase tracking-tight">{inv.project_name || '-'}</TableCell>
                <TableCell className="text-center text-xs font-bold text-slate-500 font-mono">{inv.date}</TableCell>
                <TableCell className="text-right font-black text-sm text-blue-950 px-8">SAR {inv.total_amount.toLocaleString()}.00</TableCell>
                <TableCell className="text-center">
                  <Badge className={`text-[8px] font-black px-3 py-1 rounded-lg ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                    {inv.status.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="px-8 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(inv.id)} className="h-9 w-9 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-full">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteInvoice(inv.id)} className="h-9 w-9 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

const ReceivablesForm = ({ id, onBack }: { id: number | null, onBack: () => void }) => {
  const [loading, setLoading] = useState(id ? true : false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({
    invoice_number: `INV-${Date.now().toString().slice(-6)}`,
    customer_id: '',
    project_id: '',
    date: new Date().toISOString().split('T')[0],
    due_date: '',
    total_amount: '',
    tax_amount: '',
    status: 'draft',
    payment_mode: 'Cash',
    payment_reference: '',
    notes: '',
    items: [{ description: '', account_id: '', amount: '', tax_amount: '' }]
  });

  useEffect(() => {
    const fetchMeta = async () => {
      const [cRes, aRes, pRes] = await Promise.all([
        fetch('/api/customers'), 
        fetch('/api/coa'),
        fetch('/api/projects')
      ]);
      setCustomers(await cRes.json());
      const accData = await aRes.json();
      setAccounts(Array.isArray(accData) ? accData : []);
      const projData = await pRes.json();
      setProjects(Array.isArray(projData) ? projData : []);

      if (id) {
        const iRes = await fetch(`/api/invoices/${id}`);
        const iData = await iRes.json();
        setFormData(iData);
        setLoading(false);
      }
    };
    fetchMeta();
  }, [id]);

  const addItem = () => setFormData({ ...formData, items: [...formData.items, { description: '', account_id: '', amount: '', tax_amount: '' }] });
  const removeItem = (idx: number) => setFormData({ ...formData, items: formData.items.filter((_: any, i: number) => i !== idx) });
  const updateItem = (idx: number, key: string, val: any) => {
    const newItems = [...formData.items];
    newItems[idx] = { ...newItems[idx], [key]: val };
    const total = newItems.reduce((acc, curr) => acc + Number(curr.amount), 0);
    const tax = newItems.reduce((acc, curr) => acc + Number(curr.tax_amount), 0);
    setFormData({ ...formData, items: newItems, total_amount: total + tax, tax_amount: tax });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/invoices/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, id })
      });
      if (res.ok) {
        toast.success('Receivable invoice synchronized');
        onBack();
      }
    } catch (err) {
      toast.error('Financial sync failed');
    }
  };

  if (loading) return <div className="p-12 text-center animate-pulse text-blue-400 font-mono text-xs uppercase tracking-widest">Hydrating Financial Record...</div>;

  return (
    <form onSubmit={handleSubmit} className="max-w-[1030px] mx-auto space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" onClick={onBack} size="icon" className="h-10 w-10 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-full">
            <ArrowRightLeft className="h-5 w-5 rotate-180" />
          </Button>
          <h2 className="text-lg font-black uppercase tracking-tight text-blue-950">{id ? 'Editing Professional Invoice' : 'Issue Professional Invoice'}</h2>
        </div>
        <div className="flex gap-4">
          <Button type="button" variant="ghost" onClick={onBack} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 px-6 h-11 rounded-xl">Discard</Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest px-8 h-11 rounded-xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all">Finalize & Issue</Button>
        </div>
      </div>

      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden p-8 min-h-[350px] elegant-card rounded-2xl">
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest px-1">Invoice Ref #</Label>
              <Input value={formData.invoice_number} onChange={e => setFormData({ ...formData, invoice_number: e.target.value })} className="h-10 font-black text-xs border-blue-100 uppercase rounded-xl" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest px-1">Purchasing Customer</Label>
              <Combobox
                options={customers.map(c => ({ label: c.name, value: c.id.toString() }))}
                value={(formData.customer_id || "").toString()}
                onValueChange={v => setFormData({ ...formData, customer_id: Number(v) })}
                placeholder="Select Customer"
                className="h-10 border-blue-100 bg-blue-50/30 font-black text-xs uppercase rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest px-1">Associated Project</Label>
              <Combobox
                options={[
                  { label: 'General Trading / Services', value: 'none' },
                  ...projects.map(p => ({ label: p.name, value: p.id.toString() }))
                ]}
                value={(formData.project_id || "none").toString()}
                onValueChange={v => setFormData({ ...formData, project_id: v === 'none' ? null : Number(v) })}
                placeholder="Non-Project Revenue"
                className="h-10 border-blue-100 bg-emerald-50/10 font-bold text-xs uppercase rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest px-1">Issue Date</Label>
              <Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="h-10 font-bold text-[10px] border-blue-100 rounded-xl" required />
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-50">
            <div className="flex items-center justify-between mb-2">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-400">Billable Services / Revenue Entry</h3>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-4 px-2">
                 <div className="col-span-6 text-[8px] font-black text-slate-400 uppercase tracking-widest">Service Description</div>
                 <div className="col-span-4 text-[8px] font-black text-slate-400 uppercase tracking-widest">Revenue Account</div>
                 <div className="col-span-2 text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">Amount (SAR)</div>
              </div>
              {formData.items.map((item: any, idx: number) => (
                <div key={idx} className="grid grid-cols-12 gap-4 items-center group animate-in fade-in slide-in-from-left-2 transition-all">
                  <div className="col-span-6">
                    <Input 
                      size="sm"
                      value={item.description} 
                      onChange={(e) => updateItem(idx, 'description', e.target.value)} 
                      placeholder="Billed item detail..." 
                      className="h-10 font-bold text-xs" 
                    />
                  </div>
                  <div className="col-span-4">
                    <Combobox
                      options={accounts.map(acc => ({ label: `${acc.code} - ${acc.name}`, value: acc.id.toString() }))}
                      value={(item.account_id || "").toString()}
                      onValueChange={v => updateItem(idx, 'account_id', v)}
                      placeholder="Select Account"
                      className="h-10 border-slate-200 text-[10px] font-black uppercase rounded-xl bg-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" size="sm" value={item.amount} onChange={e => updateItem(idx, 'amount', e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value)))} className="h-10 text-right font-black font-mono text-xs" min="0" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-end pt-6 border-t border-slate-50">
            <div className="space-y-4 max-w-sm">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest px-1">Payment Method</Label>
                        <Combobox
                          options={[
                            { label: 'Cash', value: 'Cash' },
                            { label: 'Bank Transfer', value: 'Bank Transfer' },
                            { label: 'Cheque', value: 'Cheque' }
                          ]}
                          value={formData.payment_mode || "Cash"}
                          onValueChange={v => setFormData({ ...formData, payment_mode: v })}
                          placeholder="Mode"
                          className="h-10 border-blue-100 font-bold text-xs rounded-xl"
                        />
                    </div>
                    {['Bank Transfer', 'Cheque'].includes(formData.payment_mode) && (
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest px-1">Auth Ref #</Label>
                            <Input 
                                value={formData.payment_reference || ''} 
                                onChange={e => setFormData({ ...formData, payment_reference: e.target.value })} 
                                className="h-10 font-bold text-xs border-blue-100 rounded-xl" 
                                placeholder="Ref..."
                            />
                        </div>
                    )}
                </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase text-blue-600/40 tracking-[0.2em] mb-1">Incoming Revenue</p>
              <p className="text-4xl font-black text-blue-950 tracking-tighter">SAR {formData.total_amount.toLocaleString()}.00</p>
            </div>
          </div>
        </div>
      </Card>
    </form>

  );
};

const SUB_MODULE_MAPPING: Record<string, string> = {
  'Invoices': 'invoices',
  'Chart of Accounts': 'coa',
  'Ledger': 'ledger',
  'Journal Entries': 'journals',
  'Payables': 'payables',
  'Receivables': 'receivables',
  'Bank Reconciliation': 'reconciliation',
  'Account Analytics': 'analytics',
  'Financial Tracking': 'financial-tracking'
};

export default function AccountingModule({ subModule, initialParams }: { subModule?: string, initialParams?: any }) {
  const [activeTab, setActiveTab] = useState(() => {
    if (subModule && SUB_MODULE_MAPPING[subModule]) return SUB_MODULE_MAPPING[subModule];
    return 'dashboard';
  });
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/coa');
      if (!res.ok) throw new Error('COA fetch failed');
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        setAccounts(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Invalid JSON from /api/coa:', text.slice(0, 50));
        setAccounts([]);
      }
    } catch (err) {
      console.error('Failed to load accounts for dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (!subModule) {
      setActiveTab('dashboard');
      return;
    }

    if (SUB_MODULE_MAPPING[subModule]) {
      setActiveTab(SUB_MODULE_MAPPING[subModule]);
    }
  }, [subModule]);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-blue-50 p-1.5 rounded-xl gap-1.5 border border-blue-100 shadow-sm flex h-12 w-fit overflow-x-auto scrollbar-hide">
          <TabsTrigger value="dashboard" className="text-[10px] font-black uppercase tracking-widest px-6 h-9 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all gap-2">
            <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="coa" className="text-[10px] font-black uppercase tracking-widest px-6 h-9 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">List</TabsTrigger>
          <TabsTrigger value="ledger" className="text-[10px] font-black uppercase tracking-widest px-6 h-9 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">Ledger</TabsTrigger>
          <TabsTrigger value="analytics" className="text-[10px] font-black uppercase tracking-widest px-6 h-9 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">Analytics</TabsTrigger>
          <TabsTrigger value="invoices" className="text-[10px] font-black uppercase tracking-widest px-6 h-9 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">Old Invoices</TabsTrigger>
          <TabsTrigger value="payables" className="text-[10px] font-black uppercase tracking-widest px-6 h-9 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-nowrap">Payables</TabsTrigger>
          <TabsTrigger value="receivables" className="text-[10px] font-black uppercase tracking-widest px-6 h-9 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-nowrap">Receivables</TabsTrigger>
          <TabsTrigger value="financial-tracking" className="text-[10px] font-black uppercase tracking-widest px-6 h-9 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-nowrap gap-2">
            <Activity className="h-3.5 w-3.5" /> Financial Tracking
          </TabsTrigger>
          <TabsTrigger value="journals" className="text-[10px] font-black uppercase tracking-widest px-6 h-9 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-nowrap">Journal Entries</TabsTrigger>
          <TabsTrigger value="reconciliation" className="text-[10px] font-black uppercase tracking-widest px-6 h-9 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-nowrap">Bank Recon</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="mt-8 transition-all focus-visible:outline-none focus:outline-none">
          {loading ? (
             <div className="h-64 flex items-center justify-center text-[10px] font-black text-slate-300 uppercase animate-pulse">Analyzing Financial Exposure...</div>
          ) : (
            <AccountingOverview accounts={accounts} />
          )}
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-8 transition-all focus-visible:outline-none focus:outline-none">
          <AccountAnalytics accounts={accounts} />
        </TabsContent>

        <TabsContent value="coa" className="mt-8 transition-all focus-visible:outline-none focus:outline-none">
          <ChartOfAccounts />
        </TabsContent>
        <TabsContent value="ledger" className="mt-8 transition-all focus-visible:outline-none focus:outline-none">
          <LedgerManager accounts={accounts} />
        </TabsContent>
        <TabsContent value="invoices" className="mt-8 transition-all focus-visible:outline-none focus:outline-none">
          <InvoicesView />
        </TabsContent>
        <TabsContent value="payables" className="mt-8 transition-all focus-visible:outline-none focus:outline-none">
          <PayablesView />
        </TabsContent>
        <TabsContent value="receivables" className="mt-8 transition-all focus-visible:outline-none focus:outline-none">
          <ReceivablesView />
        </TabsContent>
        <TabsContent value="financial-tracking" className="mt-8 transition-all focus-visible:outline-none focus:outline-none">
          <FinancialTracking />
        </TabsContent>
        <TabsContent value="journals" className="mt-8 transition-all focus-visible:outline-none focus:outline-none">
          <JournalEntries />
        </TabsContent>
        <TabsContent value="reconciliation" className="mt-8 transition-all focus-visible:outline-none focus:outline-none">
          <BankReconciliation />
        </TabsContent>
      </Tabs>
    </div>
  );
}
