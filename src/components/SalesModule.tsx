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
  Trash2,
  ArrowRightLeft,
  History,
  Layers,
  ChevronRight,
  ChevronDown
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
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- REVISION COMPARISON COMPONENT ---
const REV_COLORS = [
  { text: 'text-indigo-600', bg: 'bg-indigo-50', badge: 'bg-indigo-600', border: 'border-indigo-600' },
  { text: 'text-emerald-600', bg: 'bg-emerald-50', badge: 'bg-emerald-600', border: 'border-emerald-600' },
  { text: 'text-violet-600', bg: 'bg-violet-50', badge: 'bg-violet-600', border: 'border-violet-600' },
  { text: 'text-rose-600', bg: 'bg-rose-50', badge: 'bg-rose-600', border: 'border-rose-600' },
  { text: 'text-amber-600', bg: 'bg-amber-50', badge: 'bg-amber-600', border: 'border-amber-600' },
  { text: 'text-cyan-600', bg: 'bg-cyan-50', badge: 'bg-cyan-600', border: 'border-cyan-600' },
];

const RevisionComparison = ({ ids, onBack }: { ids: number[], onBack: () => void }) => {
  const [revisionsData, setRevisionsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/quotations/compare-multi/${ids.sort((a,b) => a-b).join(',')}`)
      .then(res => res.json())
      .then(d => {
        setRevisionsData(d);
        setLoading(false);
      })
      .catch(err => {
        toast.error('Failed to load comparison data');
        onBack();
      });
  }, [ids]);

  if (loading) return <div className="h-64 flex items-center justify-center text-blue-400 font-mono text-xs uppercase tracking-widest animate-pulse">Analyzing document deltas...</div>;
  if (!revisionsData || revisionsData.length === 0) return null;

  // Build a map of items by SN for comparison across ALL revisions
  const snMap = new Map<string, { [revId: string]: any }>();
  revisionsData.forEach(rev => {
    rev.items.forEach((it: any) => {
      const entry = snMap.get(it.sn) || {};
      entry[rev.id] = it;
      snMap.set(it.sn, entry);
    });
  });

  const sortedSNs = Array.from(snMap.keys()).sort((a, b) => {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        if ((aParts[i] || 0) !== (bParts[i] || 0)) return (aParts[i] || 0) - (bParts[i] || 0);
    }
    return 0;
  });

  // Revisions ordered by ID ASC (oldest first)
  const orderedRevs = [...revisionsData].sort((a, b) => a.id - b.id);

  const exportToExcel = () => {
    const reportData = sortedSNs.map(sn => {
      const itemMap = snMap.get(sn)!;
      const row: any = { 'SN': sn };
      // Description from latest revision where it exists
      const latestItem = [...orderedRevs].reverse().find(r => itemMap[r.id])?.[itemMap[orderedRevs[orderedRevs.length-1].id]?.description]; 
      // safer:
      let desc = '';
      for(let i = orderedRevs.length - 1; i >= 0; i--) {
        if(itemMap[orderedRevs[i].id]) {
          desc = itemMap[orderedRevs[i].id].description;
          break;
        }
      }
      row['Description'] = desc;
      
      orderedRevs.forEach(rev => {
        row[`${rev.revision} Value`] = itemMap[rev.id] ? itemMap[rev.id].amount : 0;
      });
      
      const last = orderedRevs[orderedRevs.length - 1];
      const secondLast = orderedRevs.length > 1 ? orderedRevs[orderedRevs.length - 2] : null;
      if (secondLast) {
        row['Latest Delta'] = (itemMap[last.id]?.amount || 0) - (itemMap[secondLast.id]?.amount || 0);
      }
      
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Comparison Audit");
    XLSX.writeFile(wb, `Multi_Revision_Comparison_${orderedRevs[0].quotation_number}.xlsx`);
    toast.success('Excel export successful');
  };

  const exportToPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text('MULTIPLE REVISION COMPARISON AUDIT', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Reference: ${orderedRevs[0].quotation_number} | Comparing ${orderedRevs.map(r => r.revision).join(', ')}`, 14, 30);
    
    const headers = ['SN', 'Description', ...orderedRevs.map(r => `${r.revision} (SAR)`), 'Latest Delta'];
    
    const tableData = sortedSNs.map(sn => {
      const itemMap = snMap.get(sn)!;
      let desc = '';
      for(let i = orderedRevs.length - 1; i >= 0; i--) {
        if(itemMap[orderedRevs[i].id]) {
          desc = itemMap[orderedRevs[i].id].description;
          break;
        }
      }
      
      const values = orderedRevs.map(rev => (itemMap[rev.id]?.amount || 0).toLocaleString() + '.00');
      const lastVal = itemMap[orderedRevs[orderedRevs.length-1].id]?.amount || 0;
      const prevVal = orderedRevs.length > 1 ? (itemMap[orderedRevs[orderedRevs.length-2].id]?.amount || 0) : lastVal;
      const d = lastVal - prevVal;
      
      return [
        sn,
        desc,
        ...values,
        (d === 0 ? '0.00' : (d > 0 ? '+' : '') + d.toLocaleString() + '.00')
      ];
    });

    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], fontSize: 7, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7 },
      columnStyles: {
        // Dynamic column alignment
        ...orderedRevs.reduce((acc, _, i) => ({ ...acc, [i+2]: { halign: 'right' } }), {}),
        [orderedRevs.length + 2]: { halign: 'right' }
      }
    });

    doc.save(`Multi_Revision_Comparison_${orderedRevs[0].quotation_number}.pdf`);
    toast.success('PDF export successful');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-800">
          ← Back to Registry
        </Button>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportToPDF} className="h-8 text-[9px] font-black uppercase tracking-widest gap-2 rounded-xl border-slate-200">
                <FileText className="h-3.5 w-3.5 text-rose-500" /> Export PDF
            </Button>
            <Button variant="outline" size="sm" onClick={exportToExcel} className="h-8 text-[9px] font-black uppercase tracking-widest gap-2 rounded-xl border-slate-200">
                <Download className="h-3.5 w-3.5 text-emerald-500" /> Export Excel
            </Button>
            <div className="flex items-center gap-2 bg-slate-100 p-2 px-6 rounded-2xl border border-slate-200">
               {orderedRevs.map((rev, idx) => {
                 const color = REV_COLORS[idx % REV_COLORS.length];
                 return (
                   <React.Fragment key={rev.id}>
                      <Badge className={`${idx === orderedRevs.length - 1 ? color.badge : 'bg-slate-200 text-slate-600'} border-none font-black text-[9px] uppercase`}>
                        {rev.revision}
                      </Badge>
                      {idx < orderedRevs.length - 1 && <span className="text-[10px] font-black text-slate-400">→</span>}
                   </React.Fragment>
                 );
               })}
            </div>
        </div>
      </div>

      <Card className="border border-blue-100 shadow-xl shadow-blue-500/5 bg-white overflow-hidden rounded-3xl">
        <CardHeader className="bg-white p-8 pb-4">
           <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-blue-50 rounded-2xl">
                 <ArrowRightLeft className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                 <h2 className="text-2xl font-black text-blue-950 uppercase tracking-tight">Multi-Revision Audit</h2>
                 <p className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest mt-1">Comparing {orderedRevs[0].quotation_number} Evolution: {orderedRevs.map(r=>r.revision).join(' vs ')}</p>
              </div>
           </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 border-y border-slate-100">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-8 h-12 w-20">SN</TableHead>
                  <TableHead className="text-[9px] font-black uppercase text-slate-400 tracking-widest h-12">Description</TableHead>
                  {orderedRevs.map((rev, idx) => {
                    const color = REV_COLORS[idx % REV_COLORS.length];
                    return (
                      <TableHead key={rev.id} className={`text-[9px] font-black uppercase tracking-widest text-right h-12 ${idx === orderedRevs.length - 1 ? 'bg-blue-50/30' : ''} ${idx === orderedRevs.length - 1 ? color.text : 'text-slate-400'}`}>
                        {rev.revision} Value
                      </TableHead>
                    );
                  })}
                  <TableHead className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-right h-12 px-8">Latest Delta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  const rows: React.ReactNode[] = [];
                  let currentSecMap: {[id: string]: any[]} = {};
                  orderedRevs.forEach(r => currentSecMap[r.id] = []);
                  let currentSecName = "";

                  const pushSubtotalRow = (secMap: {[id: string]: any[]}, sectionName: string) => {
                    const hasAny = Object.values(secMap).some(arr => arr.length > 0);
                    if (hasAny) {
                      const subtotals = orderedRevs.map(r => 
                         (secMap[r.id] || []).reduce((sum, it) => sum + (it.amount || 0), 0)
                      );
                      
                      const lastSub = subtotals[subtotals.length-1];
                      const prevSub = subtotals.length > 1 ? subtotals[subtotals.length-2] : lastSub;
                      const d = lastSub - prevSub;
                      
                      rows.push(
                        <TableRow key={`subtotal-${sectionName}-${rows.length}`} className="bg-slate-50/50 border-b-2 border-slate-100/50">
                          <TableCell colSpan={2} className="text-right py-4 pr-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Section Subtotal:</span>
                          </TableCell>
                          {subtotals.map((sub, i) => (
                             <TableCell key={orderedRevs[i].id} className={`text-right py-4 text-[10px] font-black font-mono ${i === subtotals.length - 1 ? 'text-blue-900 bg-blue-50/10' : 'text-slate-500'}`}>
                               {sub.toLocaleString()}.00
                             </TableCell>
                          ))}
                          <TableCell className={`text-right px-8 py-4 text-xs font-black font-mono ${d > 0 ? 'text-emerald-600' : d < 0 ? 'text-red-600' : 'text-slate-300'}`}>
                            {d === 0 ? '0.00' : `${d > 0 ? '+' : ''}${d.toLocaleString()}.00`}
                          </TableCell>
                        </TableRow>
                      );
                    }
                  };

                  sortedSNs.forEach((sn, idx) => {
                    const itemMap = snMap.get(sn)!;
                    const items = Object.values(itemMap);
                    const isSection = items.some(it => it.is_lot);
                    
                    if (isSection) {
                      pushSubtotalRow(currentSecMap, currentSecName);
                      orderedRevs.forEach(r => currentSecMap[r.id] = []);
                      currentSecName = items.find(it => it.description)?.description || "Unknown Section";

                      rows.push(
                        <TableRow key={sn} className="bg-slate-100/30 border-b border-slate-200/50">
                          <TableCell className="px-8 py-4 text-[10px] font-black text-slate-900">{sn}</TableCell>
                          <TableCell colSpan={orderedRevs.length + 2} className="py-4 text-xs font-black text-blue-900 uppercase tracking-widest">
                             {currentSecName}
                          </TableCell>
                        </TableRow>
                      );
                    } else {
                      orderedRevs.forEach(r => {
                        if (itemMap[r.id]) currentSecMap[r.id].push(itemMap[r.id]);
                      });

                      const lastRev = orderedRevs[orderedRevs.length - 1];
                      const prevRev = orderedRevs.length > 1 ? orderedRevs[orderedRevs.length - 2] : null;
                      
                      const lastItem = itemMap[lastRev.id];
                      const prevItem = prevRev ? itemMap[prevRev.id] : null;
                      
                      const valLast = lastItem?.amount || 0;
                      const valPrev = prevItem?.amount || 0;
                      const diff = valLast - valPrev;
                      
                      const isModified = lastItem && prevItem && (lastItem.description !== prevItem.description || lastItem.qty !== prevItem.qty || lastItem.unit_price !== prevItem.unit_price);
                      const isNew = !prevItem && lastItem;
                      const isRemoved = prevItem && !lastItem;

                      let statusBadge = null;
                      let rowClass = "";
                      if (isNew) {
                        statusBadge = <Badge className="bg-emerald-100 text-emerald-700 border-none font-black text-[8px] px-2 py-0 h-4">NEW</Badge>;
                        rowClass = "bg-emerald-50/30";
                      } else if (isRemoved) {
                        statusBadge = <Badge className="bg-red-100 text-red-700 border-none font-black text-[8px] px-2 py-0 h-4">REMOVED</Badge>;
                        rowClass = "bg-red-50/30 opacity-60";
                      } else if (isModified) {
                        statusBadge = <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[8px] px-2 py-0 h-4">MODIFIED</Badge>;
                        rowClass = "bg-amber-50/20";
                      }

                      rows.push(
                        <TableRow key={sn} className={`${rowClass} transition-colors border-b border-slate-50`}>
                          <TableCell className="px-8 py-5 text-[10px] font-bold text-slate-400 font-mono">{sn}</TableCell>
                          <TableCell className="py-5">
                            <div className="flex flex-col gap-1 max-w-[400px]">
                              <div className="flex items-start gap-2">
                                <span className="text-xs font-bold text-slate-800 uppercase tracking-tighter whitespace-pre-wrap">
                                    {lastItem?.description || items.find(it => it.description)?.description}
                                </span>
                                {statusBadge}
                              </div>
                              {isModified && lastItem.description !== prevItem.description && (
                                <span className="text-[9px] text-slate-400 line-through uppercase whitespace-pre-wrap">Was: {prevItem.description}</span>
                              )}
                            </div>
                          </TableCell>
                          
                          {orderedRevs.map((rev, i) => {
                            const it = itemMap[rev.id];
                            const color = REV_COLORS[i % REV_COLORS.length];
                            return (
                              <TableCell key={rev.id} className={`text-right text-[10px] py-5 ${i === orderedRevs.length - 1 ? `font-black ${color.text} ${color.bg}/20 shadow-inner` : `font-bold ${color.text} opacity-70`}`}>
                                {it ? `${(it.amount || 0).toLocaleString('en-US')}.00` : '-'}
                              </TableCell>
                            );
                          })}

                          <TableCell className={`text-right px-8 py-5 text-xs font-black font-mono ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-600' : 'text-slate-300'}`}>
                            {diff === 0 ? '0.00' : `${diff > 0 ? '+' : ''}${diff.toLocaleString()}.00`}
                          </TableCell>
                        </TableRow>
                      );
                    }

                    if (idx === sortedSNs.length - 1) {
                      pushSubtotalRow(currentSecMap, currentSecName);
                    }
                  });

                  return rows;
                })()}
              </TableBody>
            </Table>
          </div>

          <div className="p-12 bg-slate-50/50 border-t border-slate-100">
             <div className={`grid grid-cols-${Math.min(orderedRevs.length, 4)} gap-8`}>
                {orderedRevs.map((rev, idx) => (
                  <div key={rev.id}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{rev.revision} Value</p>
                    <p className={`text-xl font-black tracking-tighter ${idx === orderedRevs.length - 1 ? 'text-blue-600' : 'text-slate-800'}`}>
                      SAR {(rev.total_amount || 0).toLocaleString()}.00
                    </p>
                    {idx > 0 && (
                      <p className={`text-[9px] font-bold mt-1 ${(rev.total_amount - orderedRevs[idx-1].total_amount) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {(rev.total_amount - orderedRevs[idx-1].total_amount) >= 0 ? '+' : ''}{(rev.total_amount - orderedRevs[idx-1].total_amount).toLocaleString()}.00 vs {orderedRevs[idx-1].revision}
                      </p>
                    )}
                  </div>
                ))}
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// --- QUOTATIONS SUB-MODULE ---
const QuotationDetails = ({ id, onBack, onEdit, onRevise, shouldPrint, onApprove }: { id: number, onBack: () => void, onEdit: (id: number) => void, onRevise: (id: number) => void, shouldPrint?: boolean, onApprove?: () => void }) => {
  const [quotation, setQuotation] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/quotations/${id}`).then(res => res.json()),
      fetch('/api/company-details').then(res => res.json())
    ]).then(([quoteData, companyData]) => {
      setQuotation(quoteData);
      if (Array.isArray(companyData) && companyData.length > 0) {
        setCompany(companyData[0]);
      } else if (companyData && !Array.isArray(companyData)) {
        setCompany(companyData);
      }
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!loading && quotation && company && shouldPrint) {
      const timer = setTimeout(() => {
        generatePDF();
      }, 500); 
      return () => clearTimeout(timer);
    }
  }, [loading, quotation, company, shouldPrint]);

  const generatePDF = () => {
    if (!quotation || !company) return;
    
    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    const drawHeader = (d: jsPDF) => {
        // Main Box for header and details
        d.setDrawColor(0);
        d.setLineWidth(0.4);
        d.rect(margin, 10, pageWidth - margin * 2, 85, 'S'); 

        // Company Details (Left)
        d.setFontSize(9);
        d.setFont('helvetica', 'bold');
        d.setTextColor(0);
        d.text((company?.name || 'AYFA INTERNATIONAL COMPANY').toUpperCase(), margin + 3, 20);
        
        d.setFontSize(8);
        d.setFont('helvetica', 'bold');
        d.text(`CR: ${company?.cr_number || '1010992376'}`, margin + 3, 25);
        d.text(`Vat: ${company?.vat_number || '312100807900003'}`, margin + 3, 29);
        d.setFont('helvetica', 'normal');
        d.text(`${company?.address || '6644 AL Ahsa st, Malaz, Riyadh, 12812'}`, margin + 3, 33);
        d.text(`Kingdom of Saudi Arabia`, margin + 3, 37);
        d.text(`${company?.email || 'info@nikkenmoller.com'}`, margin + 3, 41);
        d.text(`${company?.website || 'www.nikkenmoller.com'} | Tel: ${company?.phone || '+966-55 410 6103'}`, margin + 3, 45);

        // Logo (Right)
        if (company?.logo_url) {
          try {
            if (company.logo_url.startsWith('data:image')) {
              d.addImage(company.logo_url, 'PNG', pageWidth - margin - 45, 12, 40, 18);
            }
          } catch (e) {}
        }

        // Horizontal Separator
        d.line(margin, 50, pageWidth - margin, 50);

        // Details within the same box
        d.setFont('helvetica', 'bold');
        d.setFontSize(8);
        
        // Left Column of Meta
        d.text('To:', margin + 3, 58);
        d.text('Attn:', margin + 3, 65);
        d.text('Address:', margin + 3, 72);
        d.text('Project:', margin + 3, 84);
        d.text('Email:', margin + 3, 91);

        d.setFont('helvetica', 'normal');
        d.text(quotation.customer_name || 'ATS TRAVELS', margin + 25, 58);
        d.text(quotation.contact_person || 'MR.SALEEM WAWDA, GENERAL MANAGER', margin + 25, 65);
        const addr = quotation.address || 'office 39, First Floor-Localizer mall, Ablaziz Road, Thalia Street Olaya, Riyadh';
        const addrLines = d.splitTextToSize(addr, 70);
        d.text(addrLines, margin + 25, 72);
        d.text(quotation.project_name || 'ATS Office Interior Fit out', margin + 25, 84);
        d.setTextColor(0, 0, 255);
        d.text(quotation.customer_email || 'Salim@travelsats.com', margin + 25, 91);
        d.setTextColor(0);

        // Vertical split line
        d.line(pageWidth / 2 - 5, 50, pageWidth / 2 - 5, 95);

        const rCol = pageWidth / 2 ;
        d.setFont('helvetica', 'bold');
        d.text('Date:', rCol, 58);
        d.text('Quotation:', rCol, 65);
        d.text('Customer ID:', rCol, 72);
        d.text('Valid Until:', rCol, 79);
        d.text('Revision:', rCol, 86);

        d.setFont('helvetica', 'normal');
        d.text(new Date(quotation.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase().replace(/ /g, ' - '), rCol + 30, 58);
        d.text(quotation.quotation_number || '1784', rCol + 30, 65);
        d.text(String(quotation.customer_id || '151 / 2024'), rCol + 30, 72);
        const validUntilDate = quotation.valid_until ? new Date(quotation.valid_until) : new Date(new Date(quotation.date).getTime() + 30*24*60*60*1000);
        d.text(validUntilDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase().replace(/ /g, ' - '), rCol + 30, 79);
        d.text(quotation.revision || '5 A', rCol + 30, 86);
    };

    const drawFooter = (d: jsPDF, pageNum: number, totalPages: number) => {
        d.setDrawColor(200);
        d.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
        d.setFontSize(7);
        d.setFont('helvetica', 'bold');
        d.setTextColor(0);
        d.text(`www.nikkenmoller.com`, margin, pageHeight - 10);
        d.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        d.text(`CR: 1010992376`, pageWidth / 2, pageHeight - 5, { align: 'center' });
        d.text(`info@nikkenmoller.com`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    };

    const numberToWords = (num: number) => {
      const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
      const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      const scales = ['', 'Thousand', 'Million', 'Billion'];

      const chunk = (n: number): string => {
        let str = '';
        if (n >= 100) {
          str += units[Math.floor(n / 100)] + ' Hundred ';
          n %= 100;
          if (n > 0) str += 'And ';
        }
        if (n >= 20) {
          str += tens[Math.floor(n / 10)] + ' ';
          n %= 10;
        }
        if (n > 0) str += units[n] + ' ';
        return str.trim();
      };

      if (num === 0) return 'Zero';
      let words = '';
      let scaleIdx = 0;
      let integerPart = Math.floor(num);

      while (integerPart > 0) {
        const c = integerPart % 1000;
        if (c > 0) {
          const s = scales[scaleIdx];
          words = chunk(c) + (s ? ' ' + s : '') + (words ? ' ' + words : '');
        }
        integerPart = Math.floor(integerPart / 1000);
        scaleIdx++;
      }
      return words.trim();
    };

    drawHeader(doc);
    let yPos = 100;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Quotation', pageWidth / 2, yPos, { align: 'center' });
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - 12, yPos + 1.5, pageWidth / 2 + 12, yPos + 1.5);
    
    yPos += 12;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Dear Sir,', margin, yPos);
    yPos += 5;
    doc.text('We would like to take this opportunity to thank you for inviting us to quote for the above mentioned project.', margin, yPos);
    yPos += 5;
    doc.text('Please find below our best offer prices for the same', margin, yPos);
    yPos += 10;

    const sections: any[] = [];
    let currentSection: any = null;
    (quotation.items || []).forEach((it: any) => {
      if (it.is_lot) {
        currentSection = { sn: it.sn, title: it.description, items: [], total: it.amount || 0 };
        sections.push(currentSection);
      } else if (currentSection) {
        currentSection.items.push(it);
      }
    });

    const summaryRows = sections.map(sec => [
      sec.sn, 
      sec.title.toUpperCase(), 
      '1', 
      'Item', 
      (sec.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    ]);

    autoTable(doc, {
      startY: yPos,
      margin: { left: margin, right: margin },
      head: [[{ content: 'PROJECT SUMMARY', styles: { halign: 'left' } }, { content: '', colSpan: 3 }, { content: 'Saudi Riyal', styles: { halign: 'right' } }]],
      body: summaryRows,
      theme: 'grid',
      headStyles: { fillColor: [200, 200, 200], textColor: 0, fontStyle: 'bold', fontSize: 10 },
      styles: { fontSize: 8, fontStyle: 'bold', cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 15 }, 2: { cellWidth: 15, halign: 'center' }, 3: { cellWidth: 15, halign: 'center' }, 4: { halign: 'right' } }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 5;
    
    const drawTotalLine = (label: string, value: string, y: number) => {
      doc.setLineWidth(0.3);
      doc.setDrawColor(0);
      doc.rect(margin, y, pageWidth - margin * 2, 8, 'S');
      doc.setFont('helvetica', 'bold');
      doc.text(label, pageWidth / 2, y + 5, { align: 'center' });
      doc.text(value, pageWidth - margin - 5, y + 5, { align: 'right' });
    };

    const totalVal = quotation.total_amount || 0;
    const taxVal = quotation.tax_amount || 0;
    const discountVal = quotation.discount || 0;
    const afterDiscountVal = totalVal - discountVal;

    drawTotalLine('Total Amount', totalVal.toLocaleString(undefined, { minimumFractionDigits: 2 }), currentY);
    drawTotalLine(`Special Discount - ${quotation.revision || '1'}.`, discountVal.toLocaleString(undefined, { minimumFractionDigits: 2 }), currentY + 8);
    drawTotalLine('After Discount', afterDiscountVal.toLocaleString(undefined, { minimumFractionDigits: 2 }), currentY + 16);
    
    currentY += 24;
    doc.setLineWidth(0.3);
    doc.rect(margin, currentY, pageWidth - margin * 2, 8, 'S');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`Project Value Amount in words: ${numberToWords(Math.round(afterDiscountVal))} - Saudi Riyal Only`, margin + 3, currentY + 5);
    
    sections.forEach((sec) => {
      doc.addPage();
      drawHeader(doc);
      
      let secY = 100;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(200, 200, 200);
      doc.rect(margin, secY - 5, pageWidth - margin * 2, 8, 'F');
      doc.setDrawColor(0);
      doc.rect(margin, secY - 5, pageWidth - margin * 2, 8, 'S');
      doc.text(`${sec.sn} ${sec.title.toUpperCase()}`, margin + 2, secY);
      
      const itemRows = sec.items.map((it: any) => {
        const changeStatus = getChangeStatus(it);
        const marker = changeStatus === 'new' ? '[*]' : changeStatus === 'edited' ? '[#]' : '';
        return [
          it.sn,
          '', // Image
          '', // Sub Category
          `${it.description} ${marker}`,
          it.unit,
          it.qty,
          (it.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
          (it.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })
        ];
      });

      autoTable(doc, {
        startY: secY + 5,
        margin: { left: margin, right: margin },
        head: [['S/N', 'Image', 'Sub Category', 'Description', 'UNIT', 'Qty', 'Unit Price', 'Amount']],
        body: [...itemRows, [
          { content: `SUB TOTAL FOR ${sec.title.toUpperCase()}`, colSpan: 7, styles: { halign: 'right', fontStyle: 'bold' } }, 
          { content: (sec.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }), styles: { fontStyle: 'bold', halign: 'right' } }
        ]],
        theme: 'grid',
        headStyles: { fillColor: [200, 200, 200], textColor: 0, fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 7, cellPadding: 2 },
        columnStyles: { 
          0: { cellWidth: 10 }, 
          1: { cellWidth: 15 }, 
          2: { cellWidth: 20 }, 
          4: { cellWidth: 12, halign: 'center' }, 
          5: { cellWidth: 10, halign: 'center' }, 
          6: { cellWidth: 20, halign: 'right' }, 
          7: { cellWidth: 22, halign: 'right' } 
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 3) {
            const it = sec.items[data.row.index];
            if (it && getChangeStatus(it)) {
              data.cell.styles.textColor = [220, 0, 0];
            }
          }
        }
      });
    });

    // Final Page for Terms and Notes
    doc.addPage();
    drawHeader(doc);
    let finalY = 100;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Terms & Conditions:', margin, finalY);
    doc.setFont('helvetica', 'normal');
    const terms = quotation.terms_and_conditions || `Quantities are limited to the above, and the supplier reserves the right to change in case of any changes by the Client.
Site Access and Permission for Demolition and Reconstruction from the concerned parties
Duration of the project: Within 65 days from the date of P.O. & receiving of advance payment
Payment: 50% advance and 40 % During Works & 10 % Completion
Contact Person : +966 55 410 6103`;
    const termLines = doc.splitTextToSize(terms, pageWidth - margin * 2);
    doc.text(termLines, margin, finalY + 6);
    
    finalY += (termLines.length * 4) + 15;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', margin, finalY);
    doc.setFont('helvetica', 'normal');
    const notes = quotation.notes || `1. Note: Include this quote existing FCU(Indoor AC unit) service & re Install, Realocating existing GI Duct as per the office layout
2. Not Included: IT Switching, Wireless, Floor Mount Screen, Intractive Display, Realocation of exist IT From old to new office, IP telephonic & Biometric /Attendence Device.
3. A deviation of 10% may happen according to site conditions
4. Electrical Equipment Brand : Riyadh Cable, Hitech Floor Box &Legrand ?Schnider DB Unit`;
    const noteLines = doc.splitTextToSize(notes, pageWidth - margin * 2);
    doc.text(noteLines, margin, finalY + 6);

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        drawFooter(doc, i, totalPages);
    }

    doc.save(`Quotation_${quotation.quotation_number}.pdf`);
    toast.success('Quote PDF Exported Successfully');
  };

  const approveAndConvert = async () => {
    console.log('Approve and Convert initiated (Detail View)');
    if (!confirm(`Are you sure you want to Approve Proposal ${quotation.quotation_number} and Transfer to Sales Orders?`)) {
      console.log('Approval cancelled by user');
      return;
    }
    
    const loadingToast = toast.loading('Processing approval and generating sales order...');
    try {
      const res = await fetch(`/api/quotations/${id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_number: `SO-${quotation.quotation_number.replace(/-/g, '')}`,
          date: new Date().toISOString().split('T')[0]
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Conversion failed');
      
      toast.success('Proposal Approved and Sales Order Generated', { id: loadingToast });
      if (onApprove) onApprove();
      onBack();
    } catch (err: any) {
      console.error('Approve and Convert error:', err);
      toast.error(err.message || 'An unexpected error occurred', { id: loadingToast });
    }
  };

  if (loading) return <div className="h-64 flex items-center justify-center text-blue-400 font-mono text-xs uppercase tracking-widest animate-pulse">Loading Proposal Archive...</div>;
  if (!quotation) return <div className="p-12 text-center text-blue-400 font-bold uppercase tracking-widest">Document Not Found</div>;

  // Comparison logic for Revision Markers
  const getChangeStatus = (item: any) => {
    if (!quotation.previousItems) return null;
    
    // Find matching item by SN (or description if SN is not enough)
    const prevItem = quotation.previousItems.find((p: any) => p.sn === item.sn);
    
    if (!prevItem) return 'new';
    
    const isEdited = 
      prevItem.description !== item.description || 
      prevItem.qty !== item.qty || 
      prevItem.unit_price !== item.unit_price ||
      prevItem.unit !== item.unit;
      
    if (isEdited) return 'edited';
    return null;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'Approved':
      case 'SalesOrder': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-bold text-[10px] uppercase tracking-widest shadow-sm">APPROVED</Badge>;
      case 'draft': return <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-bold text-[10px] uppercase tracking-widest">DRAFT</Badge>;
      case 'sent': return <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50 border-none font-bold text-[10px] uppercase tracking-widest">SENT</Badge>;
      case 'revised': return <Badge className="bg-amber-50 text-amber-600 hover:bg-amber-50 border-none font-bold text-[10px] uppercase tracking-widest">REVISED</Badge>;
      case 'open': return <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50 border border-blue-100 font-black text-[9px] uppercase tracking-widest px-2">OPEN</Badge>;
      case 'closed': return <Badge className="bg-slate-50 text-slate-500 hover:bg-slate-50 border border-slate-100 font-black text-[9px] uppercase tracking-widest px-2">CLOSED</Badge>;
      default: return <Badge variant="outline" className="text-[10px] uppercase tracking-widest">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={onBack} className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-800">
          ← Back to Registry
        </Button>
        <div className="flex gap-2">
          {quotation.status !== 'Approved' && quotation.status !== 'SalesOrder' && quotation.status !== 'confirmed' && (
            <Button onClick={approveAndConvert} className="h-9 px-6 text-[10px] font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md">
              <CheckCircle2 className="mr-2 h-3.5 w-3.5" /> Approve
            </Button>
          )}
          <Button onClick={generatePDF} className="h-9 px-6 text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white rounded-xl shadow-md print:hidden">
            <Download className="mr-2 h-3.5 w-3.5" /> Download PDF
          </Button>
        </div>
      </div>

      <Card className="border border-blue-100 shadow-sm bg-white overflow-hidden rounded-2xl print:border-none print:shadow-none">
        <CardHeader className="bg-blue-50/50 border-b border-blue-100 p-8 print:bg-white print:p-0 print:pb-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="mb-3 print:hidden">{getStatusBadge(quotation.status)}</div>
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
        <CardContent className="p-8 print:p-0 print:pt-8">
          <div className="grid grid-cols-2 gap-12 mb-12">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 pb-2">Client Details</h3>
              <div className="space-y-1">
                <p className="text-base font-black text-slate-800 uppercase">{quotation.customer_name}</p>
                <div className="space-y-1 mt-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-tight flex gap-2">
                    <span className="text-blue-500">PROJECT:</span>
                    <span>{quotation.project_name}</span>
                  </p>
                  {quotation.description && (
                    <p className="text-xs font-semibold text-slate-400 whitespace-pre-wrap leading-relaxed mt-2 border-l-2 border-slate-100 pl-3 italic">
                      {quotation.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 pb-2">Reference Info</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revision:</span>
                  <span className="text-[10px] font-black text-slate-800 uppercase">{quotation.revision}</span>
                </div>
                {quotation.previousItems && (
                  <div className="flex justify-between">
                    <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">Note:</span>
                    <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">Red text indicates revised or new items</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Table>
            <TableHeader className="bg-slate-50 print:bg-slate-100">
              <TableRow className="border-none">
                <TableHead className="text-[9px] font-black uppercase text-slate-400 tracking-widest">SN</TableHead>
                <TableHead className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-center print:hidden">IMG</TableHead>
                <TableHead className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Description</TableHead>
                <TableHead className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-center">Unit</TableHead>
                <TableHead className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-center">Qty</TableHead>
                <TableHead className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-right">Rate</TableHead>
                <TableHead className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                const rows: React.ReactNode[] = [];
                let currentSectionItems: any[] = [];
                let currentSectionName = "";

                const pushSubtotalRow = (items: any[], sectionName: string) => {
                  if (items.length > 0) {
                    const subtotal = items.reduce((sum, it) => sum + (it.amount || 0), 0);
                    rows.push(
                      <TableRow key={`subtotal-${sectionName}-${rows.length}`} className="bg-slate-50/30 border-b-2 border-slate-100">
                        <TableCell colSpan={quotation.previousItems ? 5 : 6} className="text-right py-3 pr-4 sr-only print:not-sr-only">
                           {/* Adjust colspan for print hidden columns */}
                        </TableCell>
                        <TableCell colSpan={6} className="text-right py-3 pr-4 print:hidden">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Section Subtotal:</span>
                        </TableCell>
                        <TableCell className="text-right py-3 text-xs font-black text-blue-900 font-mono">
                          {subtotal.toLocaleString()}.00
                        </TableCell>
                      </TableRow>
                    );
                  }
                };

                quotation.items?.forEach((it: any, idx: number) => {
                  const changeStatus = getChangeStatus(it);
                  const isRevised = changeStatus !== null;
                  const itemColorClass = isRevised ? 'text-red-600' : 'text-slate-800';
                  const snColorClass = isRevised ? 'text-red-400' : 'text-slate-400';

                  if (it.is_lot) {
                    pushSubtotalRow(currentSectionItems, currentSectionName);
                    currentSectionItems = [];
                    currentSectionName = it.description;
                    
                    rows.push(
                      <TableRow key={it.id} className="bg-slate-100/50 font-black border-slate-200">
                        <TableCell className={`text-[10px] font-bold font-mono ${snColorClass}`}>{it.sn}</TableCell>
                        <TableCell className="p-2 text-center print:hidden"></TableCell>
                        <TableCell colSpan={5} className={`text-xs font-black uppercase tracking-widest py-4 ${isRevised ? 'text-red-700' : 'text-blue-950'}`}>
                          {it.description}
                          {changeStatus === 'new' && <span className="ml-2 text-[8px] bg-red-100 text-red-600 px-1 rounded print:hidden">NEW</span>}
                        </TableCell>
                      </TableRow>
                    );
                  } else {
                    currentSectionItems.push(it);
                    rows.push(
                      <TableRow key={it.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <TableCell className={`text-[10px] font-bold font-mono pl-8 ${snColorClass}`}>{it.sn}</TableCell>
                        <TableCell className="p-2 text-center print:hidden">
                          {it.image && (
                            <div className="w-10 h-10 rounded border border-slate-100 overflow-hidden mx-auto bg-white shadow-sm flex items-center justify-center">
                              <img src={it.image} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className={`text-xs font-bold uppercase ${itemColorClass} max-w-[600px] py-4`}>
                          <div className="whitespace-pre-wrap leading-relaxed">
                            {it.description}
                            {changeStatus === 'new' && <span className="ml-2 text-[8px] font-black text-red-500">[*]</span>}
                            {changeStatus === 'edited' && <span className="ml-2 text-[8px] font-black text-red-500">[#]</span>}
                          </div>
                        </TableCell>
                        <TableCell className={`text-center text-[10px] font-bold uppercase ${isRevised ? 'text-red-500' : 'text-slate-500'}`}>{it.unit}</TableCell>
                        <TableCell className={`text-center text-[10px] font-bold ${isRevised ? 'text-red-600' : 'text-slate-800'}`}>{it.qty}</TableCell>
                        <TableCell className={`text-right text-[10px] font-bold ${isRevised ? 'text-red-600' : 'text-slate-800'}`}>{(it.unit_price || 0).toLocaleString('en-US')}.00</TableCell>
                        <TableCell className={`text-right text-xs font-bold font-mono ${isRevised ? 'text-red-700' : 'text-slate-900'}`}>{(it.amount || 0).toLocaleString('en-US')}.00</TableCell>
                      </TableRow>
                    );
                  }

                  if (idx === quotation.items.length - 1) {
                    pushSubtotalRow(currentSectionItems, currentSectionName);
                  }
                });

                return rows;
              })()}
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
      
      <div className="hidden print:block mt-12 p-8 border-t border-slate-100">
        <p className="text-[10px] font-bold text-slate-400 uppercase italic">
          * Red color or markers ([*] New, [#] Revised) identify entries that differ from the previous proposal revision.
        </p>
      </div>
    </div>
  );
};

const QuotationsView = ({ initialParams, draftMode = false }: { initialParams?: URLSearchParams | null, draftMode?: boolean }) => {
  const [view, setView] = useState<'list' | 'create' | 'edit' | 'details' | 'compare'>(
    initialParams?.get('view') === 'details' && initialParams?.get('id') ? 'details' : 'list'
  );
  const [selectedId, setSelectedId] = useState<number | null>(
    initialParams?.get('id') ? Number(initialParams.get('id')) : null
  );
  const [shouldPrint, setShouldPrint] = useState(false);
  const [compareIds, setCompareIds] = useState<number[] | null>(null);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedQuotes, setExpandedQuotes] = useState<string[]>([]);

  const toggleExpand = (quoteNumber: string) => {
    setExpandedQuotes(prev => 
      prev.includes(quoteNumber) 
        ? prev.filter(q => q !== quoteNumber) 
        : [...prev, quoteNumber]
    );
  };

  // Tab change handler for QuotationsView
  const handleViewChange = (newView: 'list' | 'create' | 'edit' | 'details' | 'compare') => {
    setView(newView);
    if (newView === 'list') {
      fetchQuotations();
    }
  };

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

  const approveAndConvert = async (q: any) => {
    console.log('Approve and Convert initiated for:', q);
    if (!confirm(`Are you sure you want to Approve Proposal ${q.quotation_number} and Transfer to Sales Orders?`)) {
      console.log('Approval cancelled by user');
      return false;
    }
    
    const loadingToast = toast.loading('Processing approval and generating sales order...');
    try {
      const res = await fetch(`/api/quotations/${q.id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_number: `SO-${q.quotation_number.replace(/-/g, '')}`,
          date: new Date().toISOString().split('T')[0]
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Conversion failed');
      
      toast.success('Proposal Approved and Sales Order Generated', { id: loadingToast });
      fetchQuotations();
      return true;
    } catch (err: any) {
      console.error('Approve and Convert error:', err);
      toast.error(err.message || 'An unexpected error occurred', { id: loadingToast });
      return false;
    }
  };

  const reviseQuotation = async (id: number) => {
    if (!confirm('This will create a new editable revision based on this document. Proceed?')) return;
    try {
      const res = await fetch(`/api/quotations/${id}/revise`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Revision failed');
      
      toast.success(`Successfully created revision ${data.revision}`);
      setSelectedId(data.id);
      setView('edit');
    } catch (err: any) {
      toast.error(err.message);
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
        onBack={() => { setView('list'); setShouldPrint(false); }} 
        onEdit={() => setView('edit')} 
        onRevise={reviseQuotation}
        onApprove={fetchQuotations}
        shouldPrint={shouldPrint}
      />
    );
  }

  if (view === 'compare' && compareIds) {
    return (
      <RevisionComparison 
        ids={compareIds} 
        onBack={() => { setView('list'); setCompareIds(null); }} 
      />
    );
  }

  if (loading) return <div className="h-64 flex items-center justify-center text-slate-400 font-mono text-xs uppercase tracking-widest animate-pulse">Loading Quotations...</div>;

  const filteredQuotations = draftMode 
    ? quotations.filter(q => q.status === 'draft')
    : quotations.filter(q => q.status !== 'draft');

  // Group quotations by number
  const groupedData = filteredQuotations.reduce((acc: any, q: any) => {
    if (!acc[q.quotation_number]) acc[q.quotation_number] = [];
    acc[q.quotation_number].push(q);
    return acc;
  }, {});

  const groupedList = Object.keys(groupedData).map(number => {
    const sortedRevisions = groupedData[number].sort((a: any, b: any) => {
      const getRevNum = (rev: string) => {
        const match = rev?.match(/R(\d+)/i);
        return match ? parseInt(match[1]) : 0;
      };
      return getRevNum(b.revision) - getRevNum(a.revision);
    });
    return {
      number,
      latest: sortedRevisions[0],
      revisions: sortedRevisions
    };
  }).sort((a, b) => b.latest.id - a.latest.id); // Sort by latest ID overall

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'Approved':
      case 'SalesOrder': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-bold text-[10px] uppercase tracking-widest shadow-sm">APPROVED</Badge>;
      case 'draft': return <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-bold text-[10px] uppercase tracking-widest">DRAFT</Badge>;
      case 'sent': return <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50 border-none font-bold text-[10px] uppercase tracking-widest">SENT</Badge>;
      case 'revised': return <Badge className="bg-amber-50 text-amber-600 hover:bg-amber-50 border-none font-bold text-[10px] uppercase tracking-widest">REVISED</Badge>;
      case 'open': return <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50 border border-blue-100 font-black text-[9px] uppercase tracking-widest px-2">OPEN</Badge>;
      case 'closed': return <Badge className="bg-slate-50 text-slate-500 hover:bg-slate-50 border border-slate-100 font-black text-[9px] uppercase tracking-widest px-2">CLOSED</Badge>;
      default: return <Badge variant="outline" className="text-[10px] uppercase tracking-widest">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black tracking-tight text-blue-950 uppercase px-1">
          {draftMode ? 'Draft Quotations' : 'Project Quotations'}
        </h2>
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
                <TableHead className="font-black text-blue-700/60 text-[10px] h-12 px-6 uppercase tracking-[0.1em]">Revision</TableHead>
                <TableHead className="font-black text-blue-700/60 text-[10px] h-12 px-6 uppercase tracking-[0.1em]">Date</TableHead>
                <TableHead className="font-black text-blue-700/60 text-[10px] h-12 px-6 uppercase tracking-[0.1em] text-right">Value (SAR)</TableHead>
                <TableHead className="font-black text-blue-700/60 text-[10px] h-12 px-6 uppercase tracking-[0.1em] text-center">Status</TableHead>
                <TableHead className="h-12 px-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-blue-300 font-mono text-[10px] uppercase tracking-[0.2em]">{draftMode ? 'No Draft Quotations Found' : 'No Quotations found'}</TableCell>
                </TableRow>
              ) : groupedList.map((group) => {
                const q = group.latest;
                const isExpanded = expandedQuotes.includes(group.number);
                
                return (
                  <React.Fragment key={group.number}>
                    <TableRow className={`${isExpanded ? 'bg-blue-50/20' : 'hover:bg-blue-50/40'} border-b border-blue-50/50 transition-colors`}>
                      <TableCell className="px-6 py-4 font-black text-blue-600 text-xs text-nowrap">
                        <div className="flex items-center gap-2">
                          {group.revisions.length > 1 && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-blue-400 hover:text-blue-600"
                              onClick={() => toggleExpand(group.number)}
                            >
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                          )}
                          {q.quotation_number}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-black text-blue-950 text-xs uppercase">{q.customer_name}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-blue-600/60 font-bold truncate max-w-[180px] uppercase">{q.project_name}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="w-fit text-[9px] font-black border-blue-100 text-blue-600 bg-blue-50/30 px-2 py-0.5 rounded-full ring-1 ring-blue-200/50">
                            {q.revision || 'R1'}
                          </Badge>
                          {group.revisions.length > 1 && (
                            <span className="text-[10px] font-black text-slate-300">+{group.revisions.length - 1} more</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-blue-600 text-xs font-bold">{q.date}</TableCell>
                      <TableCell className="px-6 py-4 text-right font-black text-blue-950 text-xs">{(q.total_amount || 0).toLocaleString()}.00</TableCell>
                      <TableCell className="px-6 py-4 text-center">{getStatusBadge(q.status)}</TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:text-blue-700">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          } />
                          <DropdownMenuContent align="end" className="w-48 bg-white rounded-xl shadow-xl border-blue-50">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest text-blue-400 px-4 pt-3">Latest Revision Ops</DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-blue-50" />
                              <DropdownMenuItem onClick={() => { setSelectedId(q.id); setView('details'); }} className="text-[11px] font-bold py-3 uppercase tracking-wide px-4 focus:bg-blue-50 focus:text-blue-700 cursor-pointer"><FileText className="mr-2 h-3.5 w-3.5 text-blue-500" /> Full Detailed View</DropdownMenuItem>
                              {(q.status !== 'Approved' && q.status !== 'SalesOrder' && q.status !== 'confirmed') && (
                                <DropdownMenuItem onClick={() => { setSelectedId(q.id); setView('edit'); }} className="text-[11px] font-bold py-3 uppercase tracking-wide px-4 focus:bg-blue-50 focus:text-blue-700 cursor-pointer"><ExternalLink className="mr-2 h-3.5 w-3.5 text-blue-600" /> Edit Current Revision</DropdownMenuItem>
                              )}
                              {(q.status !== 'Approved' && q.status !== 'SalesOrder' && q.status !== 'confirmed') && (
                                <DropdownMenuItem onClick={() => approveAndConvert(q)} className="text-[11px] font-bold py-3 uppercase tracking-wide px-4 focus:bg-emerald-50 focus:text-emerald-700 cursor-pointer text-emerald-600">
                                  <CheckCircle2 className="mr-2 h-3.5 w-3.5" /> Approve Latest
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => fetchRevisions(q.id)} className="text-[11px] font-bold py-3 uppercase tracking-wide px-4 focus:bg-blue-50 focus:text-blue-700 cursor-pointer"><Clock className="mr-2 h-3.5 w-3.5 text-blue-600" /> Revision History</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setSelectedId(q.id); setView('details'); setShouldPrint(true); }} className="text-[11px] font-bold py-3 uppercase tracking-wide px-4 focus:bg-blue-50 focus:text-blue-700 cursor-pointer"><Download className="mr-2 h-3.5 w-3.5 text-blue-500" /> Download PDF</DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-blue-50" />
                              <DropdownMenuItem onClick={() => deleteQuotation(q.id)} className="text-[11px] font-bold py-3 uppercase tracking-wide px-4 focus:bg-blue-50 text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer"><Trash2 className="mr-2 h-3.5 w-3.5" /> Delete Latest</DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    
                    {isExpanded && group.revisions.slice(1).map((rev: any) => (
                      <TableRow key={rev.id} className="bg-slate-50/20 border-b border-blue-50/30 transition-colors animate-in fade-in slide-in-from-top-1 duration-200">
                        <TableCell className="px-6 py-3 pl-16 font-medium text-slate-400 text-[11px] text-nowrap">
                          {rev.quotation_number}
                        </TableCell>
                        <TableCell className="px-6 py-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Legacy Revision</span>
                        </TableCell>
                        <TableCell className="px-6 py-3">
                          <Badge variant="ghost" className="w-fit text-[9px] font-black border-slate-100 text-slate-400 bg-slate-50/50 px-2 py-0.5 rounded-full opacity-60">
                            {rev.revision}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-3 text-slate-400 text-[11px] font-medium">{rev.date}</TableCell>
                        <TableCell className="px-6 py-3 text-right font-bold text-slate-400 text-[11px]">{(rev.total_amount || 0).toLocaleString()}.00</TableCell>
                        <TableCell className="px-6 py-3 text-center">{getStatusBadge(rev.status)}</TableCell>
                        <TableCell className="px-6 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger render={
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-blue-600">
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            } />
                            <DropdownMenuContent align="end" className="w-48 bg-white rounded-xl shadow-xl border-blue-50">
                              <DropdownMenuGroup>
                                <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-4 pt-3">Revision Detail Ops</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-blue-50" />
                                <DropdownMenuItem onClick={() => { setSelectedId(rev.id); setView('details'); }} className="text-[11px] font-bold py-3 uppercase tracking-wide px-4 focus:bg-blue-50 focus:text-blue-700 cursor-pointer"><FileText className="mr-2 h-3.5 w-3.5 text-blue-500" /> View Revision</DropdownMenuItem>
                                {(rev.status !== 'Approved' && rev.status !== 'SalesOrder' && rev.status !== 'confirmed') && (
                                  <DropdownMenuItem onClick={() => { setSelectedId(rev.id); setView('edit'); }} className="text-[11px] font-bold py-3 uppercase tracking-wide px-4 focus:bg-blue-50 focus:text-blue-700 cursor-pointer">
                                    <ExternalLink className="mr-2 h-3.5 w-3.5 text-blue-600" /> Edit This Version
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => { setSelectedId(rev.id); setView('details'); setShouldPrint(true); }} className="text-[11px] font-bold py-3 uppercase tracking-wide px-4 focus:bg-blue-50 focus:text-blue-700 cursor-pointer"><Download className="mr-2 h-3.5 w-3.5 text-blue-500" /> Download PDF</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => deleteQuotation(rev.id)} className="text-[11px] font-bold py-3 uppercase tracking-wide px-4 focus:bg-blue-50 text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer"><Trash2 className="mr-2 h-3.5 w-3.5" /> Purge Revision</DropdownMenuItem>
                              </DropdownMenuGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={viewHistoryId !== null} onOpenChange={() => setViewHistoryId(null)}>
        <DialogContent className="sm:max-w-[1000px] bg-white focus:outline-none p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" /> Document Revision History
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <div className="border rounded-xl overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-[9px] font-black uppercase tracking-widest px-4 h-10 w-24">Rev No.</TableHead>
                    <TableHead className="text-[9px] font-black uppercase tracking-widest h-10">Date</TableHead>
                    <TableHead className="text-[9px] font-black uppercase tracking-widest h-10">Project / Description</TableHead>
                    <TableHead className="text-right text-[9px] font-black uppercase tracking-widest h-10">Value (SAR)</TableHead>
                    <TableHead className="text-center text-[9px] font-black uppercase tracking-widest h-10">Status</TableHead>
                    <TableHead className="text-right text-[9px] font-black uppercase tracking-widest h-10 pr-4">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(revisions) && revisions.map((rev) => (
                    <TableRow key={rev.id} className="hover:bg-slate-50 border-b border-slate-50">
                      <TableCell className="font-black text-xs text-slate-800 tracking-tight px-4 py-3">{rev.revision}</TableCell>
                      <TableCell className="text-xs font-bold text-slate-500 py-3">{rev.date}</TableCell>
                      <TableCell className="py-3">
                        <div className="flex flex-col gap-1 max-w-[400px]">
                          <span className="text-xs font-black text-blue-600 uppercase tracking-tight">{rev.project_name || '-'}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase whitespace-pre-wrap leading-tight">{rev.description || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-xs text-slate-800 py-3">{(rev.total_amount || 0).toLocaleString('en-US')}.00</TableCell>
                      <TableCell className="text-center py-3">
                         {getStatusBadge(rev.status)}
                      </TableCell>
                      <TableCell className="text-right pr-4 py-3">
                        <div className="flex justify-end gap-2">
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
                        View
                      </Button>
                      {(rev.status !== 'Approved' && rev.status !== 'SalesOrder' && rev.status !== 'confirmed') && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-[8px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-800"
                          onClick={async () => {
                            const success = await approveAndConvert(rev);
                            if (success) setViewHistoryId(null);
                          }}
                        >
                          Approve
                        </Button>
                      )}
                      {revisions.length > 1 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-[8px] font-black uppercase tracking-widest text-purple-600 hover:text-purple-800"
                          onClick={() => {
                            const idx = revisions.indexOf(rev);
                            const ids = revisions.slice(idx).map((r: any) => r.id);
                            if (ids.length > 1) {
                              setCompareIds(ids);
                              setView('compare');
                              setViewHistoryId(null);
                            } else {
                              toast.info('This is the first revision. Nothing to compare with.');
                            }
                          }}
                        >
                          Compare
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
                  <TableCell className="text-xs font-bold text-slate-800 uppercase tracking-tight max-w-[350px] truncate">{it.description}</TableCell>
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
      case 'confirmed':
      case 'Approved':
      case 'SalesOrder': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-bold text-[10px] uppercase tracking-widest shadow-sm">APPROVED</Badge>;
      case 'draft': return <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-bold text-[10px] uppercase tracking-widest">DRAFT</Badge>;
      case 'sent': return <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50 border-none font-bold text-[10px] uppercase tracking-widest">SENT</Badge>;
      case 'revised': return <Badge className="bg-amber-50 text-amber-600 hover:bg-amber-50 border-none font-bold text-[10px] uppercase tracking-widest">REVISED</Badge>;
      case 'open': return <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50 border border-blue-100 font-black text-[9px] uppercase tracking-widest px-2 shadow-sm">OPEN</Badge>;
      case 'closed': return <Badge className="bg-slate-50 text-slate-500 hover:bg-slate-50 border border-slate-100 font-black text-[9px] uppercase tracking-widest px-2">CLOSED</Badge>;
      default: return <Badge variant="outline" className="text-[10px] uppercase tracking-widest">{status}</Badge>;
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
                  <TableCell className="px-8 py-5 font-black text-blue-600 text-xs text-nowrap font-mono">
                    {order.order_number}
                    {order.revision && (
                      <Badge variant="outline" className="ml-2 text-[8px] font-black border-blue-100 text-blue-600 bg-blue-50/50">
                        {order.revision}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-8 py-5">
                    <span className="font-black text-blue-950 text-xs uppercase tracking-tight">{order.customer_name || 'Generic Client'}</span>
                  </TableCell>
                  <TableCell className="px-8 py-5 text-blue-600 text-xs font-bold uppercase tracking-tighter">{order.date}</TableCell>
                  <TableCell className="px-8 py-5 text-right font-black text-blue-950 text-xs font-mono tracking-tighter">{(order.total_amount || 0).toLocaleString()}.00</TableCell>
                  <TableCell className="px-8 py-5 text-center">{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="px-8 py-5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-400 hover:text-blue-700 transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      } />
                      <DropdownMenuContent align="end" className="w-48 bg-white rounded-xl shadow-xl border-blue-50">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest text-blue-400 px-4 pt-3">Operations</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-blue-50" />
                          <DropdownMenuItem onClick={() => { setSelectedId(order.id); setView('details'); }} className="text-[11px] font-bold py-3 uppercase tracking-wide px-4 focus:bg-blue-50 focus:text-blue-700 cursor-pointer"><FileText className="mr-2 h-3.5 w-3.5 text-blue-500" /> View Documentation</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedId(order.id); setView('edit'); }} className="text-[11px] font-bold py-3 uppercase tracking-wide px-4 focus:bg-blue-50 focus:text-blue-700 cursor-pointer"><ExternalLink className="mr-2 h-3.5 w-3.5 text-blue-600" /> Edit Order</DropdownMenuItem>
                          <DropdownMenuItem className="text-[11px] font-bold py-3 uppercase tracking-wide px-4 focus:bg-blue-50 focus:text-blue-700 cursor-pointer"><CheckCircle2 className="mr-2 h-3.5 w-3.5 text-blue-500" /> Fulfill Logistics</DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-blue-50" />
                          <DropdownMenuItem onClick={() => deleteOrder(order.id)} className="text-[11px] font-bold py-3 uppercase tracking-wide px-4 focus:bg-blue-50 text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer"><Trash2 className="mr-2 h-3.5 w-3.5" /> Delete Order</DropdownMenuItem>
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
          <h2 className="text-xl font-bold tracking-tight text-slate-800 uppercase">{id ? 'Edit Customer' : 'New Customer Registration'}</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{id ? 'Update existing client details' : 'Add a new institutional or retail client to the directory'}</p>
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
                {submitting ? (id ? 'Updating...' : 'Registering...') : (id ? 'Update Customer' : 'Register Customer')}
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
                  <DropdownMenuTrigger render={
                    <Button size="sm" variant="ghost" className="h-8 w-8 rounded-full text-slate-300 hover:text-slate-800 hover:bg-slate-50 transition-all p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  } />
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest text-slate-400">Account Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => { setSelectedId(customer.id); setView('details'); }} className="text-[10px] font-black py-2.5 uppercase tracking-wide text-slate-600">
                        <FileText className="mr-2 h-4 w-4 text-[#2563eb]" /> Full Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setSelectedId(customer.id); setView('edit'); }} className="text-[10px] font-black py-2.5 uppercase tracking-wide text-slate-600">
                        <ExternalLink className="mr-2 h-4 w-4 text-primary" /> Edit Record
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
      {activeTab === 'Draft Quotations' && <QuotationsView initialParams={initialParams} draftMode={true} />}
      {activeTab === 'Sales Orders' && <SalesOrdersView />}
      {activeTab === 'Customers' && <CustomersView />}
    </div>
  );
}

