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
  Eye,
  FileText,
  Hash
} from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Project {
  id: number;
  name: string;
  client_name: string;
  status: string;
  budget: number | '';
  start_date: string;
  end_date: string;
  description: string;
  actual_cost?: number; // Calculated field
}

const ProjectsList = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [newProject, setNewProject] = useState<any>({
    name: '',
    client_name: '',
    budget: '',
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
      
      const projData = await projRes.json();

      // We need to fetch real actual costs from ledger for each project
      const projectsWithCost = await Promise.all((Array.isArray(projData) ? projData : []).map(async (p: any) => {
          const lRes = await fetch(`/api/projects/${p.id}/ledger`);
          const lData = await lRes.json();
          const expenses = (Array.isArray(lData) ? lData : [])
            .filter(e => e.type === 'expense')
            .reduce((acc, curr) => acc + curr.amount, 0);
          return { ...p, actual_cost: expenses };
      }));

      setProjects(projectsWithCost);
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
      setNewProject({ name: '', client_name: '', budget: '', start_date: '', end_date: '', description: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Decommission this project module?')) return;
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
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-blue-50/50 shadow-sm elegant-card">
        <div>
          <h2 className="text-xl font-black tracking-tight text-blue-950 uppercase">Project Portfolio</h2>
          <p className="text-[11px] font-bold text-blue-400 uppercase tracking-widest mt-0.5 font-mono">Active monitoring and lifecycle management</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button className="bg-blue-600 hover:bg-blue-700 h-11 px-8 text-[11px] font-black uppercase tracking-widest gap-2 rounded-xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all"><Plus className="h-4 w-4" /> Initialize Project</Button>} />
          <DialogContent className="sm:max-w-lg">
             <DialogHeader>
               <DialogTitle className="text-sm font-black uppercase tracking-widest">Initialise Project</DialogTitle>
             </DialogHeader>
             <form onSubmit={handleAddProject} className="space-y-4 py-4">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Project Title</Label>
                    <Input icon={Briefcase} required value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Client / Principal</Label>
                    <Input icon={Users} required value={newProject.client_name} onChange={e => setNewProject({...newProject, client_name: e.target.value})} />
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Initial Budget (SAR)</Label>
                    <Input icon={DollarSign} type="number" required value={newProject.budget} onChange={e => setNewProject({...newProject, budget: e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value))})} className="font-bold text-blue-600" min="0" />
                  </div>
                  <div className="space-y-1.5">
                     <Label className="text-[10px] font-black uppercase text-slate-400">Scope of Work / Description</Label>
                     <Input icon={ClipboardList} value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Kick-off Date</Label>
                    <Input icon={Calendar} type="date" required value={newProject.start_date} onChange={e => setNewProject({...newProject, start_date: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Estimated Delivery</Label>
                    <Input icon={Calendar} type="date" required value={newProject.end_date} onChange={e => setNewProject({...newProject, end_date: e.target.value})} />
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
            <Card key={p.id} className="elegant-card border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all duration-300 rounded-2xl">
               <CardHeader className="bg-blue-50/30 border-b border-blue-50 p-6">
                  <div className="flex justify-between items-start">
                     <Badge className={`${p.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'} border-none font-black text-[9px] tracking-[0.1em] uppercase px-3 py-1 rounded-lg`}>{p.status}</Badge>
                     <Button variant="ghost" onClick={() => handleDelete(p.id)} className="h-8 w-8 p-0 text-slate-300 hover:text-red-500 rounded-full hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <CardTitle className="text-lg font-black text-blue-950 tracking-tight mt-4 uppercase">{p.name}</CardTitle>
                  <p className="text-[11px] text-blue-600/60 font-black uppercase tracking-widest flex items-center gap-2 mt-1">
                    <Users className="h-3.5 w-3.5" /> {p.client_name}
                  </p>
               </CardHeader>
               <CardContent className="p-6 space-y-7">
                  <div className="grid grid-cols-2 gap-6">
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 underline decoration-blue-100 underline-offset-4">Total Budget</p>
                        <p className="text-base font-black text-blue-950">SAR {Number(p.budget).toLocaleString()}</p>
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 underline decoration-blue-100 underline-offset-4">Actual Cost</p>
                        <p className={`text-base font-black ${isOverBudget ? 'text-red-600' : 'text-blue-600'}`}>SAR {p.actual_cost?.toLocaleString()}</p>
                     </div>
                  </div>

                  <div className="space-y-3">
                     <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span className="text-slate-400">Budget Utilization</span>
                        <span className={isOverBudget ? 'text-red-600 font-black' : 'text-blue-600 font-black'}>{progress}%</span>
                     </div>
                     <div className="h-2 bg-blue-50/50 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 shadow-sm ${isOverBudget ? 'bg-red-500' : 'bg-gradient-to-r from-blue-400 to-blue-600 animate-pulse-slow'}`} 
                          style={{ width: `${Math.min(100, progress)}%` }} 
                        />
                     </div>
                  </div>

                  <div className="pt-5 border-t border-blue-50/50 flex justify-between items-center">
                     <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                           <Calendar className="h-3.5 w-3.5 text-blue-400" /> <span className="text-slate-700">{p.start_date}</span>
                        </div>
                     </div>
                  </div>
               </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// --- PROJECT TEMPLATE ITEMS ---

interface ProjectTemplateItem {
  id: number;
  category_id?: number;
  category_name?: string;
  name: string;
  description: string;
  unit: string;
  default_unit_price: number | '';
}

const ProjectItemsManager = () => {
    const [items, setItems] = useState<ProjectTemplateItem[]>([]);
    const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
    const [units, setUnits] = useState<{id: number, name: string}[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [newItem, setNewItem] = useState<any>({ name: '', description: '', unit: 'Item', default_unit_price: '', category_id: '' });
    const [editingItem, setEditingItem] = useState<any>(null);

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
            const [itemRes, catRes, unitRes] = await Promise.all([
                fetch('/api/project-template-items'),
                fetch('/api/project-categories'),
                fetch('/api/units')
            ]);
            const itemData = await itemRes.json();
            const catData = await catRes.json();
            const unitData = await unitRes.json();
            setItems(Array.isArray(itemData) ? itemData : []);
            setCategories(Array.isArray(catData) ? catData : []);
            setUnits(Array.isArray(unitData) ? unitData : []);
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
            setNewItem({ name: '', description: '', unit: 'Item', default_unit_price: '', category_id: '' });
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
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-blue-50/50 shadow-sm elegant-card">
                <div>
                    <h2 className="text-xl font-black tracking-tight text-blue-950 uppercase">Sub Category Catalog</h2>
                    <p className="text-[11px] font-bold text-blue-400 uppercase tracking-widest mt-0.5 font-mono">Standardized project sub categories mapping</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-300" />
                        <Input 
                            placeholder="SEARCH CATALOG NODE..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-9 h-11 w-72 text-[10px] font-black uppercase tracking-widest border-blue-100 bg-blue-50/20 rounded-xl" 
                        />
                    </div>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger render={
                            <Button className="bg-blue-600 hover:bg-blue-700 h-11 px-8 text-[11px] font-black uppercase tracking-widest gap-2 rounded-xl shadow-xl shadow-blue-500/20">
                                <Plus className="h-4 w-4" /> Register New Sub
                            </Button>
                        } />
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-sm font-black uppercase tracking-widest">Add Sub Category</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddItem} className="space-y-4 py-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Category Mapping</Label>
                                <Combobox
                                    options={categories.map(cat => ({ label: cat.name, value: cat.id.toString() }))}
                                    value={newItem.category_id}
                                    onValueChange={v => setNewItem({...newItem, category_id: v})}
                                    placeholder="Select Category"
                                    className="h-9 w-full"
                                />
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
                                    <Combobox
                                        options={[
                                            ...units.map(u => ({ label: u.name, value: u.name })),
                                            ...(newItem.unit && !units.some(u => u.name === newItem.unit) ? [{ label: newItem.unit, value: newItem.unit }] : [])
                                        ]}
                                        value={newItem.unit}
                                        onValueChange={v => setNewItem({...newItem, unit: v})}
                                        placeholder="Unit"
                                        className="h-9 w-full"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400">Default Rate</Label>
                                    <Input type="number" value={newItem.default_unit_price} onChange={e => setNewItem({ ...newItem, default_unit_price: e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value)) })} className="h-9 text-xs" min="0" />
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
                                <Combobox
                                    options={categories.map(cat => ({ label: cat.name, value: cat.id.toString() }))}
                                    value={editingItem.category_id ? editingItem.category_id.toString() : ""}
                                    onValueChange={v => setEditingItem({...editingItem, category_id: v ? Number(v) : undefined})}
                                    placeholder="Select Category"
                                    className="h-10 w-full"
                                />
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
                                    <Combobox
                                        options={[
                                            ...units.map(u => ({ label: u.name, value: u.name })),
                                            ...(editingItem.unit && !units.some(u => u.name === editingItem.unit) ? [{ label: editingItem.unit, value: editingItem.unit }] : [])
                                        ]}
                                        value={editingItem.unit}
                                        onValueChange={v => setEditingItem({ ...editingItem, unit: v })}
                                        placeholder="Select Unit"
                                        className="h-10 w-full"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400">Rate</Label>
                                    <Input type="number" value={editingItem.default_unit_price} onChange={e => setEditingItem({ ...editingItem, default_unit_price: e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value)) })} className="h-10 text-xs font-bold" min="0" />
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
    const [units, setUnits] = useState<{id: number, name: string}[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const [editingSub, setEditingSub] = useState<ProjectTemplateItem | null>(null);
    const [isEditSubOpen, setIsEditSubOpen] = useState(false);
    const [viewSub, setViewSub] = useState<ProjectTemplateItem | null>(null);
    const [isViewSubOpen, setIsViewSubOpen] = useState(false);

    const [editingCategory, setEditingCategory] = useState<{id: number, name: string} | null>(null);
    const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
    const [viewCategory, setViewCategory] = useState<{id: number, name: string} | null>(null);
    const [isViewCategoryOpen, setIsViewCategoryOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [catRes, subRes, unitRes] = await Promise.all([
                fetch('/api/project-categories'),
                fetch('/api/project-template-items'),
                fetch('/api/units')
            ]);
            
            const catData = await catRes.json();
            const subData = await subRes.json();
            const unitData = await unitRes.json();
            
            setCategories(Array.isArray(catData) ? catData : []);
            setSubCategories(Array.isArray(subData) ? subData : []);
            setUnits(Array.isArray(unitData) ? unitData : []);
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

    const handleUpdateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCategory) return;
        try {
            const res = await fetch(`/api/project-categories/${editingCategory.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editingCategory.name }),
            });
            if (!res.ok) throw new Error('Failed to update');
            toast.success('Category updated successfully');
            setIsEditCategoryOpen(false);
            fetchData();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const filteredCategories = categories.filter(cat => 
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="p-10 text-center animate-pulse text-slate-400 font-mono text-xs uppercase tracking-widest">Loading Categories...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-blue-50/50 shadow-sm elegant-card">
                <div>
                    <h2 className="text-xl font-black tracking-tight text-blue-950 uppercase">Project Categories</h2>
                    <p className="text-[11px] font-bold text-blue-400 uppercase tracking-widest mt-0.5 font-mono">Structural project domain definitions</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-300" />
                        <Input 
                            placeholder="SEARCH CATEGORIES..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-9 h-11 w-72 text-[10px] font-black uppercase tracking-widest border-blue-100 bg-blue-50/20 rounded-xl" 
                        />
                    </div>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger render={
                            <Button className="bg-blue-600 hover:bg-blue-700 h-11 px-8 text-[11px] font-black uppercase tracking-widest gap-2 rounded-xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
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
            </div>

            <Card className="border-none shadow-sm bg-white overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow className="h-12 border-none">
                            <TableHead className="px-8 text-[10px] font-black uppercase tracking-widest text-slate-400">ID Reference</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category Descriptor</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Sub-categories</TableHead>
                            <TableHead className="w-24 px-8 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCategories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-32 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                                    {searchQuery ? 'No categories matching search' : 'No categories found'}
                                </TableCell>
                            </TableRow>
                        ) : filteredCategories.map(cat => (
                            <TableRow key={cat.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                                <TableCell className="px-8 py-4 w-40">
                                    <div className="flex items-center gap-2">
                                        <div className="h-7 w-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black text-[10px]">
                                            {cat.id}
                                        </div>
                                        <span className="text-[10px] font-black text-slate-300 font-mono tracking-tighter">CAT-{cat.id.toString().padStart(3, '0')}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="font-black text-sm text-slate-800 uppercase tracking-tight">{cat.name}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-slate-200">
                                        Global
                                    </Badge>
                                </TableCell>
                                <TableCell className="px-8 text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => { setViewCategory(cat); setIsViewCategoryOpen(true); }}
                                            className="h-9 w-9 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all rounded-full"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => { setEditingCategory(cat); setIsEditCategoryOpen(true); }}
                                            className="h-9 w-9 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all rounded-full"
                                        >
                                            <Edit3 className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => handleDelete(cat.id)} 
                                            className="h-9 w-9 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all rounded-full"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {/* View Category Dialog */}
            <Dialog open={isViewCategoryOpen} onOpenChange={setIsViewCategoryOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-black uppercase tracking-widest">Category Overview</DialogTitle>
                    </DialogHeader>
                    {viewCategory && (
                        <div className="space-y-6 py-4">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ID</p>
                                <p className="text-sm font-black text-slate-900 uppercase">ID-{viewCategory.id}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Name</p>
                                <p className="text-sm font-black text-slate-900 uppercase">{viewCategory.name}</p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Category Dialog */}
            <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-black uppercase tracking-widest">Update Category</DialogTitle>
                    </DialogHeader>
                    {editingCategory && (
                        <form onSubmit={handleUpdateCategory} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Name</Label>
                                <Input required value={editingCategory.name} onChange={e => setEditingCategory({...editingCategory, name: e.target.value})} className="h-10 text-xs" />
                            </div>
                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-black uppercase text-[11px] h-11 tracking-widest">Commit Changes</Button>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

const UnitsRegistry = () => {
    const [units, setUnits] = useState<{id: number, name: string}[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [editingUnit, setEditingUnit] = useState<{id: number, name: string} | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    useEffect(() => {
        fetchUnits();
    }, []);

    const fetchUnits = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/units');
            const data = await res.json();
            setUnits(Array.isArray(data) ? data : []);
        } catch (err) {
            toast.error('Failed to load units');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/units', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName }),
            });
            if (!res.ok) throw new Error('Failed to create');
            toast.success('Unit registered');
            setIsAddOpen(false);
            setNewName('');
            fetchUnits();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUnit) return;
        try {
            const res = await fetch(`/api/units/${editingUnit.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editingUnit.name }),
            });
            if (!res.ok) throw new Error('Failed to update');
            toast.success('Unit updated');
            setIsEditOpen(false);
            fetchUnits();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Permanently remove this unit of measurement?')) return;
        try {
            await fetch(`/api/units/${id}`, { method: 'DELETE' });
            toast.success('Unit removed');
            fetchUnits();
        } catch (err) {
            toast.error('Deletion failed');
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse text-slate-400 font-mono text-xs uppercase tracking-widest">Loading Units...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-blue-50/50 shadow-sm elegant-card">
                <div>
                    <h2 className="text-xl font-black tracking-tight text-blue-950 uppercase">Units Registry</h2>
                    <p className="text-[11px] font-bold text-blue-400 uppercase tracking-widest mt-0.5 font-mono">Standardized units of measurement</p>
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger render={
                        <Button className="bg-blue-600 hover:bg-blue-700 h-11 px-8 text-[11px] font-black uppercase tracking-widest gap-2 rounded-xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                            <Plus className="h-4 w-4" /> Register New Unit
                        </Button>
                    } />
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-sm font-black uppercase tracking-widest">Add Unit</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAdd} className="space-y-4 py-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Unit Name (e.g. m2, LS, Job)</Label>
                                <Input required value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g., m2" className="h-9 text-xs" />
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="w-full bg-blue-600 h-10 text-[11px] font-black uppercase tracking-widest">Register Unit</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {units.map(unit => (
                    <Card key={unit.id} className="border-none shadow-sm bg-white overflow-hidden elegant-card rounded-2xl group hover:shadow-md transition-all">
                        <div className="p-6 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 font-black text-[10px] tracking-tight">
                                    {unit.name.substring(0, 2).toUpperCase()}
                                </div>
                                <span className="font-black text-sm text-blue-950 uppercase tracking-tight">{unit.name}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="sm" onClick={() => { setEditingUnit(unit); setIsEditOpen(true); }} className="h-8 w-8 p-0 text-blue-300 hover:text-blue-600 hover:bg-blue-50 rounded-full">
                                    <Edit3 className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(unit.id)} className="h-8 w-8 p-0 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full">
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Edit Unit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-black uppercase tracking-widest">Update Unit</DialogTitle>
                    </DialogHeader>
                    {editingUnit && (
                        <form onSubmit={handleUpdate} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Unit Name</Label>
                                <Input value={editingUnit.name} onChange={e => setEditingUnit({...editingUnit, name: e.target.value})} className="h-10 text-xs" />
                            </div>
                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-black uppercase text-[11px] h-11 tracking-widest">Update Registry</Button>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

import FinancialTracking from './FinancialTracking';

export default function ProjectsModule({ subModule, initialParams }: { subModule: string, initialParams?: any }) {
  const [activeTab, setActiveTab] = useState(subModule || 'Active Projects');

  useEffect(() => {
    if (subModule) setActiveTab(subModule);
  }, [subModule]);

  return (
    <div className="space-y-6">
      {activeTab === 'Financial Tracking' && <FinancialTracking />}
      {activeTab === 'Active Projects' && <ProjectsList />}
      {activeTab === 'Units Registry' && <UnitsRegistry />}
      {activeTab === 'Project Sub categories' && <ProjectItemsManager />}
      {activeTab === 'Project Categories' && <ProjectCategoriesManager />}
    </div>
  );
}
