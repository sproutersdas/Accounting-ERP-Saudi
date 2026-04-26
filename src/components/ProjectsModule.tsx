import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Plus, 
  Trash2, 
  Calendar, 
  DollarSign, 
  Users, 
  Briefcase,
  PieChart,
  Activity,
  ArrowUpRight,
  ClipboardList,
  Edit3,
  Search,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Project {
  id: number;
  name: string;
  client_name: string;
  status: string;
  budget: number;
  start_date: string;
  end_date: string;
  description: string;
  actual_cost?: number; // Calculated field
}

const ProjectsList = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [newProject, setNewProject] = useState({
    name: '',
    client_name: '',
    budget: 0,
    start_date: '',
    end_date: '',
    description: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes] = await Promise.all([
        fetch('/api/projects')
      ]);
      
      if (projRes.status === 401) return window.location.reload();
      
      const [projData] = await Promise.all([
        projRes.json()
      ]);

      // Mocking actual cost for visual effect in MVP
      const augmentedProjects = (Array.isArray(projData) ? projData : []).map((p: any) => ({
        ...p,
        actual_cost: Math.floor(Math.random() * (p.budget || 50000) * 1.2)
      }));

      setProjects(augmentedProjects);
    } catch (err: any) {
      toast.error('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });
      if (!res.ok) throw new Error('Creation failed');
      toast.success('Project initiated successfully');
      setIsAddOpen(false);
      setNewProject({ name: '', client_name: '', budget: 0, start_date: '', end_date: '', description: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Decommission this project module and all associated ledgers?')) return;
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      toast.success('Project archived');
      fetchData();
    } catch (err) {
      toast.error('Deletion failed');
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-slate-400 font-mono text-xs uppercase tracking-widest">Constructing Project Nodes...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-800 uppercase">Project Portfolio</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Active monitoring and lifecycle management</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button className="bg-blue-600 hover:bg-blue-700 h-10 text-[11px] font-black uppercase tracking-widest gap-2"><Plus className="h-4 w-4" /> New Project</Button>} />
          <DialogContent className="sm:max-w-lg">
             <DialogHeader>
               <DialogTitle className="text-sm font-black uppercase tracking-widest">Initialise Project</DialogTitle>
             </DialogHeader>
             <form onSubmit={handleAddProject} className="space-y-4 py-4">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Project Title</Label>
                    <Input required value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Client / Principal</Label>
                    <Input required value={newProject.client_name} onChange={e => setNewProject({...newProject, client_name: e.target.value})} className="h-9 text-xs" />
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Initial Budget (SAR)</Label>
                    <Input type="number" required value={newProject.budget} onChange={e => setNewProject({...newProject, budget: Number(e.target.value)})} className="h-9 text-xs font-bold text-blue-600" />
                  </div>
                  <div className="space-y-1.5">
                     <Label className="text-[10px] font-black uppercase text-slate-400">Scope of Work / Description</Label>
                     <Input value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} className="h-9 text-xs" />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Kick-off Date</Label>
                    <Input type="date" required value={newProject.start_date} onChange={e => setNewProject({...newProject, start_date: e.target.value})} className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Estimated Delivery</Label>
                    <Input type="date" required value={newProject.end_date} onChange={e => setNewProject({...newProject, end_date: e.target.value})} className="h-9 text-xs" />
                  </div>
               </div>

               <DialogFooter>
                 <Button type="submit" className="w-full bg-blue-600 h-10 text-[11px] font-black uppercase tracking-widest">Register Project</Button>
               </DialogFooter>
             </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {projects.map(p => {
          const progress = Math.min(100, Math.floor(((p.actual_cost || 0) / (p.budget || 1)) * 100));
          const isOverBudget = progress > 100;

          return (
            <Card key={p.id} className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all duration-300">
               <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-5">
                  <div className="flex justify-between items-start">
                     <Badge className={`${p.status === 'active' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'} border-none font-black text-[8px] tracking-[0.1em] uppercase`}>{p.status}</Badge>
                     <Button variant="ghost" onClick={() => handleDelete(p.id)} className="h-6 w-6 p-0 text-slate-300 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                  <CardTitle className="text-base font-black text-slate-800 tracking-tight mt-3">{p.name}</CardTitle>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                    <Users className="h-3 w-3" /> {p.client_name}
                  </p>
               </CardHeader>
               <CardContent className="p-5 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Budget</p>
                        <p className="text-sm font-bold text-slate-800">SAR {p.budget.toLocaleString()}</p>
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Actual Cost</p>
                        <p className={`text-sm font-bold ${isOverBudget ? 'text-red-600' : 'text-blue-600'}`}>SAR {p.actual_cost?.toLocaleString()}</p>
                     </div>
                  </div>

                  <div className="space-y-2">
                     <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span className="text-slate-400">Budget Utilization</span>
                        <span className={isOverBudget ? 'text-red-600' : 'text-blue-600'}>{progress}%</span>
                     </div>
                     <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-red-500' : 'bg-blue-500'}`} 
                          style={{ width: `${Math.min(100, progress)}%` }} 
                        />
                     </div>
                  </div>

                  <div className="pt-4 border-t border-slate-50 flex justify-between items-end">
                     <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                           <Calendar className="h-3 w-3" /> {p.start_date}
                        </div>
                     </div>
                     <Button 
                        variant="ghost" 
                        className="h-8 px-4 text-[10px] font-black uppercase tracking-widest gap-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl shadow-sm"
                     >
                        Ledger <ArrowUpRight className="h-3 w-3" />
                     </Button>
                  </div>
               </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// --- PROJECT LEDGER VIEW ---
const ProjectLedger = () => {
    return (
        <div className="space-y-6">
            <Card className="border-none shadow-sm bg-white">
                <CardHeader className="p-8 border-b border-slate-50">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-1">Accounting Node</p>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Job Costing Ledger</h2>
                        </div>
                        <Button className="bg-blue-600 hover:bg-blue-700 h-10 text-[10px] font-black uppercase tracking-widest gap-2">
                           <ClipboardList className="h-4 w-4" /> Extract Project Report
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow className="h-12">
                                <TableHead className="px-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reference / Ref</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Project Domain</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</TableHead>
                                <TableHead className="text-right px-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Cost (SAR)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[
                                { date: '2026-04-18', ref: 'PO-9912', project: 'Riyadh Metro Extension', desc: 'Station Lighting Fixtures', cost: 12500 },
                                { date: '2026-04-19', ref: 'INV-4401', project: 'Dammam Port Facility', desc: 'Concrete Reinforcement (B Grade)', cost: 45000 },
                                { date: '2026-04-20', ref: 'PAY-005', project: 'Riyadh Metro Extension', desc: 'Technical Consultant Fees', cost: 8500 },
                                { date: '2026-04-20', ref: 'TRF-311', project: 'NEOM Site Office', desc: 'Generator Fuel Allocation', cost: 2400 },
                            ].map((entry, i) => (
                                <TableRow key={i} className="hover:bg-slate-50/50 border-b border-slate-50 transition-colors">
                                    <TableCell className="px-8 font-mono text-xs text-slate-500">{entry.date}</TableCell>
                                    <TableCell className="font-black text-[10px] text-blue-600 tracking-wider">#{entry.ref}</TableCell>
                                    <TableCell className="font-bold text-xs text-slate-800">{entry.project}</TableCell>
                                    <TableCell className="text-xs text-slate-500 font-medium">{entry.desc}</TableCell>
                                    <TableCell className="text-right px-8 font-mono font-bold text-slate-900 border-l border-slate-50">SAR {entry.cost.toLocaleString()}.00</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

interface ProjectTemplateItem {
  id: number;
  category_id?: number;
  category_name?: string;
  name: string;
  description: string;
  unit: string;
  default_unit_price: number;
}

const ProjectItemsManager = () => {
    const [items, setItems] = useState<ProjectTemplateItem[]>([]);
    const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', description: '', unit: 'Item', default_unit_price: 0, category_id: '' });
    const [editingItem, setEditingItem] = useState<ProjectTemplateItem | null>(null);

    const [viewItem, setViewItem] = useState<ProjectTemplateItem | null>(null);
    const [isViewOpen, setIsViewOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const filteredItems = items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const fetchData = async () => {
        setLoading(true);
        try {
            const [itemRes, catRes] = await Promise.all([
                fetch('/api/project-template-items'),
                fetch('/api/project-categories')
            ]);
            const itemData = await itemRes.json();
            const catData = await catRes.json();
            setItems(Array.isArray(itemData) ? itemData : []);
            setCategories(Array.isArray(catData) ? catData : []);
        } catch (err) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/project-template-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newItem,
                    category_id: newItem.category_id ? Number(newItem.category_id) : null
                }),
            });
            if (!res.ok) throw new Error('Failed to create');
            toast.success('Sub category added to catalog');
            setIsAddOpen(false);
            setNewItem({ name: '', description: '', unit: 'Item', default_unit_price: 0, category_id: '' });
            fetchData();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleUpdateItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;
        try {
            const res = await fetch(`/api/project-template-items/${editingItem.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editingItem.name,
                    description: editingItem.description,
                    unit: editingItem.unit,
                    default_unit_price: editingItem.default_unit_price,
                    category_id: editingItem.category_id
                }),
            });
            if (!res.ok) throw new Error('Failed to update');
            toast.success('Sub category updated');
            setIsEditOpen(false);
            fetchData();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Permanently remove this sub category from the catalog?')) return;
        try {
            const res = await fetch(`/api/project-template-items/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Deletion failed' }));
                throw new Error(errorData.error || 'Failed to remove item');
            }
            toast.success('Sub category removed successfully');
            fetchData();
        } catch (err: any) {
            toast.error(err.message || 'Deletion failed');
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse text-slate-400 font-mono text-xs uppercase tracking-widest">Loading Catalog...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-xl font-black tracking-tight text-slate-800 uppercase">Project Sub Category Catalog</h2>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Define standard sub categories and map them to project categories</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <Input 
                            placeholder="SEARCH CATALOG..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-9 h-10 w-64 text-[10px] font-black uppercase tracking-widest border-slate-200" 
                        />
                    </div>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger render={
                            <Button className="bg-blue-600 hover:bg-blue-700 h-10 text-[11px] font-black uppercase tracking-widest gap-2">
                                <Plus className="h-4 w-4" /> New Sub Category
                            </Button>
                        } />
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-sm font-black uppercase tracking-widest">Add Sub Category</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddItem} className="space-y-4 py-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Category Mapping</Label>
                                <select 
                                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 font-bold"
                                    value={newItem.category_id}
                                    onChange={e => setNewItem({...newItem, category_id: e.target.value})}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Sub Category Name</Label>
                                <Input required value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} placeholder="e.g., ELECTRICAL WIRING" className="h-9 text-xs" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Default Description</Label>
                                <Textarea value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} placeholder="Standard specification..." className="text-xs min-h-[80px]" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400">Unit</Label>
                                    <Input value={newItem.unit} onChange={e => setNewItem({ ...newItem, unit: e.target.value })} className="h-9 text-xs" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400">Default Rate</Label>
                                    <Input type="number" value={newItem.default_unit_price} onChange={e => setNewItem({ ...newItem, default_unit_price: Number(e.target.value) })} className="h-9 text-xs" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="w-full bg-blue-600 h-10 text-[11px] font-black uppercase tracking-widest">Register Sub Category</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>

            <Card className="border-none shadow-sm bg-white overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow className="h-12">
                            <TableHead className="px-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Category / Sub Category</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unit</TableHead>
                            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Default Price</TableHead>
                            <TableHead className="w-24 px-8 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredItems.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                                    {searchQuery ? 'No matching items' : 'No mapping items found'}
                                </TableCell>
                            </TableRow>
                        ) : filteredItems.map(item => (
                            <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                <TableCell className="px-8 py-4">
                                    <div className="space-y-1">
                                        <div className="text-[9px] font-black text-blue-600 uppercase tracking-wider">{item.category_name || 'Uncategorized'}</div>
                                        <div className="font-black text-xs text-slate-800 uppercase tracking-tight">{item.name}</div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-xs text-slate-500 font-medium max-w-[200px] truncate">{item.description}</TableCell>
                                <TableCell className="text-[10px] font-black uppercase text-slate-400">{item.unit}</TableCell>
                                <TableCell className="text-right font-mono font-bold text-slate-900">SAR {item.default_unit_price.toLocaleString()}.00</TableCell>
                                <TableCell className="px-8 text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => { setViewItem(item); setIsViewOpen(true); }}
                                            className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => { setEditingItem(item); setIsEditOpen(true); }}
                                            className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600"
                                        >
                                            <Edit3 className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => handleDelete(item.id)} 
                                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-black uppercase tracking-widest">Sub Category Details</DialogTitle>
                    </DialogHeader>
                    {viewItem && (
                        <div className="space-y-6 py-4">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em]">Parent Category</p>
                                <p className="text-xs font-bold text-slate-800 uppercase">{viewItem.category_name || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sub Category Name</p>
                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{viewItem.name}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Standard Specification</p>
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{viewItem.description || 'No detailed specification provided.'}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">UOM (Unit)</p>
                                    <Badge variant="outline" className="text-[10px] font-black uppercase">{viewItem.unit}</Badge>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Default Unit Rate</p>
                                    <p className="text-sm font-mono font-bold text-slate-900">SAR {viewItem.default_unit_price.toLocaleString()}.00</p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsViewOpen(false)} className="w-full h-10 text-[10px] font-black uppercase tracking-widest">Close View</Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-black uppercase tracking-widest">Edit Sub Category</DialogTitle>
                    </DialogHeader>
                    {editingItem && (
                        <form onSubmit={handleUpdateItem} className="space-y-4 py-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Category Mapping</Label>
                                <select 
                                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 font-bold"
                                    value={editingItem.category_id || ''}
                                    onChange={e => setEditingItem({...editingItem, category_id: e.target.value ? Number(e.target.value) : undefined})}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Sub Category Name</Label>
                                <Input required value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} className="h-10 text-xs font-bold" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Description</Label>
                                <Textarea value={editingItem.description || ''} onChange={e => setEditingItem({ ...editingItem, description: e.target.value })} className="text-xs min-h-[100px]" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400">Unit</Label>
                                    <Input value={editingItem.unit} onChange={e => setEditingItem({ ...editingItem, unit: e.target.value })} className="h-10 text-xs font-bold" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400">Rate</Label>
                                    <Input type="number" value={editingItem.default_unit_price} onChange={e => setEditingItem({ ...editingItem, default_unit_price: Number(e.target.value) })} className="h-10 text-xs font-bold" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-[11px] font-black uppercase tracking-widest shadow-lg">Save Changes</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

const ProjectCategoriesManager = () => {
    const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
    const [subCategories, setSubCategories] = useState<ProjectTemplateItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newName, setNewName] = useState('');

    const [editingSub, setEditingSub] = useState<ProjectTemplateItem | null>(null);
    const [isEditSubOpen, setIsEditSubOpen] = useState(false);
    const [viewSub, setViewSub] = useState<ProjectTemplateItem | null>(null);
    const [isViewSubOpen, setIsViewSubOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [catRes, subRes] = await Promise.all([
                fetch('/api/project-categories'),
                fetch('/api/project-template-items')
            ]);
            
            const catData = await catRes.json();
            const subData = await subRes.json();
            
            setCategories(Array.isArray(catData) ? catData : []);
            setSubCategories(Array.isArray(subData) ? subData : []);
        } catch (err) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/project-categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName }),
            });
            if (!res.ok) throw new Error('Failed to create');
            toast.success('Category created');
            setIsAddOpen(false);
            setNewName('');
            fetchData();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Remove this category? All mapping will be lost.')) return;
        try {
            await fetch(`/api/project-categories/${id}`, { method: 'DELETE' });
            toast.success('Category removed');
            fetchData();
        } catch (err) {
            toast.error('Deletion failed');
        }
    };

    const handleDeleteSub = async (id: number) => {
        if (!confirm('Remove this sub category from catalog?')) return;
        try {
            const res = await fetch(`/api/project-template-items/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            toast.success('Sub category removed');
            fetchData();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleUpdateSub = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSub) return;
        try {
            const res = await fetch(`/api/project-template-items/${editingSub.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingSub),
            });
            if (!res.ok) throw new Error('Failed to update');
            toast.success('Updated successfully');
            setIsEditSubOpen(false);
            fetchData();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse text-slate-400 font-mono text-xs uppercase tracking-widest">Loading Categories...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-xl font-black tracking-tight text-slate-800 uppercase">Project Categories</h2>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Define high-level project sections for estimations</p>
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger render={
                        <Button className="bg-blue-600 hover:bg-blue-700 h-10 text-[11px] font-black uppercase tracking-widest gap-2">
                            <Plus className="h-4 w-4" /> New Category
                        </Button>
                    } />
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-sm font-black uppercase tracking-widest">Add Category</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAdd} className="space-y-4 py-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Category Name</Label>
                                <Input required value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g., CIVIL WORKS" className="h-9 text-xs" />
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="w-full bg-blue-600 h-10 text-[11px] font-black uppercase tracking-widest">Register Category</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {categories.map(cat => (
                    <Card key={cat.id} className="border-none shadow-sm bg-white overflow-hidden">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <Badge variant="outline" className="font-mono text-[10px] font-black text-slate-400 border-slate-200">#{cat.id}</Badge>
                                <h3 className="font-black text-sm text-slate-800 uppercase tracking-tight">{cat.name}</h3>
                            </div>
                            <Button variant="ghost" onClick={() => handleDelete(cat.id)} className="h-8 w-8 p-0 text-slate-300 hover:text-red-500">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="p-0">
                            <Table>
                                <TableBody>
                                    {subCategories.filter(sub => sub.category_id === cat.id).length === 0 ? (
                                        <TableRow>
                                            <TableCell className="h-12 px-6 text-[10px] font-bold text-slate-400 uppercase italic">No subcategories mapped</TableCell>
                                        </TableRow>
                                    ) : subCategories.filter(sub => sub.category_id === cat.id).map(sub => (
                                        <TableRow key={sub.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <TableCell className="px-6 py-3">
                                                <div className="flex justify-between items-center">
                                                    <div className="space-y-0.5">
                                                        <div className="font-bold text-xs text-slate-700 uppercase">{sub.name}</div>
                                                        <div className="text-[10px] text-slate-400 truncate max-w-[400px]">{sub.description}</div>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="sm" onClick={() => { setViewSub(sub); setIsViewSubOpen(true); }} className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600">
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" onClick={() => { setEditingSub(sub); setIsEditSubOpen(true); }} className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600">
                                                            <Edit3 className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteSub(sub.id)} className="h-7 w-7 p-0 text-slate-400 hover:text-red-600">
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="w-32 text-right font-mono text-[10px] font-bold text-slate-500 px-6">
                                                SAR {sub.default_unit_price.toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                ))}
            </div>

            {/* View Sub Dialog */}
            <Dialog open={isViewSubOpen} onOpenChange={setIsViewSubOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-black uppercase tracking-widest">Sub Category Overview</DialogTitle>
                    </DialogHeader>
                    {viewSub && (
                        <div className="space-y-6 py-4">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em]">Parent Category</p>
                                <p className="text-xs font-bold text-slate-800 uppercase">{viewSub.category_name || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Name</p>
                                <p className="text-sm font-black text-slate-900 uppercase">{viewSub.name}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Specs</p>
                                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded">{viewSub.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pricing</p>
                                    <p className="text-xs font-bold font-mono">SAR {viewSub.default_unit_price}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Unit</p>
                                    <p className="text-xs font-bold uppercase">{viewSub.unit}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Sub Dialog */}
            <Dialog open={isEditSubOpen} onOpenChange={setIsEditSubOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-black uppercase tracking-widest">Update Sub Category</DialogTitle>
                    </DialogHeader>
                    {editingSub && (
                        <form onSubmit={handleUpdateSub} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Name</Label>
                                <Input value={editingSub.name} onChange={e => setEditingSub({...editingSub, name: e.target.value})} className="h-10 text-xs" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Description</Label>
                                <Textarea value={editingSub.description} onChange={e => setEditingSub({...editingSub, description: e.target.value})} className="text-xs min-h-[80px]" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400">Unit</Label>
                                    <Input value={editingSub.unit} onChange={e => setEditingSub({...editingSub, unit: e.target.value})} className="h-10 text-xs" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400">Rate</Label>
                                    <Input type="number" value={editingSub.default_unit_price} onChange={e => setEditingSub({...editingSub, default_unit_price: Number(e.target.value)})} className="h-10 text-xs" />
                                </div>
                            </div>
                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-black uppercase text-[11px] h-11 tracking-widest">Commit Changes</Button>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default function ProjectsModule({ subModule, initialParams }: { subModule: string, initialParams?: any }) {
  const [activeTab, setActiveTab] = useState(subModule || 'Active Projects');

  useEffect(() => {
    if (subModule) setActiveTab(subModule);
  }, [subModule]);

  return (
    <div className="space-y-6">
      {activeTab === 'Active Projects' && <ProjectsList />}
      {activeTab === 'Project Ledger' && <ProjectLedger />}
      {activeTab === 'Project Sub categories' && <ProjectItemsManager />}
      {activeTab === 'Project Categories' && <ProjectCategoriesManager />}
    </div>
  );
}
