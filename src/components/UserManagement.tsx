import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  UserPlus, 
  Shield, 
  User as UserIcon, 
  Edit, 
  Eye, 
  ArrowLeft, 
  Check, 
  X, 
  Lock,
  Building
} from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: number;
  username: string;
  role: string;
  created_at: string;
}

// --- USER FORM COMPONENT (CREATE/EDIT) ---
function UserForm({ 
  user, 
  onCancel, 
  onSave, 
  readOnly = false
}: { 
  user?: User | null, 
  onCancel: () => void, 
  onSave: () => void,
  readOnly?: boolean
}) {
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(user?.role || 'user');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) {
      toast.error('Username is required');
      return;
    }
    if (!user && !password) {
      toast.error('Password is required for new users');
      return;
    }

    setLoading(true);
    try {
      const url = user ? `/api/users/${user.id}` : '/api/users';
      const method = user ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          password: password || undefined, 
          role
        }),
      });

      if (!res.ok) throw new Error('Failed to save user');
      
      toast.success(user ? 'User updated successfully' : 'User created successfully');
      onSave();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <Card className="border-none shadow-sm bg-white max-w-2xl mx-auto">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle className="text-lg font-black uppercase tracking-tight text-slate-800">
              {user ? 'Edit Member Profile' : 'Provision New Account'}
            </CardTitle>
            <CardDescription className="text-xs font-medium">Define access credentials and system identity</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Identity Tag (Username)</label>
              <Input 
                icon={UserIcon}
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                disabled={readOnly}
                placeholder="e.g. k.alghamdi"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">System Privilege</label>
              <Combobox
                options={[
                  { label: "Standard User", value: "user" },
                  { label: "Strategic Administrator", value: "admin" }
                ]}
                value={role}
                onValueChange={!readOnly ? setRole : () => null}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">
              {user ? 'Update Password (Leave blank for no change)' : 'Initial Security Key'}
            </label>
            <Input 
              icon={Lock}
              type="password"
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              disabled={readOnly}
              placeholder={readOnly ? "••••••••" : (user ? "••••••••" : "Minimum 8 characters")}
            />
          </div>


          <div className="pt-4 flex gap-3">
            <Button 
               type="button" 
               variant="outline" 
               onClick={onCancel} 
               className="flex-1 h-12 uppercase text-[11px] font-black tracking-widest border-slate-100 hover:bg-slate-50"
            >
              {readOnly ? 'Back to Directory' : 'Discard Changes'}
            </Button>
            {!readOnly && (
              <Button 
                type="submit" 
                disabled={loading}
                className="flex-[2] h-12 bg-blue-600 hover:bg-blue-700 uppercase text-[11px] font-black tracking-widest shadow-lg shadow-blue-200"
              >
                {loading ? 'Processing...' : user ? 'Commit Updates' : 'Initialize Account'}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// --- MAIN USER MANAGEMENT VIEW ---
export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'create' | 'edit' | 'view'>('list');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchData = async () => {
    try {
      const uRes = await fetch('/api/users');

      if (uRes.status === 401) {
        window.location.reload();
        return;
      }

      const uData = await uRes.json();
      setUsers(Array.isArray(uData) ? uData : []);
    } catch (err: any) {
      toast.error('Sync failure');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Permanent data loss warning: Proceed with deletion?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete operation failed');
      toast.success('Account purged');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) return <div className="p-12 text-center animate-pulse text-slate-400 font-mono text-xs uppercase tracking-widest">Accessing Directory...</div>;

  if (view === 'create' || view === 'edit' || view === 'view') {
    return (
      <UserForm 
        user={selectedUser} 
        readOnly={view === 'view'}
        onCancel={() => { setView('list'); setSelectedUser(null); }} 
        onSave={() => { setView('list'); setSelectedUser(null); fetchData(); }} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-800 uppercase">User Administration</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Global account management and security protocols</p>
        </div>
        <Button 
          onClick={() => { setSelectedUser(null); setView('create'); }}
          className="bg-blue-600 hover:bg-blue-700 h-10 text-[11px] font-black uppercase tracking-widest px-6 gap-2"
        >
          <UserPlus className="h-4 w-4" /> Create User
        </Button>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80 hover:bg-transparent">
            <TableRow className="h-12 border-b border-slate-100">
              <TableHead className="px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Identity / Username</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Privileges</TableHead>

              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Onboarding Date</TableHead>
              <TableHead className="text-right px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Operations</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? (
              users.map((u) => (
                <TableRow key={u.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 group">
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400 group-hover:bg-white transition-colors">
                        <UserIcon className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-slate-800 uppercase">{u.username}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">ID: USR-00{u.id}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest border-none px-3 py-1 ${
                      u.role === 'admin' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {u.role === 'admin' ? <Shield className="h-2.5 w-2.5 mr-1.5 inline-block" /> : <UserIcon className="h-2.5 w-2.5 mr-1.5 inline-block" />}
                      {u.role}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    {new Date(u.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex justify-end items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => { setSelectedUser(u); setView('view'); }}
                        className="h-8 w-8 text-slate-400 hover:text-emerald-500 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => { setSelectedUser(u); setView('edit'); }}
                        className="h-8 w-8 text-slate-400 hover:text-[#2563eb] p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(u.id)}
                        className="h-8 w-8 text-slate-400 hover:text-red-500 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="py-20 text-center">
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-[0.2em]">No records found in active directory</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// --- MODULAR WRAPPER ---
export default function UserManagementModule({ subModule, initialParams }: { subModule?: string, initialParams?: any }) {
  const [activeTab, setActiveTab] = useState(subModule === 'Manage Users' ? 'manage' : 'profile');

  useEffect(() => {
    if (subModule === 'Manage Users') setActiveTab('manage');
    else if (subModule === 'My Profile') setActiveTab('profile');
  }, [subModule]);

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-slate-200 pb-0.5">
        <button 
          onClick={() => setActiveTab('profile')}
          className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'profile' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          My Profile
        </button>
        <button 
          onClick={() => setActiveTab('manage')}
          className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'manage' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Manage Users
        </button>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'profile' ? (
          <UserProfile />
        ) : (
          <UserManagement />
        )}
      </div>
    </div>
  );
}

// --- PROFILE VIEW COMPONENT ---
export function UserProfile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/me');
      if (!res.ok) throw new Error('Session mismatch');
      const data = await res.json();
      setUser(data);
      setUsername(data.username);
    } catch (err) {
      toast.error('Identity sync error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: password || undefined }),
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success('Security profile updated');
      setIsEditing(false);
      setPassword('');
      fetchProfile();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-300 uppercase tracking-widest animate-pulse text-[10px] font-bold">Synchronizing Identity...</div>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <div className="h-32 bg-blue-900/10 relative">
          <div className="absolute -bottom-12 left-8">
            <div className="h-24 w-24 rounded-2xl bg-blue-600 border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
               <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-3xl font-black uppercase">
                 {user?.username?.slice(0, 2)}
               </div>
            </div>
          </div>
        </div>
        <CardContent className="pt-16 pb-10 px-8">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tighter text-slate-800 uppercase">{user?.username}</h2>
              <div className="flex flex-wrap gap-2">
                 <Badge className="bg-blue-50 text-blue-700 border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">Secure Integrity</Badge>
                 <Badge variant="outline" className="border-slate-100 text-slate-400 font-bold text-[9px] uppercase tracking-widest px-3 py-1">Privilege: {user?.role}</Badge>
              </div>
            </div>
            {!isEditing && (
              <Button 
                onClick={() => setIsEditing(true)}
                variant="outline" 
                className="h-10 px-6 text-[10px] font-black uppercase tracking-widest border-slate-200 hover:bg-slate-50 gap-2"
              >
                <Edit className="h-3.5 w-3.5" /> Modify Security Details
              </Button>
            )}
          </div>
          
          {isEditing ? (
            <form onSubmit={handleUpdate} className="mt-10 space-y-6 p-6 bg-slate-50 rounded-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Public Alias</label>
                   <Input 
                      icon={UserIcon}
                      value={username} 
                      onChange={e => setUsername(e.target.value)} 
                   />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">New Security Key</label>
                   <Input 
                      icon={Lock}
                      type="password"
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      placeholder="••••••••"
                   />
                 </div>
               </div>
               <div className="flex gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} className="h-11 text-[10px] font-black uppercase tracking-widest">Cancel</Button>
                  <Button type="submit" className="flex-1 h-11 bg-slate-800 hover:bg-slate-700 uppercase text-[10px] font-black tracking-widest">Update Profile</Button>
               </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mt-12 pt-8 border-t border-slate-100">
               <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                   <Shield className="h-3 w-3" /> Responsibility
                 </p>
                 <p className="text-sm font-bold text-slate-800">{user?.role === 'admin' ? 'Strategic Systems Administrator' : 'Operations Workflow Member'}</p>
                 <p className="text-[10px] text-slate-400 font-medium">Defined by ITQAN Security Oracle</p>
               </div>

               <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account Health</p>
                 <div className="flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                   <p className="text-sm font-bold text-slate-800">Verified & Hardened</p>
                 </div>
               </div>
               <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Identity</p>
                 <p className="text-sm font-bold text-slate-500 font-mono">HASH-{"0".repeat(8 - (user?.id?.toString()?.length || 0)) + user?.id}</p>
               </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="flex justify-center">
        <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-300">Identity Persistence v4.0.2</p>
      </div>
    </div>
  );
}
