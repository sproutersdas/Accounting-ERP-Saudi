import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, MapPin, Building, Database, Globe, Mail, Phone, Hash, FileCheck, Upload, X, Eye, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface CompanyDetails {
  id?: number;
  name: string;
  cr_number: string;
  vat_number: string;
  address: string;
  city: string;
  country: string;
  email: string;
  website: string;
  phone: string;
  logo_url: string;
}

const CompanyDetailsManagement = () => {
  const [companies, setCompanies] = useState<CompanyDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewingCompany, setViewingCompany] = useState<CompanyDetails | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [details, setDetails] = useState<CompanyDetails & { id?: number }>({
    name: '', cr_number: '', vat_number: '', address: '', city: '', country: '', email: '', website: '', phone: '', logo_url: ''
  });

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/company-details');
      const data = await res.json();
      setCompanies(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      toast.error('Logo size must be less than 1MB');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setDetails(prev => ({ ...prev, logo_url: base64 }));
      toast.success('Logo uploaded as Base64');
      setUploading(false);
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/company-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to save details');
      }
      toast.success(editingId ? 'Company updated successfully' : 'Company created successfully');
      setDetails({ name: '', cr_number: '', vat_number: '', address: '', city: '', country: '', email: '', website: '', phone: '', logo_url: '' });
      setIsFormOpen(false);
      setEditingId(null);
      fetchCompanies();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (company: CompanyDetails & { id?: number }) => {
    setDetails(company);
    setEditingId(company.id || null);
    setIsFormOpen(true);
    setViewingCompany(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this company profile?')) return;
    try {
      const res = await fetch(`/api/company-details/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Company profile removed');
      fetchCompanies();
    } catch (err) {
      toast.error('Deletion failed');
    }
  };

  if (loading && companies.length === 0) return <div className="p-10 text-center animate-pulse text-slate-400 font-mono text-xs uppercase tracking-widest">Accessing Organizational Node...</div>;

  if (viewingCompany) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => setViewingCompany(null)} className="h-9 gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to List
          </Button>
          <h2 className="text-xl font-black uppercase tracking-tight text-slate-800">{viewingCompany.name}</h2>
        </div>
        
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardContent className="p-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="flex flex-col items-center space-y-6">
                <div className="h-48 w-48 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                  {viewingCompany.logo_url ? (
                    <img src={viewingCompany.logo_url} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Building className="h-16 w-16 text-slate-200" />
                  )}
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 px-4 py-1 font-black text-[10px] tracking-widest uppercase">Verified Entity</Badge>
              </div>
              
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Administrative Records</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-300">CR Number</p>
                      <p className="font-bold text-slate-800">{viewingCompany.cr_number || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-300">VAT Number</p>
                      <p className="font-bold text-slate-800">{viewingCompany.vat_number || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Contact Channels</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-300">Email Address</p>
                      <p className="font-bold text-slate-800">{viewingCompany.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-300">Phone</p>
                      <p className="font-bold text-slate-800">{viewingCompany.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-300">Website</p>
                      <p className="font-bold text-slate-800">{viewingCompany.website || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div className="sm:col-span-2 space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Global Location</h4>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800 whitespace-pre-wrap leading-relaxed">{viewingCompany.address}</p>
                    <p className="text-sm font-bold text-slate-500 uppercase">{viewingCompany.city}, {viewingCompany.country}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-800 uppercase">Company Profiles</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Manage institutional identities and legal entities</p>
        </div>
        <Button 
          onClick={() => {
            setDetails({ name: '', cr_number: '', vat_number: '', address: '', city: '', country: '', email: '', website: '', phone: '', logo_url: '' });
            setEditingId(null);
            setIsFormOpen(!isFormOpen);
          }}
          className="bg-blue-600 hover:bg-blue-700 h-10 text-[11px] font-black uppercase tracking-widest gap-2"
        >
          {isFormOpen ? 'Cancel' : <><Plus className="h-4 w-4" /> Add Company</>}
        </Button>
      </div>

      {isFormOpen ? (
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 py-4 px-8">
            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
              {editingId ? 'Edit Company Profile' : 'New Institutional Profile Registration'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSave} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Essential Identity */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-blue-600 tracking-widest border-l-2 border-blue-600 pl-3">Institutional Logo</h3>
                    <div className="flex items-center gap-6">
                      <div className="h-24 w-24 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center shrink-0 relative overflow-hidden group">
                        {details.logo_url ? (
                          <>
                            <img src={details.logo_url} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                            <button 
                              type="button" 
                              onClick={() => setDetails(prev => ({ ...prev, logo_url: '' }))}
                              className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </>
                        ) : (
                          <Building className="h-8 w-8 text-slate-300" />
                        )}
                        {uploading && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                            <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Institutional Asset (PNG/JPG)</p>
                        <input 
                          type="file" 
                          id="logo-upload" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleLogoUpload}
                        />
                        <label 
                          htmlFor="logo-upload"
                          className="inline-flex items-center gap-2 h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest rounded-lg cursor-pointer transition-colors shadow-sm"
                        >
                          <Upload className="h-4 w-4" /> {details.logo_url ? 'Replace Logo' : 'Upload Logo'}
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-blue-600 tracking-widest border-l-2 border-blue-600 pl-3">Legal Entity Identity</h3>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Official Company Name</label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                        <Input 
                          value={details.name} 
                          onChange={e => setDetails({...details, name: e.target.value})} 
                          className="h-10 pl-10 text-sm font-bold bg-slate-50 border-slate-200" 
                          placeholder="e.g., Nikken Moller Industries"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">CR Number</label>
                        <div className="relative">
                          <Hash className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                          <Input 
                            value={details.cr_number} 
                            onChange={e => setDetails({...details, cr_number: e.target.value})} 
                            className="h-10 pl-10 text-sm font-bold bg-slate-50 border-slate-200" 
                            placeholder="1010xxxxxx"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">VAT Number</label>
                        <div className="relative">
                          <FileCheck className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                          <Input 
                            value={details.vat_number} 
                            onChange={e => setDetails({...details, vat_number: e.target.value})} 
                            className="h-10 pl-10 text-sm font-bold bg-slate-50 border-slate-200" 
                            placeholder="3121xxxxxx"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Communication Nodes */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-blue-600 tracking-widest border-l-2 border-blue-600 pl-3">Communication Channels</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Official Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                          <Input 
                            value={details.email} 
                            onChange={e => setDetails({...details, email: e.target.value})} 
                            className="h-10 pl-10 text-sm font-bold bg-slate-50 border-slate-200" 
                            placeholder="info@company.com"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Primary Contact</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                          <Input 
                            value={details.phone} 
                            onChange={e => setDetails({...details, phone: e.target.value})} 
                            className="h-10 pl-10 text-sm font-bold bg-slate-50 border-slate-200" 
                            placeholder="+966-xx xxx xxxx"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Enterprise Website</label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                        <Input 
                          value={details.website} 
                          onChange={e => setDetails({...details, website: e.target.value})} 
                          className="h-10 pl-10 text-sm font-bold bg-slate-50 border-slate-200" 
                          placeholder="www.company.com"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Geographical Jurisdiction */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-blue-600 tracking-widest border-l-2 border-blue-600 pl-3">Physical Jurisdiction</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Office Address</label>
                      <textarea 
                        value={details.address} 
                        onChange={e => setDetails({...details, address: e.target.value})} 
                        className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus:bg-white transition-all" 
                        placeholder="Plot No. 12, Industrial Area, Riyadh"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">City</label>
                      <Input 
                        value={details.city} 
                        onChange={e => setDetails({...details, city: e.target.value})} 
                        className="h-10 text-sm font-bold bg-slate-50 border-slate-200" 
                        placeholder="Riyadh"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Country</label>
                      <Input 
                        value={details.country} 
                        onChange={e => setDetails({...details, country: e.target.value})} 
                        className="h-10 text-sm font-bold bg-slate-50 border-slate-200" 
                        placeholder="Kingdom of Saudi Arabia"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsFormOpen(false)}
                  className="h-11 text-[11px] font-black uppercase tracking-widest px-8 border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                >
                  Cancel
                </Button>
                <Button disabled={saving} type="submit" className="bg-blue-600 hover:bg-blue-700 min-w-[200px] h-11 text-[11px] font-black uppercase tracking-widest gap-2 shadow-lg shadow-blue-200">
                  {saving ? 'Synchronizing Data...' : editingId ? 'Update Company' : 'Create Company'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="h-12 border-b border-slate-100">
                <TableHead className="px-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Institutional Entity</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">CR / VAT</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contact Details</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jurisdiction</TableHead>
                <TableHead className="text-right px-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id} className="hover:bg-slate-50/50 transition-all border-b border-slate-50">
                  <TableCell className="px-8 py-5">
                    <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setViewingCompany(company)}>
                      <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Building className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-black text-sm text-slate-800 uppercase tracking-tight group-hover:text-blue-600 transition-colors">{company.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{company.website}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                        <Hash className="h-3 w-3 opacity-40" /> {company.cr_number || 'N/A'}
                      </p>
                      <p className="text-[10px] font-bold text-slate-700 uppercase flex items-center gap-1.5">
                        <FileCheck className="h-3 w-3 text-blue-500" /> {company.vat_number || 'N/A'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-800 truncate max-w-[150px]">{company.email}</p>
                      <p className="text-[10px] font-bold text-slate-400">{company.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-1.5">
                      <MapPin className="h-3 w-3 text-slate-300 mt-0.5 shrink-0" />
                      <p className="text-[10px] font-bold text-slate-500 uppercase leading-tight italic truncate max-w-[180px]">
                        {company.address}, {company.city}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right px-8">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setViewingCompany(company)} className="h-8 w-8 p-0 text-slate-300 hover:text-blue-500 hover:bg-blue-50">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(company)} className="h-8 px-4 text-[9px] font-black uppercase tracking-widest text-white bg-blue-500 hover:bg-blue-600 rounded-xl shadow-sm">Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(company.id!)} className="h-8 w-8 p-0 text-slate-300 hover:text-red-500 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {companies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center font-mono text-[10px] uppercase text-slate-400 tracking-[0.2em]">
                    No Institutional Profiles Registered
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default function MasterDataModule({ subModule, initialParams }: { subModule: string, initialParams?: any }) {
  const [activeTab, setActiveTab] = useState(subModule || 'Company Details');

  useEffect(() => {
    if (subModule) setActiveTab(subModule);
  }, [subModule]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-800 uppercase">Master Data Management</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Control global system configurations and nodes</p>
        </div>
        <Badge className="bg-blue-600 text-white border-none px-4 py-1 font-black text-[10px] tracking-widest uppercase flex gap-2 items-center">
          <Database className="h-3 w-3" /> System Core
        </Badge>
      </div>

      {activeTab === 'Company Details' && <CompanyDetailsManagement />}
    </div>
  );
}
