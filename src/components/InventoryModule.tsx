import * as React from 'react';
import { useState } from 'react';
import { 
  Package, 
  ArrowLeftRight, 
  Plus, 
  Search, 
  AlertTriangle,
  History,
  Archive,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  ArrowLeft,
  Building2,
  CalendarDays,
  MoreHorizontal,
  FileText,
  Trash2,
  Settings2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { useEffect } from 'react';

// --- INVENTORY ITEM DETAILS ---
const InventoryItemDetails = ({ id, onBack, onEdit }: { id: number, onBack: () => void, onEdit: () => void }) => {
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/inventory-items/${id}`)
      .then(res => res.json())
      .then(data => {
        setItem(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="h-64 flex items-center justify-center text-slate-400 font-mono text-xs uppercase tracking-widest animate-pulse">Scanning Warehouse Bin...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50">
          ← Back to Warehouse
        </Button>
        <div className="flex gap-2">
          <Button onClick={onEdit} className="h-9 text-[10px] font-black uppercase tracking-widest bg-amber-500 hover:bg-amber-600">Edit Specs</Button>
        </div>
      </div>

      <Card className="border border-slate-200 shadow-xl bg-white overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 p-10">
          <div className="flex items-start justify-between">
            <div className="flex gap-6">
              <div className="w-20 h-20 bg-white border border-slate-200 rounded-3xl flex items-center justify-center text-slate-400 shadow-sm">
                <Package className="h-10 w-10" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{item.name}</h2>
                <div className="flex gap-4 mt-2">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <Archive className="h-3.5 w-3.5 text-slate-300" /> {item.category}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    <Layers className="h-3.5 w-3.5 text-slate-300" /> SKU: {item.sku}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              {item.qty_on_hand <= item.min_qty ? (
                <Badge className="bg-red-50 text-red-600 border-red-100 font-black text-[10px] uppercase tracking-[0.2em] px-3 py-1">CRITICAL STOCK</Badge>
              ) : (
                <Badge className="bg-blue-100 text-blue-700 border-none font-black text-[10px] uppercase tracking-[0.2em] px-3 py-1">OPTIMAL LEVEL</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-10">
           <div className="grid grid-cols-3 gap-10">
              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 text-center">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Available Qty</label>
                 <p className="text-4xl font-black text-slate-900 tracking-tighter font-mono">{item.qty_on_hand}</p>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.unit}</span>
                 <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between px-4">
                    <span className="text-[8px] font-black text-slate-400 uppercase">Buffer:</span>
                    <span className="text-[8px] font-black text-slate-900 uppercase">{item.min_qty} {item.unit}</span>
                 </div>
              </div>
              <div className="space-y-6 flex flex-col justify-center">
                <div>
                   <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1 block">Unit Acq. Price</label>
                   <p className="text-xl font-black text-slate-900 font-mono tracking-tight">SAR {item.cost_price?.toLocaleString()}.00</p>
                </div>
                <div>
                   <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1 block">Standard Sale Rate</label>
                   <p className="text-xl font-black text-blue-600 font-mono tracking-tight">SAR {item.sale_price?.toLocaleString()}.00</p>
                </div>
              </div>
              <div className="space-y-6 flex flex-col justify-center border-l border-slate-100 pl-10">
                <div>
                   <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1 block italic underline">Inventory Valuation</label>
                   <p className="text-2xl font-black text-slate-900 font-mono tracking-tighter">SAR {(item.qty_on_hand * item.cost_price).toLocaleString()}.00</p>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Net Asset Worth in Bin</p>
                </div>
              </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
};

// --- PRODUCT FORM (Registration & Update) ---
const ProductForm = ({ id, onCancel, onSuccess }: { id?: number, onCancel: () => void, onSuccess: () => void }) => {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: '',
    unit: '',
    qty_on_hand: 0,
    min_qty: 0,
    cost_price: 0,
    sale_price: 0
  });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetch(`/api/inventory-items/${id}`)
        .then(res => res.json())
        .then(data => {
          setFormData({
            sku: data.sku || '',
            name: data.name || '',
            category: data.category || '',
            unit: data.unit || '',
            qty_on_hand: data.qty_on_hand || 0,
            min_qty: data.min_qty || 0,
            cost_price: data.cost_price || 0,
            sale_price: data.sale_price || 0
          });
          setLoading(false);
        })
        .catch(() => {
          toast.error('Failed to load item specs');
          setLoading(false);
        });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = id ? `/api/inventory-items/${id}` : '/api/inventory';
      const method = id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Provisioning failed');
      toast.success(id ? 'Product specifications updated' : 'Product successfully provisioned');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="h-64 flex items-center justify-center text-slate-400 font-mono text-xs uppercase tracking-widest animate-pulse">Initializing Specialized Editor...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-800 uppercase">{id ? 'Update Specifications' : 'Provision Product'}</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Master Asset Data Registry</p>
        </div>
        <Button variant="ghost" onClick={onCancel} className="text-[10px] font-black uppercase tracking-widest text-blue-600">← Discard Changes</Button>
      </div>

      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden p-10">
        <form onSubmit={handleSubmit} className="space-y-8">
           <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Internal Reference (SKU)</Label>
                <Input required value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="h-11 border-slate-200 focus:ring-1 focus:ring-blue-600 font-bold font-mono" placeholder="WHS-PRD-001" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Classification Category</Label>
                <Input required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="h-11 border-slate-200 focus:ring-1 focus:ring-blue-600 font-bold" placeholder="Fit-out / Civil / General" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Technical Name / Description</Label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-11 border-slate-200 focus:ring-1 focus:ring-blue-600 font-black uppercase" placeholder="ACRYLIC SHEET - OPAL 3MM" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Unit of Measurement</Label>
                <Input required value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="h-11 border-slate-200 focus:ring-1 focus:ring-blue-600 font-bold" placeholder="Kg / Sqm / Unit" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">On-Hand Qty</Label>
                    <Input type="number" required value={formData.qty_on_hand} onChange={e => setFormData({...formData, qty_on_hand: Number(e.target.value)})} className="h-11 border-slate-200 font-black text-center" />
                 </div>
                 <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Alert Floor</Label>
                    <Input type="number" required value={formData.min_qty} onChange={e => setFormData({...formData, min_qty: Number(e.target.value)})} className="h-11 border-slate-200 font-bold text-center text-red-500" />
                 </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Acquisition Cost (SAR)</Label>
                <Input type="number" step="0.01" required value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: Number(e.target.value)})} className="h-11 border-slate-200 font-black font-mono text-blue-600" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Sale Valuation (SAR)</Label>
                <Input type="number" step="0.01" required value={formData.sale_price} onChange={e => setFormData({...formData, sale_price: Number(e.target.value)})} className="h-11 border-slate-200 font-black font-mono text-blue-600" />
              </div>
           </div>
           <div className="pt-8 flex justify-end gap-3 border-t border-slate-100">
              <Button type="submit" disabled={submitting} className="h-12 px-12 text-[11px] font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20">
                {submitting ? 'Processing Registry...' : 'Commit Specifications'}
              </Button>
           </div>
        </form>
      </Card>
    </div>
  );
};

// --- STOCK LIST SUB-MODULE ---
const StockListView = () => {
  const [view, setView] = useState<'list' | 'create' | 'edit' | 'details'>('list');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [stock, setStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [adjustment, setAdjustment] = useState({
    qty_on_hand: 0,
    reason: 'Stock Take'
  });

  const [searchQuery, setSearchQuery] = useState('');

  const filteredStock = stock.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const stockRes = await fetch('/api/inventory');
      if (stockRes.status === 401) { window.location.reload(); return; }
      const stockData = await stockRes.json();
      setStock(Array.isArray(stockData) ? stockData : []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: number) => {
    if (!confirm('This will purge the product from the core registry. Continue?')) return;
    try {
      const res = await fetch(`/api/inventory-items/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Purge failed');
      toast.success('Asset record purged');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      const res = await fetch(`/api/inventory/${selectedItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qty_on_hand: adjustment.qty_on_hand })
      });
      if (!res.ok) throw new Error('Failed to update stock');
      toast.success(`Stock level for ${selectedItem.name} updated`);
      setIsAdjustOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (view === 'create') {
    return <ProductForm onCancel={() => setView('list')} onSuccess={() => { setView('list'); fetchData(); }} />;
  }

  if (view === 'edit' && selectedId) {
    return <ProductForm id={selectedId} onCancel={() => setView('list')} onSuccess={() => { setView('list'); fetchData(); }} />;
  }

  if (view === 'details' && selectedId) {
    return <InventoryItemDetails id={selectedId} onBack={() => setView('list')} onEdit={() => setView('edit')} />;
  }

  if (loading) return <div className="h-64 flex items-center justify-center text-slate-400 font-mono text-xs uppercase tracking-widest animate-pulse">Initialising Inventory Core...</div>;

  const getStatusBadge = (qty: number, min: number) => {
    if (qty <= 0) return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none font-bold text-[10px]">OUT OF STOCK</Badge>;
    if (qty < min) return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-bold text-[10px]">LOW STOCK</Badge>;
    return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-bold text-[10px]">IN STOCK</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-slate-800 uppercase px-1">Inventory Dashboard</h2>
        <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="h-9 text-[11px] font-bold uppercase tracking-wider border-slate-200"
              onClick={() => {
                toast.info("Stock Take mode enabled. Use 'Adjust' on specific items.");
              }}
            >
              <Layers className="mr-2 h-4 w-4" /> Stock Take
            </Button>
            
            <Button 
              onClick={() => setView('create')}
              className="bg-blue-600 h-9 text-[11px] font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="mr-2 h-4 w-4" /> Register New Product
            </Button>
        </div>
      </div>

      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase tracking-widest">Stock Verification</DialogTitle>
          </DialogHeader>
          <div className="py-4">
             <p className="text-xs font-bold text-slate-700 mb-1">{selectedItem?.name}</p>
             <p className="text-[10px] text-slate-400 font-mono mb-4">Current System Value: {selectedItem?.qty_on_hand} {selectedItem?.unit}</p>
             
             <form onSubmit={handleAdjustStock} className="space-y-4">
               <div className="space-y-1.5">
                 <Label className="text-[10px] font-black uppercase text-slate-400">Counted Quantity</Label>
                 <Input 
                   type="number" 
                   required 
                   value={adjustment.qty_on_hand} 
                   onChange={e => setAdjustment({...adjustment, qty_on_hand: Number(e.target.value)})} 
                   className="h-10 text-sm font-bold bg-slate-50"
                 />
               </div>
               <Button type="submit" className="w-full bg-slate-900 h-10 text-[10px] font-black uppercase tracking-widest">Update Level</Button>
             </form>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total SKUs', value: stock.length.toString(), icon: Archive, color: 'blue' },
          { label: 'Low Stock Items', value: stock.filter(i => i.qty_on_hand < i.min_qty).length.toString(), icon: AlertTriangle, color: 'amber' },
          { label: 'Total Valuation', value: `SAR ${(stock.reduce((acc, i) => acc + (i.qty_on_hand * i.cost_price), 0) / 1000).toFixed(1)}k`, icon: Layers, color: 'blue' },
        ].map(stat => (
          <Card key={stat.label} className="border-none shadow-sm bg-white">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${stat.color}-50 text-${stat.color}-600`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                <p className="text-xl font-bold text-slate-800">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input 
                placeholder="Search products..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs bg-slate-50 border-slate-200" 
              />
            </div>
            <div className="flex gap-2">
              <span className="text-[10px] px-2 py-1 bg-slate-50 rounded border border-slate-200 font-bold text-slate-500">Global Warehouse Control</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-slate-500 text-[11px] h-10 px-6 uppercase tracking-wider">SKU / Item</TableHead>
                <TableHead className="font-bold text-slate-500 text-[11px] h-10 px-6 uppercase tracking-wider">Category</TableHead>
                <TableHead className="font-bold text-slate-500 text-[11px] h-10 px-6 uppercase tracking-wider text-right">Qty On Hand</TableHead>
                <TableHead className="font-bold text-slate-500 text-[11px] h-10 px-6 uppercase tracking-wider text-center">Status</TableHead>
                <TableHead className="h-10 px-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStock.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50/80 border-b border-slate-50 transition-colors">
                  <TableCell className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 text-xs">{item.name}</span>
                      <span className="text-[10px] text-slate-400 font-bold">{item.sku}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold text-[9px] border-none">{item.category}</Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className={`font-bold text-xs ${item.qty_on_hand < item.min_qty ? 'text-red-600' : 'text-slate-800'}`}>
                        {item.qty_on_hand} {item.unit}
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium">Min: {item.min_qty}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center">{getStatusBadge(item.qty_on_hand, item.min_qty)}</TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-300 hover:text-slate-800 transition-colors"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      } />
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest text-slate-400">Asset Control</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => { setSelectedId(item.id); setView('details'); }} className="text-[10px] font-black py-2.5 uppercase tracking-wide text-slate-600">
                             <FileText className="mr-2 h-4 w-4 text-blue-600" /> View Specs
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedId(item.id); setView('edit'); }} className="text-[10px] font-black py-2.5 uppercase tracking-wide text-slate-600">
                             <Settings2 className="mr-2 h-4 w-4 text-amber-500" /> Edit Specs
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedItem(item);
                              setAdjustment({ qty_on_hand: item.qty_on_hand, reason: 'Stock Take' });
                              setIsAdjustOpen(true);
                            }}
                            className="text-[10px] font-black py-2.5 uppercase tracking-wide text-blue-600"
                          >
                             <ArrowLeftRight className="mr-2 h-4 w-4 text-blue-600" /> Adjust Qty
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => deleteItem(item.id)} className="text-[10px] font-black py-2.5 uppercase tracking-wide text-red-600">
                             <Trash2 className="mr-2 h-4 w-4" /> Purge Asset
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

export default function InventoryModule({ subModule, initialParams }: { subModule?: string, initialParams?: any }) {
  return (
    <div className="space-y-6">
      <StockListView />
    </div>
  );
}
