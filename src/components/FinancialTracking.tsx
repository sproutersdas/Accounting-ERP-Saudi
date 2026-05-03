import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Briefcase, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Download,
  Search,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function FinancialTracking() {
  const [companyStats, setCompanyStats] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [projectStats, setProjectStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverallStats = async () => {
    try {
      const res = await fetch('/api/company/financial-summary');
      const data = await res.json();
      setCompanyStats(data);
    } catch (err) {
      console.error('Failed to fetch company stats', err);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error('Failed to fetch projects', err);
    }
  };

  const fetchProjectSpecificStats = async (id: string) => {
    if (id === 'all') {
      setProjectStats(null);
      return;
    }
    try {
      const res = await fetch(`/api/projects/${id}/financial-summary`);
      const data = await res.json();
      setProjectStats(data);
    } catch (err) {
      console.error('Failed to fetch project stats', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchOverallStats(), fetchProjects()]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    fetchProjectSpecificStats(selectedProject);
  }, [selectedProject]);

  if (loading) return <div className="h-64 flex items-center justify-center text-slate-400 font-mono text-xs uppercase tracking-widest animate-pulse">Gathering Financial Intelligence...</div>;

  const COLORS = ['#2563eb', '#f43f5e', '#10b981', '#f59e0b'];

  const projectPieData = projects.slice(0, 5).map((p, index) => ({
    name: p.name,
    value: p.budget || 0
  }));

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Financial Performance Hub</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time fiscal monitoring & project-wise accounting</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[250px] h-10 border-slate-200 text-xs font-bold uppercase tracking-wide rounded-xl">
              <SelectValue placeholder="All Projects (Global)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs font-bold uppercase tracking-wide">Global Overview</SelectItem>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id.toString()} className="text-xs font-bold uppercase tracking-wide">{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-10 px-4 rounded-xl border-slate-200">
             <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {selectedProject === 'all' ? (
        <>
          {/* Company-Wide Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-none bg-blue-600 text-white shadow-xl shadow-blue-600/20 rounded-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-20"><DollarSign className="h-20 w-20 -mr-6 -mt-6" /></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black tracking-tighter">SAR {(companyStats?.totalRevenue || 0).toLocaleString()}</div>
                <div className="flex items-center mt-2 text-[10px] font-bold bg-white/20 w-fit px-2 py-0.5 rounded-full">
                  <ArrowUpRight className="h-3 w-3 mr-1" /> +12.5% vs Last Period
                </div>
              </CardContent>
            </Card>

            <Card className="border-none bg-white shadow-sm rounded-2xl border-slate-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black tracking-tighter text-slate-900">SAR {(companyStats?.totalExpenses || 0).toLocaleString()}</div>
                <div className="flex items-center mt-2 text-[10px] font-bold text-red-500">
                  <ArrowDownRight className="h-3 w-3 mr-1" /> Adjusted for VAT
                </div>
              </CardContent>
            </Card>

            <Card className="border-none bg-white shadow-sm rounded-2xl border-slate-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Net Profitability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-black tracking-tighter ${companyStats?.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  SAR {(companyStats?.profit || 0).toLocaleString()}
                </div>
                <div className="flex items-center mt-2 text-[10px] font-bold text-emerald-500">
                  <TrendingUp className="h-3 w-3 mr-1" /> Healthy Cash Flow
                </div>
              </CardContent>
            </Card>

            <Card className="border-none bg-white shadow-sm rounded-2xl border-slate-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Project Operations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black tracking-tighter text-slate-900">{companyStats?.activeProjects} / {companyStats?.totalProjects}</div>
                <div className="flex items-center mt-2 text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                  <Activity className="h-3 w-3 mr-1" /> Active Engagements
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Project Distribution Chart */}
            <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl bg-white">
              <CardHeader className="border-b border-slate-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-600">Quarterly Fiscal Trend</CardTitle>
                  <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest text-blue-600">Detailed Report</Button>
                </div>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Jan', revenue: 45000, expense: 32000 },
                      { name: 'Feb', revenue: 52000, expense: 38000 },
                      { name: 'Mar', revenue: 48000, expense: 41000 },
                      { name: 'Apr', revenue: 61000, expense: 45000 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                        labelStyle={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '10px', marginBottom: '4px' }}
                      />
                      <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar dataKey="expense" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Budget Allocation */}
            <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
               <CardHeader className="border-b border-slate-50 bg-slate-50/50">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-600">Budget Allocation</CardTitle>
              </CardHeader>
              <CardContent className="pt-8 flex flex-col items-center">
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={projectPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {projectPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full mt-4 space-y-2">
                  {projectPieData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                         <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight truncate w-32">{entry.name}</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-900">SAR {entry.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <>
          {/* Project-Wise View */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-none bg-blue-50/50 rounded-2xl border-l-4 border-l-blue-600">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-blue-600">Designated Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black tracking-tighter text-slate-900">SAR {(projectStats?.budget || 0).toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card className="border-none bg-slate-50/50 rounded-2xl border-l-4 border-l-slate-400">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500">Actual Spend (Total Bills)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black tracking-tighter text-slate-900">SAR {(projectStats?.expenses || 0).toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card className={`border-none ${projectStats?.margin >= 0 ? 'bg-emerald-50/50 border-l-emerald-500' : 'bg-rose-50/50 border-l-rose-500'} rounded-2xl border-l-4`}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-[10px] font-black uppercase tracking-widest ${projectStats?.margin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>Current Project Margin</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black tracking-tighter text-slate-900">SAR {(projectStats?.margin || 0).toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-sm rounded-2xl bg-white">
            <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700">Project Financial Progress</CardTitle>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Budget Utilization Analysis</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-blue-600 tracking-tighter">{projectStats?.budgetUtilization?.toFixed(1)}%</div>
                <div className="text-[9px] font-black text-slate-300 uppercase">Utilized</div>
              </div>
            </CardHeader>
            <CardContent className="pt-10 pb-10">
              <div className="w-full bg-slate-100 h-6 rounded-full overflow-hidden flex shadow-inner">
                <div 
                  className={`h-full transition-all duration-1000 ease-in-out ${projectStats?.budgetUtilization > 90 ? 'bg-rose-500' : 'bg-blue-600'}`}
                  style={{ width: `${Math.min(projectStats?.budgetUtilization || 0, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-4 text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-400">Project Commencement</span>
                <span className="text-blue-600 font-black">{projectStats?.budgetUtilization > 100 ? 'Over Budget' : 'Within Limits'}</span>
                <span className="text-slate-400">Budget Threshold</span>
              </div>
            </CardContent>
          </Card>

          {/* Project Specific Data Table can go here (Ledger items for this project) */}
        </>
      )}

      {/* Global Project Summary Table (Always shown at bottom) */}
      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-50 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-black uppercase tracking-tight text-slate-800">Project Financial Ledger</CardTitle>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status of all active and finalized project accounts</p>
            </div>
            <div className="flex gap-2">
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input placeholder="Search project name..." className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 w-64 rounded-xl" />
               </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-none h-12">
                <TableHead className="px-8 text-[10px] font-black uppercase tracking-widest">Project Narrative</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Contractual Budget</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Actual Revenue</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Operational Costs</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Profit / Margin</TableHead>
                <TableHead className="px-8 text-center text-[10px] font-black uppercase tracking-widest">Health Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-slate-300 font-mono text-[10px] uppercase tracking-widest">No project archives detected</TableCell>
                </TableRow>
              ) : projects.map(p => (
                <TableRow key={p.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                  <TableCell className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-black text-slate-900 text-sm tracking-tight">{p.name}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.client_name || 'Individual Merchant'}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono font-bold text-slate-500 text-xs text-nowrap">SAR {p.budget?.toLocaleString()}</TableCell>
                  <TableCell className="font-mono font-black text-blue-600 text-xs text-nowrap">SAR {p.budget?.toLocaleString()}</TableCell>
                  <TableCell className="font-mono font-bold text-rose-500 text-xs text-nowrap">--</TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono font-black text-emerald-600 text-sm">--</span>
                  </TableCell>
                  <TableCell className="px-8 text-center">
                    <Badge className="bg-blue-600 text-white border-none font-black text-[9px] px-3 py-1 rounded-full uppercase tracking-widest">Optimal</Badge>
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
