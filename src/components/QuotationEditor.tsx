import { useState, useEffect } from 'react';
import { Plus, Trash2, Image as ImageIcon, Printer, Save, FileText, Briefcase, PackageCheck, ShoppingCart, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

interface QuotationItem {
  id: string;
  sn: string;
  subCategory?: string;
  description: string;
  unit: string;
  qty: number;
  unitPrice: number;
  amount: number;
  image?: string;
}

interface QuotationSection {
  id: string;
  sn: string;
  title: string;
  items: QuotationItem[];
}

interface ProjectTemplateItem {
    id: number;
    name: string;
    description: string;
    unit: string;
    default_unit_price: number;
    category_id: number;
}

interface CompanyDetails {
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

interface Customer {
  id: number;
  name: string;
  contact_person: string;
  email: string;
  address: string;
  vat_number: string;
}

export default function QuotationEditor({ id }: { id?: string }) {
  const [sections, setSections] = useState<QuotationSection[]>([]);
  const [templateItems, setTemplateItems] = useState<ProjectTemplateItem[]>([]);
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [parentId, setParentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [templateRes, customerRes, companyRes, categoryRes] = await Promise.all([
          fetch('/api/project-template-items'),
          fetch('/api/customers'),
          fetch('/api/company-details'),
          fetch('/api/project-categories')
        ]);

        const safeJson = async (res: Response) => {
          if (!res.ok) {
             const text = await res.text();
             console.error(`Fetch failed with status ${res.status}: ${text.substring(0, 100)}`);
             return [];
          }
          return res.json().catch(() => []);
        };

        const templates = await safeJson(templateRes);
        const customerList = await safeJson(customerRes);
        const companies = await safeJson(companyRes);
        const cats = await safeJson(categoryRes);

        if (Array.isArray(templates)) setTemplateItems(templates);
        if (Array.isArray(customerList)) setCustomers(customerList);
        if (Array.isArray(cats)) setCategories(cats);
        if (Array.isArray(companies) && companies.length > 0) {
          setCompany(companies[0]);
        } else if (companies && !Array.isArray(companies) && companies.name) {
          setCompany(companies as unknown as CompanyDetails);
        }

        if (id) {
          const res = await fetch(`/api/quotations/${id}`);
          if (res.ok) {
            const data = await res.json();
            setQuotationNo(data.quotation_number);
            setDate(data.date);
            setTo(data.customer_name);
            setCustomerId(data.customer_id?.toString() || '');
            setProject(data.project_name);
            setRevision(data.revision || '0');
            setDiscount(data.discount || 0);
            setValidUntil(data.valid_until || '');
            setParentId(data.parent_id);
            
            // Reconstruct sections from items
            const newSections: QuotationSection[] = [];
            let currentSection: QuotationSection | null = null;
            
            if (data.items && Array.isArray(data.items)) {
              data.items.forEach((item: any) => {
                if (item.is_lot) {
                  currentSection = {
                    id: 'sec-' + Math.random().toString(36).substr(2, 9),
                    sn: item.sn,
                    title: item.description,
                    items: []
                  };
                  newSections.push(currentSection);
                } else if (currentSection) {
                  currentSection.items.push({
                    id: 'item-' + Math.random().toString(36).substr(2, 9),
                    sn: item.sn,
                    description: item.description,
                    unit: item.unit,
                    qty: item.qty,
                    unitPrice: item.unit_price,
                    amount: item.amount,
                    image: item.image_url,
                    subCategory: item.sub_category
                  });
                }
              });
            }
            
            if (newSections.length > 0) {
              setSections(newSections);
            } else {
              setSections([
                { id: 'sec-1', sn: '1.0', title: 'PRELIMINARIES & APPROVALS', items: [] },
                { id: 'sec-2', sn: '2.0', title: 'CIVIL WORKS', items: [] }
              ]);
            }
          }
        } else {
          setSections([
            { id: 'sec-1', sn: '1.0', title: 'PRELIMINARIES & APPROVALS', items: [] },
            { id: 'sec-2', sn: '2.0', title: 'CIVIL WORKS', items: [] }
          ]);
        }
      } catch (err) {
        toast.error('Failed to initialize editor');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);
  
  // Extended General Information
  const [to, setTo] = useState('ATS TRAVELS');
  const [attn, setAttn] = useState('MR.SALEEM WAWDA, GENERAL MANAGER');
  const [address, setAddress] = useState('office 39,First Floor-Localizer mall, Ablaziz Road, Thalia Street Olaya, Riyadh');
  const [project, setProject] = useState('ATS Office Interior Fit out');
  const [email, setEmail] = useState('Salim@travelsats.com');
  
  // Document Metadata
  const [quotationNo, setQuotationNo] = useState((Math.floor(Math.random() * 9000) + 1000).toString());
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerId, setCustomerId] = useState('');
  const [validUntil, setValidUntil] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [revision, setRevision] = useState('0');
  const [discount, setDiscount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  const handleCustomerChange = (customerName: string) => {
    setTo(customerName);
    const selected = customers.find(c => c.name === customerName);
    if (selected) {
      setAttn(selected.contact_person || '');
      setAddress(selected.address || '');
      setEmail(selected.email || '');
      setCustomerId(selected.id.toString());
    }
  };

  const addSection = () => {
    const nextNum = sections.length + 1;
    setSections([...sections, {
      id: 'sec-' + Math.random().toString(36).substr(2, 9),
      sn: `${nextNum}.0`,
      title: 'NEW SECTION',
      items: []
    }]);
    toast.success('New section added');
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const updateSection = (id: string, field: keyof QuotationSection, value: any) => {
    setSections(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addItemToSection = (sectionId: string) => {
    setSections(sections.map(sec => {
      if (sec.id === sectionId) {
        const nextItemNum = sec.items.length + 1;
        const itemSn = `${sec.sn.split('.')[0]}.${nextItemNum.toString().padStart(2, '0')}`;
        return {
          ...sec,
          items: [...sec.items, {
            id: 'item-' + Math.random().toString(36).substr(2, 9),
            sn: itemSn,
            subCategory: '',
            description: '',
            unit: 'Item',
            qty: 1,
            unitPrice: 0,
            amount: 0
          }]
        };
      }
      return sec;
    }));
  };

  const addFromTemplate = (template: ProjectTemplateItem, sectionId: string) => {
    setSections(sections.map(sec => {
        if (sec.id === sectionId) {
            const nextItemNum = sec.items.length + 1;
            const itemSn = `${sec.sn.split('.')[0]}.${nextItemNum.toString().padStart(2, '0')}`;
            return {
                ...sec,
                items: [...sec.items, {
                    id: 'item-' + Math.random().toString(36).substr(2, 9),
                    sn: itemSn,
                    subCategory: template.name,
                    description: template.description,
                    unit: template.unit,
                    qty: 1,
                    unitPrice: template.default_unit_price,
                    amount: template.default_unit_price
                }]
            };
        }
        return sec;
    }));
    toast.success(`${template.name} added to section`);
  };

  const removeItem = (sectionId: string, itemId: string) => {
    setSections(sections.map(sec => {
        if (sec.id === sectionId) {
            return { ...sec, items: sec.items.filter(it => it.id !== itemId) };
        }
        return sec;
    }));
  };

  const updateItem = (sectionId: string, itemId: string, field: keyof QuotationItem, value: any) => {
    setSections(sections.map(sec => {
      if (sec.id === sectionId) {
        return {
            ...sec,
            items: sec.items.map(it => {
                if (it.id === itemId) {
                    const updated = { ...it, [field]: value };
                    if (field === 'qty' || field === 'unitPrice') {
                        updated.amount = (updated.qty || 0) * (updated.unitPrice || 0);
                    }
                    return updated;
                }
                return it;
            })
        };
      }
      return sec;
    }));
  };

  const handleFileChange = (sectionId: string, itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      updateItem(sectionId, itemId, 'image', reader.result as string);
      toast.success('Image attached to item');
    };
    reader.readAsDataURL(file);
  };

  const totalAmount = sections.reduce((sum, sec) => 
    sum + sec.items.reduce((secSum, it) => secSum + it.amount, 0), 0
  );
  const afterDiscount = totalAmount - discount;
  const vatAmount = afterDiscount * 0.15;
  const grandTotal = afterDiscount + vatAmount;

  // Amount to words (simplified for SRI)
  const numberToWords = (num: number) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    const convert = (n: number): string => {
        if (n < 10) return ones[n];
        if (n < 20) return teens[n - 10];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
        if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' And ' + convert(n % 100) : '');
        if (n < 1000000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' And ' + convert(n % 1000) : '');
        return '';
    }
    
    return convert(Math.floor(num));
  };

  const amountInWords = `${numberToWords(grandTotal)} - Saudi Riyal Only`;

  const generatePDF = () => {
    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Helper: Draw Header & Company Info
    const drawHeader = (d: jsPDF) => {
        if (company?.logo_url) {
          try {
            if (company.logo_url.startsWith('data:image')) {
              d.addImage(company.logo_url, 'PNG', margin, 10, 30, 15);
            }
          } catch (e) {
            console.error('Error adding logo to PDF:', e);
          }
        } else {
          d.setFontSize(40);
          d.setFont('times', 'italic');
          d.text('M', 130, 31);
          d.setFontSize(14);
          d.setFont('helvetica', 'normal');
          d.text('NIKKEN', 155, 26);
          d.text('MØLLER.', 155, 34);
        }

        d.setFontSize(10);
        d.setFont('helvetica', 'bold');
        d.setTextColor(0);
        d.text((company?.name || 'ACCOUNTING & FIT-OUT').toUpperCase(), margin, 30);
        d.setFont('helvetica', 'normal');
        d.setFontSize(8);
        d.text(`CR: ${company?.cr_number || '1010992376'}`, margin, 34);
        d.text(`Vat: ${company?.vat_number || '312100807900003'}`, margin, 38);
        d.text(`${company?.address || '6644 AL Ahsa st, Malaz'}, ${company?.city || 'Riyadh'}, ${company?.country || 'KSA'}`, margin, 42);
        d.text(company?.email || 'info@nikkenmoller.com', margin, 46);
        d.text(`${company?.website || 'www.nikkenmoller.com'} | Tel: ${company?.phone || '+966-55 410 6103'}`, margin, 50);

        d.setDrawColor(200);
        d.line(margin, 55, pageWidth - margin, 55);
    };

    // Helper: Draw Footer
    const drawFooter = (d: jsPDF, pageNum: number, totalPages: number) => {
        const footY = pageHeight - 10;
        d.setFontSize(8);
        d.setFont('helvetica', 'bold');
        d.setTextColor(100);
        d.text(company?.website || 'www.nikkenmoller.com', margin, footY);
        d.text(`CR: ${company?.cr_number || '1010992376'}`, pageWidth / 2, footY, { align: 'center' });
        d.text(company?.email || 'info@nikkenmoller.com', pageWidth - margin, footY, { align: 'right' });
        d.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, footY - 5, { align: 'center' });
    };

    let yPos = 60;

    // --- PAGE 1: PROJECT SUMMARY ---
    dMeta(doc, yPos); // Meta info helper
    
    yPos += 38;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Quotation', pageWidth / 2, yPos, { align: 'center' });
    doc.line(pageWidth / 2 - 10, yPos + 1, pageWidth / 2 + 10, yPos + 1);

    yPos += 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Dear Sir,', margin, yPos);
    doc.text('We would like to take this opportunity to thank you for inviting us to quote for the above mentioned project.', margin, yPos + 5);
    doc.text('Please find below our best offer prices for the same', margin, yPos + 10);

    const summaryRows = sections.map(sec => {
      const secTotal = sec.items.reduce((sum, it) => sum + it.amount, 0);
      return [sec.sn + ' ' + sec.title, '1', 'Item', secTotal.toLocaleString() + '.00'];
    });

    autoTable(doc, {
      startY: yPos + 15,
      margin: { top: 60, bottom: 30, left: margin, right: margin },
      head: [['PROJECT SUMMARY', 'Qty', 'UNIT', 'Saudi Riyal']],
      body: summaryRows,
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontSize: 10, fontStyle: 'bold' },
      styles: { fontSize: 8, fontStyle: 'bold' },
      columnStyles: { 
        0: { cellWidth: pageWidth - margin * 2 - 75 },
        1: { halign: 'center', cellWidth: 15 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'right', cellWidth: 40 } 
      }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 5;
    
    const summaryRowLine = (l: string, v: string, y: number) => {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y - 4, pageWidth - margin * 2, 6, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(0);
        doc.text(l, 105, y, { align: 'center' });
        doc.text(v, pageWidth - margin - 2, y, { align: 'right' });
    };

    summaryRowLine('Total Amount', totalAmount.toLocaleString() + '.00', currentY);
    summaryRowLine('Special Discount', discount.toLocaleString() + '.00', currentY + 6);
    summaryRowLine('Net Amount', afterDiscount.toLocaleString() + '.00', currentY + 12);
    summaryRowLine('VAT (15%)', vatAmount.toLocaleString() + '.00', currentY + 18);
    summaryRowLine('Grand Total', grandTotal.toLocaleString() + '.00', currentY + 24);
    
    currentY += 34;
    doc.setFontSize(8);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, currentY - 4, pageWidth - margin * 2, 8);
    doc.text(`Project Value Amount in words: ${amountInWords}`, margin + 3, currentY + 1);

    yPos = currentY + 10;

    // --- DETAILED BREAKDOWN ---
    // Instead of forcing new page for each section, we let them flow
    for (let i = 0; i < sections.length; i++) {
        const sec = sections[i];
        
        // Ensure section title starts on a clean line, potentially a new page
        if (yPos > pageHeight - 60) {
            doc.addPage();
            yPos = 60;
        }

        yPos += 10;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(`${sec.sn} ${sec.title}`, margin, yPos);
        
        const secItems = sec.items.map(it => [
            it.sn,
            it.image || '',
            it.subCategory || '',
            it.description,
            it.unit,
            it.qty,
            it.unitPrice.toLocaleString() + '.00',
            it.amount.toLocaleString() + '.00'
        ]);

        const secTotal = sec.items.reduce((sum, it) => sum + it.amount, 0);

        autoTable(doc, {
            startY: yPos + 5,
            margin: { top: 60, bottom: 30, left: margin, right: margin },
            head: [['S/N', 'IMG', 'Sub Category', 'Description', 'UNIT', 'Qty', 'Unit Price', 'Amount']],
            body: [
                ...secItems,
                [
                    '', 
                    '', 
                    '',
                    `SUB TOTAL FOR ${sec.title}`, 
                    '', 
                    '', 
                    '', 
                    secTotal.toLocaleString() + '.00'
                ]
            ],
            theme: 'grid',
            headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 8, minCellHeight: 12, valign: 'middle' },
            columnStyles: {
                0: { cellWidth: 12 },
                1: { cellWidth: 20 },
                2: { cellWidth: 35 },
                3: { cellWidth: pageWidth - margin * 2 - 157 },
                4: { cellWidth: 15, halign: 'center' },
                5: { cellWidth: 15, halign: 'center' },
                6: { cellWidth: 30, halign: 'right' },
                7: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
            },
            didParseCell: (data) => {
                if (data.section === 'body' && data.column.index === 1) {
                    data.cell.text = [''];
                }
            },
            didDrawCell: (data) => {
                if (data.section === 'body' && data.row.index === secItems.length) {
                    if (data.column.index === 3) {
                        data.cell.styles.halign = 'right';
                    }
                }

                if (data.section === 'body' && data.column.index === 1 && data.cell.raw && data.row.index < secItems.length) {
                    const imgData = data.cell.raw as string;
                    if (imgData && imgData.startsWith('data:image')) {
                        try {
                            doc.addImage(imgData, 'JPEG', data.cell.x + 2, data.cell.y + 1, 16, 10);
                        } catch (e) {}
                    }
                }
            }
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 5;
    }

    // --- APPLY HEADER/FOOTER TO ALL PAGES ---
    const totalPages = doc.getNumberOfPages();
    for (let j = 1; j <= totalPages; j++) {
        doc.setPage(j);
        drawHeader(doc);
        drawFooter(doc, j, totalPages);
    }
    
    doc.save(`Quotation_${quotationNo}.pdf`);
  };

  // Internal Helper for Meta Info
  const dMeta = (d: jsPDF, y: number) => {
    const margin = 15;
    const pageWidth = d.internal.pageSize.getWidth();
    
    d.setFontSize(9);
    d.setFont('helvetica', 'bold');
    d.text('To:', margin, y);
    d.setFont('helvetica', 'normal');
    d.text(d.splitTextToSize(to || '', 70), margin + 25, y);
    
    d.setFont('helvetica', 'bold');
    d.text('Concern person:', margin, y + 6);
    d.setFont('helvetica', 'normal');
    d.text(attn || '', margin + 25, y + 6);
    
    d.setFont('helvetica', 'bold');
    d.text('Address:', margin, y + 12);
    d.setFont('helvetica', 'normal');
    d.text(d.splitTextToSize(address || '', 70), margin + 25, y + 12);
    
    d.setFont('helvetica', 'bold');
    d.text('Project:', margin, y + 25);
    d.setFont('helvetica', 'normal');
    d.text(project || '', margin + 25, y + 25);
    
    d.setFont('helvetica', 'bold');
    d.text('Email:', margin, y + 31);
    d.setTextColor(37, 99, 235);
    d.text(email || '', margin + 25, y + 31);
    d.setTextColor(0);

    const rCol = pageWidth - 65;
    const metaLine = (l: string, v: string, py: number) => {
        d.setFont('helvetica', 'bold');
        d.text(l, rCol, py);
        d.setFont('helvetica', 'normal');
        d.text(v, rCol + 30, py);
    };

    metaLine('Date:', new Date(date).toLocaleDateString('en-GB'), y);
    metaLine('Quotation:', quotationNo, y + 6);
    metaLine('Customer ID:', customerId, y + 12);
    metaLine('Valid Until:', validUntil ? new Date(validUntil).toLocaleDateString('en-GB') : '', y + 18);
    metaLine('Revision:', revision, y + 24);
  };

  const confirmQuotation = async () => {
    try {
      const res = await fetch(`/api/quotations/${quotationNo}/confirm`, {
        method: 'POST'
      });
      
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to confirm quotation');
      }
      
      toast.success('Quotation confirmed and Sales Order generated');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSaveQuote = async (asNewRevision: boolean = false) => {
    try {
      // Logic for incrementing revision if saving as new revision
      let finalRevision = revision;
      let finalId = asNewRevision ? null : id;
      
      if (asNewRevision) {
        const revMatch = revision.match(/(.*?)(\d+)$/);
        if (revMatch) {
          finalRevision = revMatch[1] + (parseInt(revMatch[2]) + 1);
        } else {
          finalRevision = revision + ' - R1';
        }
        setRevision(finalRevision);
      }

      // Flatten sections into items for backend
      const flattenedItems: any[] = [];
      sections.forEach(sec => {
        // Section Header (Legacy support + summary rendering)
        flattenedItems.push({
          sn: sec.sn,
          description: sec.title,
          unit: 'Item',
          qty: 1,
          unitPrice: sec.items.reduce((s, it) => s + (it.amount || 0), 0),
          amount: sec.items.reduce((s, it) => s + (it.amount || 0), 0),
          is_lot: true
        });
        
        sec.items.forEach(it => {
          flattenedItems.push({
            ...it,
            is_lot: false
          });
        });
      });

      const payload = {
        id: finalId,
        quotation_number: quotationNo,
        date: date,
        customer_name: to,
        customer_id: customerId,
        project_name: project,
        total_amount: grandTotal,
        discount: discount,
        tax_amount: vatAmount,
        valid_until: validUntil,
        revision: finalRevision,
        parent_id: parentId,
        items: flattenedItems
      };

      const res = await fetch('/api/quotations/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to save quotation');
      }

      const savedData = await res.json();
      if (!parentId && savedData.id) {
          setParentId(savedData.id);
      }

      setIsSaved(true);
      toast.success(asNewRevision ? 'New revision created successfully' : 'Quotation saved successfully');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) return <div className="h-64 flex items-center justify-center text-slate-400 font-mono text-xs uppercase tracking-widest animate-pulse">Initializing Specialized Editor...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-white border-b border-blue-100 py-6 px-10 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-black uppercase tracking-widest text-blue-900">{id ? 'Edit Quotation' : 'Prepare Quotation'}</CardTitle>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
              <Shield className="h-3 w-3 text-blue-600" /> ZATCA Compliant Institutional Proposal
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {(isSaved || id) && (
              <Button onClick={() => {
                generatePDF();
                // Standard A4 print trigger shortcut
                toast.info('Preparing A4 Format for Printing...');
              }} className="h-9 px-6 text-[10px] font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white shadow-md gap-2">
                <Printer className="h-3.5 w-3.5" /> Print Quote (A4)
              </Button>
            )}
            
            {id && (
              <Button onClick={() => handleSaveQuote(true)} variant="outline" className="h-9 px-4 text-[10px] font-black uppercase tracking-widest border-blue-200 text-blue-600 hover:bg-blue-50 transition-all gap-2 shadow-sm">
                <FileText className="h-3.5 w-3.5" /> Save as New Revision
              </Button>
            )}

            <Button onClick={confirmQuotation} variant="outline" className="h-9 px-4 text-[10px] font-black uppercase tracking-widest border-blue-200 text-blue-600 hover:bg-blue-50 transition-all gap-2 shadow-sm">
              <PackageCheck className="h-3.5 w-3.5" /> Confirm Quote
            </Button>
            <Button onClick={() => handleSaveQuote(false)} className="h-9 px-6 text-[10px] font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white shadow-md gap-2">
              <Save className="h-3.5 w-3.5" /> {id ? 'Update Existing' : 'Save Quote'}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-10 space-y-12">
          {/* Section 1: Client & Document Metadata */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-6 border-r border-blue-50 pr-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-5 w-1.5 bg-blue-600 rounded-full"></div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-900">Client Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-blue-600/60 tracking-[0.1em]">Client Name</label>
                  <Select value={to} onValueChange={handleCustomerChange}>
                    <SelectTrigger className="h-10 border-blue-100 bg-white focus:ring-2 focus:ring-blue-500/20 transition-all font-bold text-xs uppercase rounded-xl">
                      <SelectValue placeholder="Select Client" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(c => (
                        <SelectItem key={c.id} value={c.name} className="text-[10px] font-bold py-2 uppercase">{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-blue-600/60 tracking-[0.1em]">Concern person</label>
                  <Input value={attn} onChange={e => setAttn(e.target.value)} className="h-10 border-blue-100 bg-white focus:ring-2 focus:ring-blue-500/20 transition-all font-bold text-xs rounded-xl" />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-blue-600/60 tracking-[0.1em]">Project Title</label>
                  <Input value={project} onChange={e => setProject(e.target.value)} className="h-10 border-blue-100 bg-white focus:ring-2 focus:ring-blue-500/20 transition-all font-bold text-xs rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-blue-600/60 tracking-[0.1em]">Email Address</label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-10 border-blue-100 bg-white focus:ring-2 focus:ring-blue-500/20 transition-all font-bold text-xs rounded-xl" />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-blue-600/60 tracking-[0.1em]">Address</label>
                  <textarea 
                    value={address} 
                    onChange={e => setAddress(e.target.value)} 
                    rows={3}
                    className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs font-bold text-slate-700 ring-offset-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-5 w-1 bg-slate-400 rounded-full"></div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800">Reference</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quote No.</span>
                  <Input value={quotationNo} onChange={e => setQuotationNo(e.target.value)} className="h-8 w-32 border-none bg-blue-50 text-right font-mono font-black text-xs text-blue-600" />
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</span>
                  <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-8 w-40 border-none bg-slate-50 text-right font-bold text-[10px] text-slate-800" />
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer ID</span>
                  <Input value={customerId} onChange={e => setCustomerId(e.target.value)} className="h-8 w-32 border-none bg-slate-50 text-right font-bold text-xs text-slate-800" />
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valid Until</span>
                  <Input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className="h-8 w-40 border-none bg-slate-50 text-right font-bold text-[10px] text-slate-800" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revision</span>
                  <Input value={revision} onChange={e => setRevision(e.target.value)} className="h-8 w-32 border-none bg-slate-50 text-right font-bold text-xs text-slate-800" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Line Items by Section */}
          <div className="space-y-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-5 w-1.5 bg-blue-600 rounded-full"></div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-900">Quotation Breakdown</h3>
              </div>
              <Button size="sm" onClick={addSection} className="h-8 gap-2 bg-blue-700 hover:bg-blue-800 text-[9px] font-black uppercase tracking-widest px-4 shadow-sm">
                <Plus className="h-3.5 w-3.5 text-white" /> Add New Section
              </Button>
            </div>

            {sections.map((section) => (
              <div key={section.id} className="space-y-4 border-l-4 border-slate-100 pl-6 pb-8">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <Input 
                      value={section.sn} 
                      onChange={e => updateSection(section.id, 'sn', e.target.value)} 
                      className="h-8 w-16 border-none bg-slate-50 font-mono text-[10px] font-black text-slate-400" 
                    />
                    <div className="flex-1">
                      <Select 
                        value={section.title} 
                        onValueChange={val => updateSection(section.id, 'title', val)}
                      >
                        <SelectTrigger className="h-9 border-none bg-transparent font-black text-sm text-slate-800 uppercase tracking-tight w-full hover:bg-slate-50 transition-colors">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.name} className="text-[10px] font-bold py-2 uppercase">
                              {cat.name}
                            </SelectItem>
                          ))}
                          {section.title && !categories.some(c => c.name === section.title) && (
                             <SelectItem value={section.title} className="text-[10px] font-bold py-2 uppercase text-slate-400">
                               Custom: {section.title}
                             </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                     <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="outline" size="sm" className="h-8 gap-2 border-slate-200 text-[8px] font-black uppercase tracking-widest px-3 bg-white hover:bg-slate-50">
                          <Plus className="h-3 w-3 text-slate-400" /> Catalog
                        </Button>
                      } />
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest text-slate-400">Add from Catalog</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {templateItems
                            .filter(item => {
                              const sectionCategory = categories.find(c => c.name === section.title);
                              return sectionCategory ? item.category_id === sectionCategory.id : true;
                            })
                            .map(item => (
                              <DropdownMenuItem key={item.id} onClick={() => addFromTemplate(item, section.id)} className="text-[10px] font-bold py-2">
                                {item.name}
                              </DropdownMenuItem>
                            ))}
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button size="sm" variant="ghost" onClick={() => addItemToSection(section.id)} className="h-8 gap-2 text-[8px] font-black uppercase tracking-widest px-3 hover:bg-blue-50 hover:text-blue-600">
                      <Plus className="h-3 w-3" /> Add Item
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => removeSection(section.id)} className="h-8 w-8 text-slate-300 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm bg-white">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow className="h-10 border-none hover:bg-transparent">
                        <TableHead className="w-16 px-4 text-[8px] font-black uppercase tracking-widest text-slate-400">S/N</TableHead>
                        <TableHead className="w-16 text-[8px] font-black uppercase tracking-widest text-slate-400 text-center">IMG</TableHead>
                        <TableHead className="w-40 text-[8px] font-black uppercase tracking-widest text-slate-400">Sub Category</TableHead>
                        <TableHead className="text-[8px] font-black uppercase tracking-widest text-slate-400">Description</TableHead>
                        <TableHead className="w-20 text-[8px] font-black uppercase tracking-widest text-slate-400">UNIT</TableHead>
                        <TableHead className="w-20 text-[8px] font-black uppercase tracking-widest text-slate-400 text-center">Qty</TableHead>
                        <TableHead className="w-28 text-right text-[8px] font-black uppercase tracking-widest text-slate-400">Rate</TableHead>
                        <TableHead className="w-32 text-right text-[8px] font-black uppercase tracking-widest text-slate-400">Amount</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {section.items.map((item) => (
                        <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                          <TableCell className="px-4">
                            <Input value={item.sn} onChange={e => updateItem(section.id, item.id, 'sn', e.target.value)} className="h-7 border-none bg-transparent font-mono text-[9px] font-extrabold text-slate-400" />
                          </TableCell>
                          <TableCell className="p-0">
                            <div className="flex justify-center items-center">
                              <label className="cursor-pointer group relative">
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={(e) => handleFileChange(section.id, item.id, e)} 
                                />
                                {item.image ? (
                                  <div className="w-8 h-8 rounded border border-slate-200 overflow-hidden"><img src={item.image} className="w-full h-full object-cover" /></div>
                                ) : (
                                  <div className="w-8 h-8 rounded bg-slate-50 flex items-center justify-center text-slate-300"><ImageIcon className="h-3 w-3" /></div>
                                )}
                              </label>
                            </div>
                          </TableCell>
                          <TableCell>
                             <Input value={item.subCategory} onChange={e => updateItem(section.id, item.id, 'subCategory', e.target.value)} placeholder="Sub Category" className="h-7 border-none bg-transparent font-black text-[10px] text-blue-600 uppercase" />
                          </TableCell>
                          <TableCell>
                             <Input value={item.description} onChange={e => updateItem(section.id, item.id, 'description', e.target.value)} className="h-7 border-none bg-transparent font-bold text-xs text-slate-700" />
                          </TableCell>
                          <TableCell>
                             <Input value={item.unit} onChange={e => updateItem(section.id, item.id, 'unit', e.target.value)} className="h-7 border-none bg-transparent font-bold text-[10px] text-slate-500 uppercase" />
                          </TableCell>
                          <TableCell>
                             <Input type="number" value={item.qty} onChange={e => updateItem(section.id, item.id, 'qty', parseFloat(e.target.value))} className="h-7 text-center bg-transparent border-none font-bold text-xs" />
                          </TableCell>
                          <TableCell>
                             <Input type="number" value={item.unitPrice} onChange={e => updateItem(section.id, item.id, 'unitPrice', parseFloat(e.target.value))} className="h-7 text-right bg-transparent border-none font-mono font-bold text-slate-600 text-[11px]" />
                          </TableCell>
                          <TableCell className="text-right font-black text-slate-900 font-mono text-[11px]">
                            {item.amount.toLocaleString()}.00
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => removeItem(section.id, item.id)} className="h-6 w-6 text-slate-200 hover:text-red-500">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {section.items.length > 0 && (
                        <TableRow className="bg-slate-50/30 hover:bg-slate-50/30">
                          <TableCell colSpan={7} className="text-right py-3 pr-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                            Subtotal for {section.title}
                          </TableCell>
                          <TableCell className="text-right py-3 font-black text-slate-900 font-mono text-xs border-l border-slate-100">
                            {section.items.reduce((s, it) => s + (it.amount || 0), 0).toLocaleString()}.00
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8 border-t border-slate-100">
            <div className="space-y-6">
              <div className="p-8 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Project Value in words</p>
                <p className="text-[11px] font-bold text-slate-600 leading-relaxed uppercase italic">{amountInWords}</p>
                <div className="pt-6 flex items-center gap-3">
                  <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm">
                    <Shield className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Authorized & Verified Commercial Document</p>
                </div>
              </div>
              <div className="flex gap-4 p-5 border border-blue-100 bg-blue-50/50 rounded-2xl shadow-inner-white">
                 <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                 <p className="text-[10px] text-blue-900/60 font-medium leading-relaxed">
                   Summary nodes identified with <span className="font-bold">.0</span> suffixes (e.g. 1.0) occupy the primary project summary projection for institutional A4 exports.
                 </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-10 space-y-8 shadow-sm">
              <div className="space-y-5">
                <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-slate-400">
                  <span>Gross Sub Total</span>
                  <span className="font-mono text-slate-800">{totalAmount.toLocaleString()}.00 SAR</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-widest text-[#f87171]">Project Discount</span>
                  </div>
                  <div className="relative">
                    <Input 
                      type="number" 
                      value={discount} 
                      onChange={e => setDiscount(Number(e.target.value))} 
                      className="h-9 w-32 border-slate-200 bg-slate-50 text-right font-mono font-black text-xs text-[#f87171] focus:ring-1 focus:ring-red-400" 
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400">-SAR</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-slate-400">
                  <span>VAT Accrual (15%)</span>
                  <span className="font-mono text-slate-800">{vatAmount.toLocaleString()}.00 SAR</span>
                </div>
              </div>
              <div className="pt-8 border-t border-slate-100 flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-2">Final Project Value</p>
                  <h2 className="text-4xl font-black font-mono tracking-tighter text-slate-900">SAR {grandTotal.toLocaleString()}.00</h2>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div 
                    onClick={() => handleSaveQuote(false)}
                    className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm text-blue-400 group hover:text-blue-600 hover:bg-blue-100 transition-all cursor-pointer"
                  >
                    <Save className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
const Shield = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
);
