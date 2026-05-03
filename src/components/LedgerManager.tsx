import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Combobox } from '@/components/ui/combobox';
import { toast } from 'sonner';

export default function LedgerManager({ accounts }: { accounts: any[] }) {
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', account_id: '' });

  const fetchLedgers = async () => {
    try {
      const res = await fetch('/api/ledgers');
      if (!res.ok) throw new Error('Failed to fetch ledgers');
      setLedgers(await res.json());
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.name || !formData.account_id) return toast.error('Please fill all fields');
      const res = await fetch('/api/ledgers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          account_id: Number(formData.account_id)
        })
      });
      if (!res.ok) throw new Error('Failed to save ledger');
      toast.success('Ledger created');
      setIsDialogOpen(false);
      setFormData({ name: '', account_id: '' });
      fetchLedgers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const deleteLedger = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      const res = await fetch(`/api/ledgers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete ledger');
      toast.success('Ledger deleted');
      fetchLedgers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-sm font-bold text-slate-400">Loading ledgers...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">Ledger Mapping</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button size="sm" className="bg-[#2563eb] hover:bg-blue-700 text-white font-bold h-9">
              <Plus className="h-4 w-4 mr-2" /> New Ledger
            </Button>
          } />
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-sm font-black uppercase tracking-widest text-slate-800">Create New Ledger</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Ledger Name</label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Sales Ledger" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Map to Chart of Account</label>
                <Combobox
                  options={Array.from(new Map(accounts.map(a => [a.actual_account_id || a.id, a])).values()).map(a => ({ label: `[${a.code}] ${a.name}`, value: (a.actual_account_id || a.id).toString() }))}
                  value={formData.account_id}
                  onValueChange={v => setFormData({...formData, account_id: v})}
                  placeholder="Select account"
                />
              </div>
              <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 font-bold uppercase tracking-widest text-white">Save Ledger</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm pb-8">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-black">
              <TableRow>
                <TableHead className="text-[10px] font-black uppercase text-slate-800 h-10 px-6">Ledger Name</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-800 h-10 px-6">Mapped Account Code</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-800 h-10 px-6">Mapped Account Name</TableHead>
                <TableHead className="w-16 h-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledgers.map((l) => (
                <TableRow key={l.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <TableCell className="font-bold text-sm text-slate-900 px-6">{l.name}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-500 px-6">{l.account_code}</TableCell>
                  <TableCell className="text-sm font-medium text-slate-700 px-6">{l.account_name}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => deleteLedger(l.id)} className="h-8 w-8 text-red-500 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {ledgers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-400 font-medium text-sm">No ledgers defined.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
