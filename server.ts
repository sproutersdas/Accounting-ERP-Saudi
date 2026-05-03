import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import multer from 'multer';
import { mkdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'itqan-secret-key-123';
const db = new Database('accounting.db');

const parseAccountId = (val: any) => {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'string' && val.includes('|')) return parseInt(val.split('|')[0], 10);
  return Number(val);
};

// --- DATABASE INITIALIZATION ---
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    client_name TEXT,
    status TEXT DEFAULT 'active',
    budget REAL DEFAULT 0,
    start_date TEXT,
    end_date TEXT,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- Asset, Liability, Equity, Revenue, Expense
    parent_id INTEGER,
    FOREIGN KEY (parent_id) REFERENCES accounts(id)
  );

  CREATE TABLE IF NOT EXISTS journal_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    description TEXT,
    reference TEXT,
    status TEXT DEFAULT 'posted', -- draft, posted
    project_id INTEGER,
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS journal_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    journal_entry_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,
    debit REAL DEFAULT 0,
    credit REAL DEFAULT 0,
    memo TEXT,
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id),
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id)
  );

  CREATE TABLE IF NOT EXISTS quotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quotation_number TEXT UNIQUE NOT NULL,
    date TEXT NOT NULL,
    valid_until TEXT,
    customer_name TEXT,
    customer_id TEXT,
    project_name TEXT,
    revision TEXT,
    total_amount REAL,
    discount REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'draft'
  );

  CREATE TABLE IF NOT EXISTS quotation_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quotation_id INTEGER,
    sn TEXT,
    description TEXT,
    unit TEXT,
    qty REAL,
    unit_price REAL,
    amount REAL,
    is_lot INTEGER DEFAULT 0, -- 1 if it's a lot summary, 0 if item
    sub_category TEXT,
    parent_id INTEGER, -- For hierarchical structure
    image_url TEXT,
    FOREIGN KEY (quotation_id) REFERENCES quotations(id)
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    vat_number TEXT
  );

  CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    vat_number TEXT
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT UNIQUE NOT NULL,
    customer_id INTEGER,
    date TEXT NOT NULL,
    due_date TEXT,
    total_amount REAL,
    vat_amount REAL,
    status TEXT DEFAULT 'pending',
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS sales_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE NOT NULL,
    quotation_id INTEGER,
    customer_id INTEGER,
    date TEXT NOT NULL,
    project_name TEXT,
    valid_until TEXT,
    revision TEXT,
    total_amount REAL,
    discount REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'open',
    FOREIGN KEY (quotation_id) REFERENCES quotations(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS sales_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sales_order_id INTEGER,
    sn TEXT,
    description TEXT,
    unit TEXT,
    qty REAL,
    unit_price REAL,
    amount REAL,
    is_lot INTEGER DEFAULT 0,
    sub_category TEXT,
    image_url TEXT,
    FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id)
  );

  CREATE TABLE IF NOT EXISTS units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_number TEXT UNIQUE NOT NULL,
    supplier_id INTEGER,
    project_id INTEGER,
    date TEXT NOT NULL,
    due_date TEXT,
    total_amount REAL,
    vat_amount REAL,
    status TEXT DEFAULT 'unpaid',
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS project_template_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    name TEXT NOT NULL,
    description TEXT,
    unit TEXT,
    default_unit_price REAL DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES project_categories(id)
  );

  CREATE TABLE IF NOT EXISTS inventory_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT UNIQUE,
    name TEXT NOT NULL,
    category TEXT,
    unit TEXT,
    qty_on_hand REAL DEFAULT 0,
    min_qty REAL DEFAULT 0,
    cost_price REAL DEFAULT 0,
    sale_price REAL DEFAULT 0,
    project_id INTEGER,
    location_type TEXT DEFAULT 'company', -- 'company' or 'project'
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS project_ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    description TEXT,
    reference TEXT,
    amount REAL NOT NULL, -- Positive for revenue/budget, negative for expense
    type TEXT NOT NULL, -- revenue, expense
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS company_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cr_number TEXT,
    vat_number TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    email TEXT,
    website TEXT,
    phone TEXT,
    logo_url TEXT
  );

  CREATE TABLE IF NOT EXISTS stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER,
    type TEXT NOT NULL, -- inbound, outbound, transfer
    qty REAL NOT NULL,
    date TEXT NOT NULL,
    reference TEXT,
    status TEXT DEFAULT 'Completed', -- Pending, Completed, Cancelled
    FOREIGN KEY (item_id) REFERENCES inventory_items(id)
  );

  CREATE TABLE IF NOT EXISTS bill_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_id INTEGER NOT NULL,
    account_id INTEGER,
    inventory_item_id INTEGER,
    description TEXT,
    qty REAL DEFAULT 0,
    amount REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    FOREIGN KEY (bill_id) REFERENCES bills(id),
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id),
    FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id)
  );

  CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    account_id INTEGER,
    description TEXT,
    amount REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id)
  );

  CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- Asset, Liability, Equity, Revenue, Expense
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS ledgers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    account_id INTEGER NOT NULL,
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id)
  );

  CREATE TABLE IF NOT EXISTS project_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS bank_reconciliations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER,
    statement_date TEXT NOT NULL,
    statement_balance REAL NOT NULL,
    ledger_balance REAL NOT NULL,
    status TEXT DEFAULT 'open', -- open, closed
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id)
  );
`);

  // Migrations for new columns
  try {
    db.exec(`
      ALTER TABLE bills ADD COLUMN payment_mode TEXT;
      ALTER TABLE bills ADD COLUMN payment_reference TEXT;
    `);
  } catch (e) {}

  try {
    db.exec(`
      ALTER TABLE invoices ADD COLUMN payment_mode TEXT;
      ALTER TABLE invoices ADD COLUMN payment_reference TEXT;
    `);
  } catch (e) {}

  try {
    db.exec(`
      ALTER TABLE inventory_items ADD COLUMN project_id INTEGER;
      ALTER TABLE inventory_items ADD COLUMN location_type TEXT DEFAULT 'company';
    `);
  } catch (e) {}

  try {
    db.exec(`
      ALTER TABLE bill_items ADD COLUMN inventory_item_id INTEGER;
      ALTER TABLE bill_items ADD COLUMN qty REAL DEFAULT 0;
    `);
  } catch (e) {}


  // Seed Project Categories
  const catCount = db.prepare('SELECT count(*) as count FROM project_categories').get() as { count: number };
  if (catCount.count === 0) {
    const defaultCats = [
      'PRELIMINARIES & APPROVALS',
      'CIVIL WORKS',
      'FLOORING WORKS',
      'CEILING WORKS',
      'WALLS AND PARTITION WORKS',
      'DOORS',
      'CUSTOM JOINERY',
      'LIGHT FITTINGS',
      'ELECTRICAL WORKS',
      'FIRE & SPLINKER',
      'IT WORKS & CCTV',
      'HVAC WORKS',
      'PLUMBING WORK',
      'FURNITURES',
      'MISCELLANEOUS',
      'Appliences'
    ];
    const insertCat = db.prepare('INSERT INTO project_categories (name) VALUES (?)');
    defaultCats.forEach(cat => {
      try { insertCat.run(cat); } catch(e) {}
    });
  }

  // Seed Units
  const unitCount = db.prepare('SELECT count(*) as count FROM units').get() as { count: number };
  if (unitCount.count === 0) {
    const defaultUnits = ['Lot', 'Item', 'm2', 'm3', 'kg', 'unit', 'LS', 'job'];
    const insertUnit = db.prepare('INSERT INTO units (name) VALUES (?)');
    defaultUnits.forEach(unit => {
      try { insertUnit.run(unit); } catch(e) {}
    });
  }

// Seed Chart of Accounts
const coaCount = db.prepare('SELECT count(*) as count FROM chart_of_accounts').get() as { count: number };
if (coaCount.count === 0) {
  const initialAccounts = [
    ['1000', 'Fixed Assets', 'Asset'],
    ['1100', 'Cash at Bank', 'Asset'],
    ['1200', 'Accounts Receivable', 'Asset'],
    ['2000', 'Accounts Payable', 'Liability'],
    ['2100', 'VAT Payable', 'Liability'],
    ['3000', 'Capital Account', 'Equity'],
    ['3100', 'Retained Earnings', 'Equity'],
    ['4000', 'Sales Revenue', 'Revenue'],
    ['5000', 'Direct Costs', 'Expense'],
    ['5100', 'Salaries Expense', 'Expense'],
    ['5200', 'Rent Expense', 'Expense'],
  ];
  const insertAcc = db.prepare('INSERT INTO chart_of_accounts (code, name, type) VALUES (?, ?, ?)');
  initialAccounts.forEach(acc => insertAcc.run(...acc));
}

// Seed Admin User
const adminUser = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
if (!adminUser) {
  const hashedPassword = bcrypt.hashSync('admin', 10);
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', hashedPassword, 'admin');
}

// Seed Project Template Items
const templateCount = db.prepare('SELECT count(*) as count FROM project_template_items').get() as { count: number };
if (templateCount.count === 0) {
  db.prepare('INSERT INTO project_template_items (name, description, unit, default_unit_price) VALUES (?, ?, ?, ?)').run('ELECTRICAL WORKS', 'Provision of power points, lighting fixes, and DB wiring as per site layout.', 'Lot', 12500);
  db.prepare('INSERT INTO project_template_items (name, description, unit, default_unit_price) VALUES (?, ?, ?, ?)').run('FLOORING WORKS', 'Supply and installation of 60x60 ceramic tiles with epoxy grouting.', 'Sqm', 85);
  db.prepare('INSERT INTO project_template_items (name, description, unit, default_unit_price) VALUES (?, ?, ?, ?)').run('CEILING WORKS', '60x60 Gypsum board ceiling with aluminum grid system.', 'Sqm', 65);
  db.prepare('INSERT INTO project_template_items (name, description, unit, default_unit_price) VALUES (?, ?, ?, ?)').run('DOORS & JOINERY', 'Solid wood doors with lacquer finish and premium hardware.', 'Each', 2450);
}

// Seed Company Details
const companyCount = db.prepare('SELECT count(*) as count FROM company_details').get() as { count: number };
if (companyCount.count === 0) {
  db.prepare(`
    INSERT INTO company_details (name, cr_number, vat_number, address, city, country, email, website, phone) 
    VALUES ('Accounting & Fit-out', '1010992376', '312100807900003', '6644 AL Ahsa st, Malaz', 'Riyadh', 'Kingdom of Saudi Arabia', 'info@nikkenmoller.com', 'www.nikkenmoller.com', '+966-55 410 6103')
  `).run();
}

// Migration to remove ID=1 constraint if exists
try {
  const tableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='company_details'").get() as { sql: string };
  if (tableInfo.sql.includes('CHECK (id = 1)')) {
    db.exec(`
      ALTER TABLE company_details RENAME TO company_details_old;
      CREATE TABLE company_details (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        cr_number TEXT,
        vat_number TEXT,
        address TEXT,
        city TEXT,
        country TEXT,
        email TEXT,
        website TEXT,
        phone TEXT,
        logo_url TEXT
      );
      INSERT INTO company_details (id, name, cr_number, vat_number, address, city, country, email, website, phone, logo_url)
      SELECT id, name, cr_number, vat_number, address, city, country, email, website, phone, logo_url FROM company_details_old;
      DROP TABLE company_details_old;
    `);
  }
} catch (e) {
  console.error("Company details migration failed:", e);
}

// Migration: Add project columns if not exists
try {
  db.exec('ALTER TABLE projects ADD COLUMN budget REAL DEFAULT 0');
  db.exec('ALTER TABLE projects ADD COLUMN start_date TEXT');
  db.exec('ALTER TABLE projects ADD COLUMN end_date TEXT');
  db.exec('ALTER TABLE projects ADD COLUMN description TEXT');
} catch (e) {
  // Columns likely already exist
}

// Migration: Add project_id to bills if not exists
try {
  db.exec('ALTER TABLE bills ADD COLUMN project_id INTEGER');
} catch (e) {
  // Column likely already exists
}

// Migration: Add category_id to project_template_items if not exists
try {
  db.exec('ALTER TABLE project_template_items ADD COLUMN category_id INTEGER');
} catch (e) {
  // Column likely already exists
}

// Migration: Add newly needed fields to bills and bill_items
try {
  db.exec('ALTER TABLE bills ADD COLUMN supplier_invoice_no TEXT');
  db.exec('ALTER TABLE bills ADD COLUMN supplier_invoice_date TEXT');
} catch (e) {
  // Columns likely already exist
}
try {
  db.exec('ALTER TABLE bill_items ADD COLUMN unit_price REAL');
  db.exec('ALTER TABLE bill_items ADD COLUMN discount REAL DEFAULT 0');
} catch (e) {
  // Columns likely already exist
}

// Migration: Add created_at to users if not exists
try {
  db.exec('ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP');
} catch (e) {
  // Column likely already exists
}

// Migration: Add sub_category to quotation_items if not exists
try {
  db.exec('ALTER TABLE quotation_items ADD COLUMN sub_category TEXT');
} catch (e) {}

// Migration: Add project_id to invoices if not exists
try {
  db.exec('ALTER TABLE invoices ADD COLUMN project_id INTEGER');
} catch (e) {}

// Migration: Add description to sales_orders if not exists
try {
  db.exec('ALTER TABLE sales_orders ADD COLUMN description TEXT');
} catch (e) {}

// Migration: Add item_id to quote/so items if missing (not strictly needed but good for inventory linkage)
try {
  db.exec('ALTER TABLE quotation_items ADD COLUMN item_id INTEGER');
  db.exec('ALTER TABLE sales_order_items ADD COLUMN item_id INTEGER');
} catch (e) {}

// Migration: Remove UNIQUE constraint from quotation_number and add parent_id
try {
  const tableInfo = db.prepare("PRAGMA table_info(quotations)").all() as any[];
  const hasParentId = tableInfo.some(col => col.name === 'parent_id');
  
  // Check if it's unique by checking indexes
  const indexInfo = db.prepare("PRAGMA index_list(quotations)").all() as any[];
  const hasUniqueNo = indexInfo.some(idx => idx.unique === 1 && idx.name.includes('quotation_number'));

  if (!hasParentId || hasUniqueNo) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS quotations_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quotation_number TEXT NOT NULL,
        date TEXT NOT NULL,
        valid_until TEXT,
        customer_name TEXT,
        customer_id TEXT,
        project_name TEXT,
        revision TEXT,
        total_amount REAL,
        discount REAL DEFAULT 0,
        tax_amount REAL DEFAULT 0,
        status TEXT DEFAULT 'draft',
        parent_id INTEGER
      );
    `);
    
    db.exec(`
      INSERT INTO quotations_new (id, quotation_number, date, valid_until, customer_name, customer_id, project_name, revision, total_amount, discount, tax_amount, status, parent_id)
      SELECT id, quotation_number, date, valid_until, customer_name, customer_id, project_name, revision, total_amount, discount, tax_amount, status, id FROM quotations;
    `);
    
    db.exec("DROP TABLE quotations;");
    db.exec("ALTER TABLE quotations_new RENAME TO quotations;");
  }
} catch (e) {
  console.error("Migration error:", e);
}

try {
  const quoteCols = db.prepare("PRAGMA table_info(quotations)").all() as any[];
  if (!quoteCols.some(col => col.name === 'description')) {
    db.exec("ALTER TABLE quotations ADD COLUMN description TEXT");
  }
  if (!quoteCols.some(col => col.name === 'terms_and_conditions')) {
    db.exec("ALTER TABLE quotations ADD COLUMN terms_and_conditions TEXT");
  }
  if (!quoteCols.some(col => col.name === 'notes_json')) {
    db.exec("ALTER TABLE quotations ADD COLUMN notes_json TEXT");
  }
} catch(e) {}

try {
  const soCols = db.prepare("PRAGMA table_info(sales_orders)").all() as any[];
  if (!soCols.some(col => col.name === 'description')) {
    db.exec("ALTER TABLE sales_orders ADD COLUMN description TEXT");
  }
} catch(e) {}

// Seed Initial Data for Demo
const customerCount = db.prepare('SELECT count(*) as count FROM customers').get() as { count: number };
if (customerCount.count === 0) {
  db.prepare('INSERT INTO customers (name, contact_person, email) VALUES (?, ?, ?)').run('ATS TRAVELS', 'Ahmed Hassan', 'ahmed@ats.com.sa');
  db.prepare('INSERT INTO customers (name, contact_person, email) VALUES (?, ?, ?)').run('AL-RAJHI BANK', 'Fahad Al-Saud', 'fahad@alrajhi.com');
  
  db.prepare('INSERT INTO suppliers (name, contact_person, email) VALUES (?, ?, ?)').run('Construction Supplies Ltd', 'Mohammed Khan', 'khan@construct.com');
  db.prepare('INSERT INTO suppliers (name, contact_person, email) VALUES (?, ?, ?)').run('Build-Tech Solutions', 'John Smith', 'john@buildtech.com');

  db.prepare(`
    INSERT INTO invoices (invoice_number, customer_id, date, due_date, total_amount, vat_amount, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('INV-2026-001', 1, '2026-04-10', '2026-05-10', 45000, 6750, 'paid');

  db.prepare(`
    INSERT INTO bills (bill_number, supplier_id, date, due_date, total_amount, vat_amount, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('BILL-2026-105', 1, '2026-04-05', '2026-05-05', 35000, 5250, 'paid');

  db.prepare(`
    INSERT INTO inventory_items (sku, name, category, unit, qty_on_hand, min_qty, cost_price, sale_price)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('SKU-001', 'Ceramic Tiles (60x60)', 'Finishing', 'Sqm', 450, 100, 45, 65);
  db.prepare(`
    INSERT INTO inventory_items (sku, name, category, unit, qty_on_hand, min_qty, cost_price, sale_price)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('SKU-012', 'Portland Cement (50kg)', 'Basics', 'Bags', 85, 150, 18, 25);
}

// --- SERVER SETUP ---
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(cookieParser());
  app.use(cors());

  // Storage for images
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
  });
  const upload = multer({ storage });
  
  // Create uploads directory if not exists
  if (!existsSync('uploads')) {
    mkdirSync('uploads');
  }
  app.use('/uploads', express.static('uploads'));

  // --- API ROUTES ---

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  app.post('/api/upload', authenticate, upload.single('image'), (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ url });
  });

  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
      res.cookie('token', token, { 
        httpOnly: true, 
        secure: true, 
        sameSite: 'none',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      res.json({ id: user.id, username: user.username, role: user.role });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
  });

  app.get('/api/me', authenticate, (req: any, res) => {
    try {
      const user = db.prepare('SELECT id, username, role, created_at FROM users WHERE id = ?').get(req.user.id) as any;
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (err: any) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Basic CRUD for projects
  app.get('/api/projects', authenticate, (req, res) => {
    try {
      const projects = db.prepare('SELECT * FROM projects').all();
      res.json(projects);
    } catch (err: any) {
      res.status(500).json({ error: 'Database error', details: err.message });
    }
  });

  app.get('/api/projects/:id', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
      if (!project) return res.status(404).json({ error: 'Project not found' });
      res.json(project);
    } catch (err: any) {
      res.status(500).json({ error: 'Database error', details: err.message });
    }
  });

  app.post('/api/projects', authenticate, (req, res) => {
    try {
      const { name, client_name, budget, start_date, end_date, description } = req.body;
      const info = db.prepare(`
        INSERT INTO projects (name, client_name, budget, start_date, end_date, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(name, client_name, budget || 0, start_date, end_date, description);
      res.json({ id: info.lastInsertRowid });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create project', details: err.message });
    }
  });

  app.put('/api/projects/:id', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      const { name, client_name, budget, start_date, end_date, description, status } = req.body;
      db.prepare(`
        UPDATE projects 
        SET name = ?, client_name = ?, budget = ?, start_date = ?, end_date = ?, description = ?, status = ?
        WHERE id = ?
      `).run(name, client_name, budget, start_date, end_date, description, status, id);
      res.json({ message: 'Project updated' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update project', details: err.message });
    }
  });

  app.delete('/api/projects/:id', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM projects WHERE id = ?').run(id);
      res.json({ message: 'Project deleted' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete project', details: err.message });
    }
  });

  // Quotation routes
  app.get('/api/quotations', authenticate, (req, res) => {
    const quotations = db.prepare('SELECT * FROM quotations ORDER BY date DESC').all();
    res.json(quotations);
  });

  app.get('/api/quotations/:id/revisions', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      const quote = db.prepare('SELECT parent_id FROM quotations WHERE id = ?').get(id) as any;
      if (!quote) return res.status(404).json({ error: 'Quotation not found' });
      
      const revisions = db.prepare('SELECT * FROM quotations WHERE parent_id = ? ORDER BY id DESC').all(quote.parent_id);
      res.json(revisions);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch revisions', details: err.message });
    }
  });

  app.get('/api/quotations/:id', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      const quotation = db.prepare('SELECT * FROM quotations WHERE id = ? OR quotation_number = ?').get(id, id) as any;
      if (!quotation) return res.status(404).json({ error: 'Quotation not found' });
      
      const items = db.prepare('SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY id ASC').all(quotation.id);
      
      // Fetch previous revision for comparison if applicable
      let previousItems = null;
      if (quotation.parent_id) {
        const prevRev = db.prepare(`
          SELECT * FROM quotations 
          WHERE parent_id = ? AND id < ? 
          ORDER BY id DESC LIMIT 1
        `).get(quotation.parent_id, quotation.id) as any;

        if (prevRev) {
          previousItems = db.prepare('SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY id ASC').all(prevRev.id);
        }
      }

      res.json({ ...quotation, items, previousItems });
    } catch (err: any) {
      res.status(500).json({ error: 'Database error', details: err.message });
    }
  });

  app.delete('/api/quotations/:id', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      const transaction = db.transaction(() => {
        db.prepare('DELETE FROM quotation_items WHERE quotation_id = ?').run(id);
        db.prepare('DELETE FROM quotations WHERE id = ?').run(id);
      });
      transaction();
      res.json({ message: 'Quotation deleted' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete quotation', details: err.message });
    }
  });

  app.post('/api/quotations', authenticate, (req, res) => {
    const { quotation_number, date, customer_name, project_name } = req.body;
    const info = db.prepare(`
      INSERT INTO quotations (quotation_number, date, customer_name, project_name, total_amount)
      VALUES (?, ?, ?, ?, 0)
    `).run(quotation_number, date, customer_name, project_name);
    res.json({ id: info.lastInsertRowid });
  });

  // --- SALES: Invoices & Customers ---
  app.get('/api/customers', authenticate, (req, res) => {
    try {
      const customers = db.prepare('SELECT * FROM customers').all();
      res.json(customers);
    } catch (err: any) {
      res.status(500).json({ error: 'Database error', details: err.message });
    }
  });

  app.get('/api/customers/:id/quotations', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      const quotes = db.prepare('SELECT * FROM quotations WHERE customer_id = ? ORDER BY date DESC').all(id);
      res.json(quotes);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch customer quotations', details: err.message });
    }
  });

  app.get('/api/customers/:id', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
      if (!customer) return res.status(404).json({ error: 'Customer not found' });
      res.json(customer);
    } catch (err: any) {
      res.status(500).json({ error: 'Database error', details: err.message });
    }
  });

  app.post('/api/customers', authenticate, (req, res) => {
    try {
      const { name, contact_person, email, phone, address, vat_number } = req.body;
      const info = db.prepare(`
        INSERT INTO customers (name, contact_person, email, phone, address, vat_number)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(name, contact_person, email, phone, address, vat_number);
      res.json({ id: info.lastInsertRowid });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create customer', details: err.message });
    }
  });

  app.put('/api/customers/:id', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      const { name, contact_person, email, phone, address, vat_number } = req.body;
      db.prepare(`
        UPDATE customers 
        SET name = ?, contact_person = ?, email = ?, phone = ?, address = ?, vat_number = ?
        WHERE id = ?
      `).run(name, contact_person, email, phone, address, vat_number, id);
      res.json({ message: 'Customer updated' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update customer', details: err.message });
    }
  });

  app.delete('/api/customers/:id', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM customers WHERE id = ?').run(id);
      res.json({ message: 'Customer deleted' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete customer', details: err.message });
    }
  });

  app.get('/api/invoices', authenticate, (req, res) => {
    try {
      const invoices = db.prepare(`
        SELECT i.*, c.name as customer_name, p.name as project_name
        FROM invoices i 
        LEFT JOIN customers c ON i.customer_id = c.id
        LEFT JOIN projects p ON i.project_id = p.id
        ORDER BY i.date DESC
      `).all();
      res.json(invoices);
    } catch (err: any) {
      res.status(500).json({ error: 'Database error fetching invoices', details: err.message });
    }
  });

  app.post('/api/invoices/save', authenticate, (req, res) => {
    try {
      const { id, invoice_number, customer_id, project_id, date, due_date, total_amount, tax_amount, status, notes, items, payment_mode, payment_reference } = req.body;
      
      const transaction = db.transaction(() => {
        let invoiceId = id;
        if (id) {
          db.prepare(`
            UPDATE invoices 
            SET invoice_number = ?, customer_id = ?, project_id = ?, date = ?, due_date = ?, total_amount = ?, vat_amount = ?, status = ?, payment_mode = ?, payment_reference = ?
            WHERE id = ?
          `).run(invoice_number, customer_id, project_id, date, due_date, total_amount, tax_amount, status || 'pending', payment_mode || null, payment_reference || null, id);
          
          db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(id);
        } else {
          const info = db.prepare(`
            INSERT INTO invoices (invoice_number, customer_id, project_id, date, due_date, total_amount, vat_amount, status, payment_mode, payment_reference)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(invoice_number, customer_id, project_id, date, due_date, total_amount, tax_amount, status || 'pending', payment_mode || null, payment_reference || null);
          invoiceId = info.lastInsertRowid;
        }

        if (items && Array.isArray(items)) {
          const insertItem = db.prepare(`
            INSERT INTO invoice_items (invoice_id, account_id, description, amount, tax_amount)
            VALUES (?, ?, ?, ?, ?)
          `);
          for (const item of items) {
            insertItem.run(invoiceId, parseAccountId(item.account_id), item.description, item.amount, item.tax_amount);
          }
        }

        // Handle project ledger integration if project_id is provided
        if (project_id) {
            db.prepare(`
                INSERT INTO project_ledger (project_id, date, description, reference, amount, type)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(project_id, date, `Invoice: ${invoice_number}`, invoice_number, total_amount, 'revenue');
        }

        return invoiceId;
      });

      const finalId = transaction();
      res.json({ id: finalId, message: 'Invoice saved successfully' });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: 'Failed to save invoice', details: err.message });
    }
  });

  app.get('/api/invoices/:id', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      const invoice = db.prepare(`
        SELECT i.*, c.name as customer_name 
        FROM invoices i 
        LEFT JOIN customers c ON i.customer_id = c.id
        WHERE i.id = ?
      `).get(id) as any;
      if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
      
      const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(id);
      res.json({ ...invoice, items });
    } catch (err: any) {
      res.status(500).json({ error: 'Database error', details: err.message });
    }
  });

  app.post('/api/invoices', authenticate, (req, res) => {
    try {
      const { invoice_number, customer_id, date, due_date, total_amount, vat_amount, payment_mode, payment_reference } = req.body;
      const info = db.prepare(`
        INSERT INTO invoices (invoice_number, customer_id, date, due_date, total_amount, vat_amount, payment_mode, payment_reference)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(invoice_number, customer_id, date, due_date, total_amount, vat_amount, payment_mode || 'Cash', payment_reference || '');
      res.json({ id: info.lastInsertRowid });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create invoice', details: err.message });
    }
  });

  app.put('/api/invoices/:id', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      const { invoice_number, customer_id, date, due_date, total_amount, vat_amount, status, payment_mode, payment_reference } = req.body;
      db.prepare(`
        UPDATE invoices 
        SET invoice_number = ?, customer_id = ?, date = ?, due_date = ?, total_amount = ?, vat_amount = ?, status = ?, payment_mode = ?, payment_reference = ?
        WHERE id = ?
      `).run(invoice_number, customer_id, date, due_date, total_amount, vat_amount, status, payment_mode || 'Cash', payment_reference || '', id);
      res.json({ message: 'Invoice updated' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update invoice', details: err.message });
    }
  });

  app.delete('/api/invoices/:id', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM invoices WHERE id = ?').run(id);
      res.json({ message: 'Invoice deleted' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete invoice', details: err.message });
    }
  });

  // --- SALES ORDERS ---
  app.get('/api/sales-orders', authenticate, (req, res) => {
    try {
      const orders = db.prepare(`
        SELECT so.*, c.name as customer_name 
        FROM sales_orders so
        LEFT JOIN customers c ON so.customer_id = c.id
        ORDER BY so.date DESC
      `).all();
      res.json(orders);
    } catch (err: any) {
      res.status(500).json({ error: 'Database error fetching sales orders', details: err.message });
    }
  });

  app.get('/api/sales-orders/:id', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      const order = db.prepare(`
        SELECT so.*, c.name as customer_name 
        FROM sales_orders so
        LEFT JOIN customers c ON so.customer_id = c.id
        WHERE so.id = ?
      `).get(id) as any;
      if (!order) return res.status(404).json({ error: 'Order not found' });
      
      const items = db.prepare('SELECT * FROM sales_order_items WHERE sales_order_id = ?').all(id);
      res.json({ ...order, items });
    } catch (err: any) {
      res.status(500).json({ error: 'Database error', details: err.message });
    }
  });

  app.delete('/api/sales-orders/:id', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      const transaction = db.transaction(() => {
        db.prepare('DELETE FROM sales_order_items WHERE sales_order_id = ?').run(id);
        db.prepare('DELETE FROM sales_orders WHERE id = ?').run(id);
      });
      transaction();
      res.json({ message: 'Sales order deleted' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete sales order', details: err.message });
    }
  });

  app.post('/api/sales-orders', authenticate, (req, res) => {
    try {
      const { 
        order_number, 
        customer_id, 
        date, 
        project_name,
        valid_until,
        revision,
        total_amount, 
        discount,
        tax_amount, 
        description,
        items 
      } = req.body;

      const insertOrder = db.prepare(`
        INSERT INTO sales_orders (order_number, customer_id, date, project_name, valid_until, revision, total_amount, discount, tax_amount, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const insertItem = db.prepare(`
        INSERT INTO sales_order_items (sales_order_id, sn, description, unit, qty, unit_price, amount, is_lot, image_url, sub_category)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertProject = db.prepare(`
        INSERT INTO projects (name, client_name, budget, start_date, status)
        VALUES (?, ?, ?, ?, 'active')
      `);

      const getCustomerName = db.prepare('SELECT name FROM customers WHERE id = ?');

      const transaction = db.transaction((orderData: any) => {
        const info = insertOrder.run(
          orderData.order_number, 
          orderData.customer_id, 
          orderData.date, 
          orderData.project_name || null,
          orderData.valid_until || null,
          orderData.revision || null,
          orderData.total_amount || 0, 
          orderData.discount || 0,
          orderData.tax_amount || 0,
          orderData.description || null
        );
        const orderId = info.lastInsertRowid;
        
        if (orderData.items && Array.isArray(orderData.items)) {
          for (const item of orderData.items) {
            insertItem.run(
              orderId, 
              item.sn,
              item.description, 
              item.unit, 
              item.qty, 
              item.unit_price, 
              item.amount,
              item.is_lot ? 1 : 0,
              item.image_url,
              item.sub_category || item.subCategory || null
            );
          }
        }

        // Auto-create project
        if (orderData.project_name) {
          const customer = getCustomerName.get(orderData.customer_id) as any;
          const clientName = customer ? customer.name : '';
          insertProject.run(orderData.project_name, clientName, orderData.total_amount, orderData.date);
        }

        return orderId;
      });

      const orderId = transaction({ order_number, customer_id, date, project_name, valid_until, revision, total_amount, discount, tax_amount, items });
      res.json({ id: orderId });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create sales order', details: err.message });
    }
  });

  app.put('/api/sales-orders/:id', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      const { 
        order_number, 
        customer_id, 
        date, 
        project_name,
        valid_until,
        revision,
        total_amount, 
        discount,
        tax_amount,
        status,
        description,
        items 
      } = req.body;

      const transaction = db.transaction(() => {
        db.prepare(`
          UPDATE sales_orders 
          SET order_number = ?, customer_id = ?, date = ?, project_name = ?, valid_until = ?, revision = ?, total_amount = ?, discount = ?, tax_amount = ?, status = ?, description = ?
          WHERE id = ?
        `).run(order_number, customer_id, date, project_name || null, valid_until || null, revision || null, total_amount || 0, discount || 0, tax_amount || 0, status || 'open', description || null, id);

        db.prepare('DELETE FROM sales_order_items WHERE sales_order_id = ?').run(id);

        const insertItem = db.prepare(`
          INSERT INTO sales_order_items (sales_order_id, sn, description, unit, qty, unit_price, amount, is_lot, image_url, sub_category)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        if (items && Array.isArray(items)) {
          for (const item of items) {
            insertItem.run(
              id, 
              item.sn,
              item.description, 
              item.unit, 
              item.qty, 
              item.unitPrice || item.unit_price || 0, 
              item.amount || 0,
              item.isLot || item.is_lot ? 1 : 0,
              item.image || item.image_url || null,
              item.subCategory || item.sub_category || null
            );
          }
        }
      });

      transaction();
      res.json({ message: 'Sales order updated' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update sales order', details: err.message });
    }
  });

  app.post('/api/quotations/save', authenticate, (req, res) => {
    try {
      const { 
        id,
        quotation_number, 
        date, 
        customer_name, 
        customer_id, 
        project_name, 
        total_amount, 
        discount, 
        tax_amount, 
        valid_until, 
        revision, 
        parent_id,
        description,
        terms_and_conditions,
        notes_json,
        status,
        items 
      } = req.body;

      const transaction = db.transaction(() => {
        let quoteId = id;
        
        if (quoteId) {
          db.prepare(`
            UPDATE quotations 
            SET date = ?, customer_name = ?, customer_id = ?, project_name = ?, total_amount = ?, discount = ?, tax_amount = ?, valid_until = ?, revision = ?, parent_id = ?, description = ?, terms_and_conditions = ?, notes_json = ?, status = COALESCE(?, 'sent')
            WHERE id = ?
          `).run(date, customer_name, customer_id, project_name, total_amount, discount, tax_amount, valid_until, revision, parent_id || quoteId, description || null, terms_and_conditions || null, notes_json || null, status || 'sent', quoteId);
          
          // Delete old items to refresh
          db.prepare('DELETE FROM quotation_items WHERE quotation_id = ?').run(quoteId);
        } else {
          const info = db.prepare(`
            INSERT INTO quotations (quotation_number, date, customer_name, customer_id, project_name, total_amount, discount, tax_amount, valid_until, revision, parent_id, description, terms_and_conditions, notes_json, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(quotation_number, date, customer_name, customer_id, project_name, total_amount, discount, tax_amount, valid_until, revision, parent_id || null, description || null, terms_and_conditions || null, notes_json || null, status || 'sent');
          quoteId = info.lastInsertRowid;
          
          if (!parent_id) {
            // New base quotation, it is its own parent
            db.prepare('UPDATE quotations SET parent_id = ? WHERE id = ?').run(quoteId, quoteId);
          }
        }

        // Insert new items
        const insertItem = db.prepare(`
          INSERT INTO quotation_items (quotation_id, sn, description, unit, qty, unit_price, amount, is_lot, image_url, sub_category)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        if (items && Array.isArray(items)) {
          for (const item of items) {
            insertItem.run(
              quoteId, 
              item.sn, 
              item.description, 
              item.unit, 
              item.qty, 
              item.unitPrice || item.unit_price || 0, 
              item.amount || 0, 
              item.isLot || item.is_lot ? 1 : 0, 
              item.image || item.image_url || null,
              item.subCategory || item.sub_category || null
            );
          }
        }

        return quoteId;
      });

      const savedId = transaction();
      res.json({ id: savedId, message: 'Quotation saved successfully' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to save quotation', details: err.message });
    }
  });

  app.post('/api/quotations/:id/revise', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      const original = db.prepare('SELECT * FROM quotations WHERE id = ?').get(id) as any;
      if (!original) return res.status(404).json({ error: 'Original quotation not found' });

      // Fetch items in order to ensure reconstruction works correctly
      const items = db.prepare('SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY id ASC').all(id) as any[];

      // Calculate next revision number
      let nextRevNum = 1;
      const revMatch = original.revision?.match(/R(\d+)/i);
      if (revMatch) {
        nextRevNum = parseInt(revMatch[1]) + 1;
      } else {
        const latest = db.prepare('SELECT revision FROM quotations WHERE parent_id = ? ORDER BY id DESC LIMIT 1').get(original.parent_id || original.id) as any;
        if (latest) {
          const lRevMatch = latest.revision?.match(/R(\d+)/i);
          if (lRevMatch) nextRevNum = parseInt(lRevMatch[1]) + 1;
        }
      }
      const nextRevision = `R${nextRevNum}`;

      const transaction = db.transaction(() => {
        // Create new quotation record - including missing fields
        const info = db.prepare(`
          INSERT INTO quotations (
            quotation_number, date, customer_name, customer_id, project_name, 
            total_amount, discount, tax_amount, valid_until, revision, 
            parent_id, description, terms_and_conditions, notes_json, status
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'sent')
        `).run(
          original.quotation_number,
          new Date().toISOString().split('T')[0],
          original.customer_name,
          original.customer_id,
          original.project_name,
          original.total_amount,
          original.discount,
          original.tax_amount,
          original.valid_until,
          nextRevision,
          original.parent_id || original.id,
          original.description || null,
          original.terms_and_conditions || null,
          original.notes_json || null
        );
        const newId = info.lastInsertRowid;

        // Clone items
        const insertItem = db.prepare(`
          INSERT INTO quotation_items (quotation_id, sn, description, unit, qty, unit_price, amount, is_lot, sub_category, parent_id, image_url)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const item of items) {
          insertItem.run(
            newId,
            item.sn,
            item.description,
            item.unit,
            item.qty,
            item.unit_price,
            item.amount,
            item.is_lot,
            item.sub_category,
            item.parent_id,
            item.image_url
          );
        }

        return newId;
      });

      const newQuoteId = transaction();
      res.json({ id: newQuoteId, revision: nextRevision, message: 'New revision created successfully' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create revision', details: err.message });
    }
  });

  app.get('/api/quotations/compare/:id1/:id2', authenticate, (req, res) => {
    try {
      const { id1, id2 } = req.params;
      
      const q1 = db.prepare('SELECT * FROM quotations WHERE id = ?').get(id1) as any;
      const q2 = db.prepare('SELECT * FROM quotations WHERE id = ?').get(id2) as any;
      
      if (!q1 || !q2) return res.status(404).json({ error: 'One or both quotations not found' });
      
      const items1 = db.prepare('SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY sn ASC').all(q1.id) as any[];
      const items2 = db.prepare('SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY sn ASC').all(q2.id) as any[];
      
      // We'll return a structure that maps items by SN for easy comparison
      res.json({
        q1: { ...q1, items: items1 },
        q2: { ...q2, items: items2 }
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to compare quotations', details: err.message });
    }
  });

  app.get('/api/quotations/compare-multi/:ids', authenticate, (req, res) => {
    try {
      const { ids } = req.params;
      const idArray = ids.split(',').map(Number);
      
      const quotations = idArray.map(id => {
        const q = db.prepare('SELECT * FROM quotations WHERE id = ?').get(id) as any;
        if (!q) return null;
        const items = db.prepare('SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY sn ASC').all(id) as any[];
        return { ...q, items };
      }).filter(Boolean);
      
      res.json(quotations);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to compare multi quotations', details: err.message });
    }
  });

  app.post('/api/quotations/:id/confirm', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      const { order_number, date } = req.body;
      console.log(`[APPROVAL] Attempting to confirm quotation ID: ${id} with Order No: ${order_number}`);

      // 1. Find Quotation - support both inner ID and quotation_number string
      let quotation = db.prepare('SELECT * FROM quotations WHERE id = ?').get(id) as any;
      if (!quotation) {
        quotation = db.prepare('SELECT * FROM quotations WHERE quotation_number = ? ORDER BY id DESC LIMIT 1').get(id) as any;
      }

      if (!quotation) {
        console.error(`[APPROVAL] Quotation not found for ID/No: ${id}`);
        return res.status(404).json({ error: 'Quotation not found' });
      }

      const currentStatus = (quotation.status || '').toLowerCase();
      if (currentStatus === 'confirmed' || currentStatus === 'approved' || currentStatus === 'salesorder') {
        console.warn(`[APPROVAL] Quotation ${quotation.quotation_number} already in terminal state: ${currentStatus}`);
        return res.status(400).json({ error: 'This quotation is already processed' });
      }

      const items = db.prepare('SELECT * FROM quotation_items WHERE quotation_id = ?').all(quotation.id);
      
      const insertOrder = db.prepare(`
        INSERT INTO sales_orders (order_number, quotation_id, customer_id, date, total_amount, tax_amount, project_name, valid_until, revision, discount, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertItem = db.prepare(`
        INSERT INTO sales_order_items (sales_order_id, sn, description, unit, qty, unit_price, amount, is_lot, image_url, sub_category)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const updateQuotation = db.prepare("UPDATE quotations SET status = 'confirmed' WHERE id = ?");

      const insertProject = db.prepare(`
        INSERT INTO projects (name, client_name, budget, start_date, description)
        VALUES (?, ?, ?, ?, ?)
      `);

      const insertLedger = db.prepare(`
        INSERT INTO project_ledger (project_id, date, description, reference, amount, type)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      let result: any;
      const transaction = db.transaction(() => {
        // Find or Create Customer
        let customerId = quotation.customer_id;
        if (!customerId || isNaN(Number(customerId))) {
          const cust = db.prepare('SELECT id FROM customers WHERE name = ?').get(quotation.customer_name) as any;
          customerId = cust ? cust.id : db.prepare('INSERT INTO customers (name) VALUES (?)').run(quotation.customer_name).lastInsertRowid;
        }

        // Create Sales Order
        const orderInfo = insertOrder.run(
          order_number, 
          quotation.id, 
          customerId, 
          date, 
          quotation.total_amount, 
          quotation.tax_amount, 
          quotation.project_name, 
          quotation.valid_until, 
          quotation.revision, 
          quotation.discount, 
          quotation.description || null
        );
        const orderId = orderInfo.lastInsertRowid;

        for (const item of items as any[]) {
          insertItem.run(orderId, item.sn, item.description, item.unit, item.qty, item.unit_price, item.amount, item.is_lot || 0, item.image_url || null, item.sub_category || null);
        }

        // Create Project
        const projInfo = insertProject.run(
          quotation.project_name || `Project for ${quotation.quotation_number}`,
          quotation.customer_name,
          quotation.total_amount,
          date,
          `Converted from Quotation ${quotation.quotation_number}`
        );
        const projectId = projInfo.lastInsertRowid;

        // Initial Ledger Entry
        insertLedger.run(
          projectId,
          date,
          `Initial Budget from ${quotation.quotation_number}`,
          order_number,
          quotation.total_amount,
          'revenue'
        );

        updateQuotation.run(quotation.id);
        return { orderId, projectId };
      });

      result = transaction();
      console.log(`[APPROVAL SUCCESS] Created Order ID: ${result.orderId}, Project ID: ${result.projectId}`);
      res.json({ id: result.orderId, projectId: result.projectId, message: 'Proposal confirmed and converted successfully' });
    } catch (err: any) {
      console.error('[APPROVAL ERROR]', err);
      if (err.message?.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: 'Sales Order Number already exists' });
      }
      res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
  });

  // --- FINANCIAL SUMMARY APIs ---
  app.get('/api/company/financial-summary', authenticate, (req: any, res) => {
    try {
      const revenue = db.prepare(`
        SELECT SUM(amount) as total FROM project_ledger WHERE type = 'revenue'
      `).get() as { total: number };
      
      const expenses = db.prepare(`
        SELECT SUM(ABS(amount)) as total FROM project_ledger WHERE type = 'expense'
      `).get() as { total: number };

      // Better yet, use specific tables for higher precision if ledger isn't fully synced
      const invoiceTotal = db.prepare(`SELECT SUM(total_amount) as total FROM invoices WHERE status = 'paid'`).get() as { total: number };
      const billTotal = db.prepare(`SELECT SUM(total_amount) as total FROM bills WHERE status = 'paid'`).get() as { total: number };

      const projects = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
      const activeProjects = db.prepare("SELECT COUNT(*) as count FROM projects WHERE status = 'active'").get() as { count: number };

      res.json({
        totalRevenue: revenue.total || invoiceTotal.total || 0,
        totalExpenses: expenses.total || billTotal.total || 0,
        profit: (revenue.total || invoiceTotal.total || 0) - (expenses.total || billTotal.total || 0),
        totalProjects: projects.count,
        activeProjects: activeProjects.count
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch company summary', details: err.message });
    }
  });

  app.get('/api/projects/:id/financial-summary', authenticate, (req: any, res) => {
    try {
      const { id } = req.params;
      const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any;
      if (!project) return res.status(404).json({ error: 'Project not found' });

      const income = db.prepare(`
        SELECT SUM(amount) as total FROM project_ledger WHERE project_id = ? AND type = 'revenue'
      `).get(id) as { total: number };

      const outgoings = db.prepare(`
        SELECT SUM(ABS(amount)) as total FROM project_ledger WHERE project_id = ? AND type = 'expense'
      `).get(id) as { total: number };

      const invoices = db.prepare(`
        SELECT SUM(total_amount) as total FROM invoices WHERE project_id = ?
      `).get(id) as { total: number };

      const bills = db.prepare(`
        SELECT SUM(total_amount) as total FROM bills WHERE project_id = ?
      `).get(id) as { total: number };

      res.json({
        projectName: project.name,
        budget: project.budget,
        revenue: income.total || invoices.total || 0,
        expenses: outgoings.total || bills.total || 0,
        margin: (income.total || invoices.total || 0) - (outgoings.total || bills.total || 0),
        budgetUtilization: project.budget > 0 ? ((outgoings.total || bills.total || 0) / project.budget) * 100 : 0
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch project summary', details: err.message });
    }
  });

  // --- PROJECT LEDGER API ---
  app.get('/api/projects/:id/ledger', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      const ledger = db.prepare('SELECT * FROM project_ledger WHERE project_id = ? ORDER BY date DESC').all(id);
      res.json(ledger);
    } catch (err: any) {
      res.status(500).json({ error: 'Database error', details: err.message });
    }
  });

  app.post('/api/projects/:id/ledger', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      const { date, description, reference, amount, type } = req.body;
      const info = db.prepare(`
        INSERT INTO project_ledger (project_id, date, description, reference, amount, type)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, date, description, reference, amount, type);
      res.json({ id: info.lastInsertRowid });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to add ledger entry', details: err.message });
    }
  });

  app.delete('/api/project-ledger/:id', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM project_ledger WHERE id = ?').run(id);
      res.json({ message: 'Ledger entry deleted' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete ledger entry', details: err.message });
    }
  });

  // --- PURCHASES: Bills & Suppliers ---
  app.get('/api/suppliers', authenticate, (req, res) => {
    try {
      const suppliers = db.prepare('SELECT * FROM suppliers').all();
      res.json(suppliers);
    } catch (err: any) {
      res.status(500).json({ error: 'Database error', details: err.message });
    }
  });

  app.get('/api/suppliers/:id', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);
      if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
      res.json(supplier);
    } catch (err: any) {
      res.status(500).json({ error: 'Database error', details: err.message });
    }
  });

  app.post('/api/suppliers', authenticate, (req, res) => {
    try {
      const { name, contact_person, email, phone, address, vat_number } = req.body;
      const info = db.prepare(`
        INSERT INTO suppliers (name, contact_person, email, phone, address, vat_number)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(name, contact_person, email, phone, address, vat_number);
      res.json({ id: info.lastInsertRowid });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create supplier', details: err.message });
    }
  });

  app.put('/api/suppliers/:id', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      const { name, contact_person, email, phone, address, vat_number } = req.body;
      db.prepare(`
        UPDATE suppliers 
        SET name = ?, contact_person = ?, email = ?, phone = ?, address = ?, vat_number = ?
        WHERE id = ?
      `).run(name, contact_person, email, phone, address, vat_number, id);
      res.json({ message: 'Supplier updated' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update supplier', details: err.message });
    }
  });

  app.delete('/api/suppliers/:id', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM suppliers WHERE id = ?').run(id);
      res.json({ message: 'Supplier deleted' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete supplier', details: err.message });
    }
  });

  // --- UNITS API ---
  app.get('/api/units', authenticate, (req, res) => {
    try {
      const units = db.prepare('SELECT * FROM units ORDER BY name ASC').all();
      res.json(units);
    } catch (err: any) {
      res.status(500).json({ error: 'Database error', details: err.message });
    }
  });

  app.post('/api/units', authenticate, (req, res) => {
    try {
      const { name } = req.body;
      const info = db.prepare('INSERT INTO units (name) VALUES (?)').run(name);
      res.json({ id: info.lastInsertRowid });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create unit', details: err.message });
    }
  });

  app.put('/api/units/:id', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      db.prepare('UPDATE units SET name = ? WHERE id = ?').run(name, id);
      res.json({ message: 'Unit updated' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update unit', details: err.message });
    }
  });

  app.delete('/api/units/:id', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM units WHERE id = ?').run(id);
      res.json({ message: 'Unit deleted' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete unit', details: err.message });
    }
  });

  app.get('/api/bills', authenticate, (req, res) => {
    try {
      const bills = db.prepare(`
        SELECT b.*, s.name as vendor_name, p.name as project_name
        FROM bills b 
        LEFT JOIN suppliers s ON b.supplier_id = s.id
        LEFT JOIN projects p ON b.project_id = p.id
        ORDER BY b.date DESC
      `).all();
      res.json(bills);
    } catch (err: any) {
      res.status(500).json({ error: 'Database error fetching bills', details: err.message });
    }
  });

  app.get('/api/bills/:id', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      const bill = db.prepare(`
        SELECT b.*, s.name as supplier_name, p.name as project_name
        FROM bills b 
        LEFT JOIN suppliers s ON b.supplier_id = s.id
        LEFT JOIN projects p ON b.project_id = p.id
        WHERE b.id = ?
      `).get(id);
      if (!bill) return res.status(404).json({ error: 'Bill not found' });
      
      const items = db.prepare('SELECT * FROM bill_items WHERE bill_id = ?').all(id);
      res.json({ ...bill, items });
    } catch (err: any) {
      res.status(500).json({ error: 'Database error', details: err.message });
    }
  });

  app.post('/api/bills/save', authenticate, (req, res) => {
    try {
      const { id, bill_number, supplier_id, project_id, date, due_date, total_amount, tax_amount, status, notes, items, payment_mode, payment_reference } = req.body;
      
      const transaction = db.transaction(() => {
        let billId = id;
        if (id) {
          db.prepare(`
            UPDATE bills 
            SET bill_number = ?, supplier_id = ?, project_id = ?, date = ?, due_date = ?, total_amount = ?, vat_amount = ?, status = ?, payment_mode = ?, payment_reference = ?
            WHERE id = ?
          `).run(bill_number, supplier_id, project_id, date, due_date, total_amount, tax_amount, status || 'unpaid', payment_mode || null, payment_reference || null, id);
          
          db.prepare('DELETE FROM bill_items WHERE bill_id = ?').run(id);
        } else {
          const info = db.prepare(`
            INSERT INTO bills (bill_number, supplier_id, project_id, date, due_date, total_amount, vat_amount, status, payment_mode, payment_reference)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(bill_number, supplier_id, project_id, date, due_date, total_amount, tax_amount, status || 'unpaid', payment_mode || null, payment_reference || null);
          billId = info.lastInsertRowid;
        }

        if (items && Array.isArray(items)) {
          const insertItem = db.prepare(`
            INSERT INTO bill_items (bill_id, account_id, description, amount, tax_amount)
            VALUES (?, ?, ?, ?, ?)
          `);
          for (const item of items) {
            insertItem.run(billId, parseAccountId(item.account_id), item.description, item.amount, item.tax_amount);
          }
        }

        // Handle project ledger integration if project_id is provided
        if (project_id) {
            db.prepare(`
                INSERT INTO project_ledger (project_id, date, description, reference, amount, type)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(project_id, date, `Bill: ${bill_number}`, bill_number, total_amount, 'expense');
        }

        return billId;
      });

      const finalId = transaction();
      res.json({ id: finalId, message: 'Bill saved successfully' });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: 'Failed to save bill', details: err.message });
    }
  });

  app.post('/api/bills', authenticate, (req: any, res) => {
    const { bill_number, supplier_id, date, due_date, total_amount, vat_amount, project_id, items, supplier_invoice_no, supplier_invoice_date, payment_mode, payment_reference } = req.body;
    
    // Start transaction
    const createBill = db.transaction((billData: any) => {
      const { lastInsertRowid: billId } = db.prepare(`
        INSERT INTO bills (bill_number, supplier_id, date, due_date, total_amount, vat_amount, project_id, supplier_invoice_no, supplier_invoice_date, payment_mode, payment_reference)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(billData.bill_number, billData.supplier_id, billData.date, billData.due_date, billData.total_amount, billData.vat_amount, billData.project_id, billData.supplier_invoice_no, billData.supplier_invoice_date, billData.payment_mode || 'Cash', billData.payment_reference || '');

      if (billData.items && billData.items.length > 0) {
        const itemInsert = db.prepare(`
          INSERT INTO bill_items (bill_id, inventory_item_id, description, qty, unit_price, discount, amount, tax_amount)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const updateStock = db.prepare(`
          UPDATE inventory_items 
          SET qty_on_hand = qty_on_hand + ?, 
              project_id = CASE WHEN project_id IS NULL THEN ? ELSE project_id END,
              location_type = CASE WHEN ? IS NOT NULL THEN 'project' ELSE location_type END
          WHERE id = ?
        `);

        const insertMovement = db.prepare(`
          INSERT INTO stock_movements (item_id, type, qty, date, reference)
          VALUES (?, 'inbound', ?, ?, ?)
        `);

        for (const item of billData.items) {
          const qty = Number(item.qty) || 0;
          const price = Number(item.unit_price) || 0;
          const discount = Number(item.discount) || 0;
          const tax = Number(item.tax) || 0;
          const finalTax = tax > 0 ? tax : (qty * price - discount) * 0.15; // default 15% if mapping fails

          itemInsert.run(billId, item.inventory_item_id || null, item.description, item.qty, price, discount, item.amount, finalTax);
          
          if (item.inventory_item_id) {
            updateStock.run(item.qty, billData.project_id, billData.project_id, item.inventory_item_id);
            insertMovement.run(item.inventory_item_id, item.qty, billData.date, `Bill: ${billData.bill_number}`);
          }
        }
      }

      // Also record in project ledger if linked
      if (billData.project_id) {
        db.prepare(`
          INSERT INTO project_ledger (project_id, date, description, reference, amount, type)
          VALUES (?, ?, ?, ?, ?, 'expense')
        `).run(billData.project_id, billData.date, `Purchase: ${billData.bill_number}`, billData.bill_number, -billData.total_amount);
      }

      return billId;
    });

    try {
      const id = createBill({ bill_number, supplier_id, date, due_date, total_amount, vat_amount, project_id, items, supplier_invoice_no, supplier_invoice_date, payment_mode, payment_reference });
      res.json({ id });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to record purchase', details: err.message });
    }
  });

  app.put('/api/bills/:id', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      const { bill_number, supplier_id, date, due_date, total_amount, vat_amount, project_id, status } = req.body;
      db.prepare(`
        UPDATE bills 
        SET bill_number = ?, supplier_id = ?, date = ?, due_date = ?, total_amount = ?, vat_amount = ?, project_id = ?, status = ?
        WHERE id = ?
      `).run(bill_number, supplier_id, date, due_date, total_amount, vat_amount, project_id, status, id);
      res.json({ message: 'Bill updated' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update bill', details: err.message });
    }
  });

  app.delete('/api/bills/:id', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM bills WHERE id = ?').run(id);
      res.json({ message: 'Bill deleted' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete bill', details: err.message });
    }
  });

  // --- INVENTORY: Items & Movements ---
  app.get('/api/inventory', authenticate, (req, res) => {
    try {
      const items = db.prepare(`
        SELECT i.*, p.name as project_name 
        FROM inventory_items i 
        LEFT JOIN projects p ON i.project_id = p.id
      `).all();
      res.json(items);
    } catch (err: any) {
      res.status(500).json({ error: 'Database error fetching inventory', details: err.message });
    }
  });

  app.get('/api/inventory/:id', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      const item = db.prepare('SELECT * FROM inventory_items WHERE id = ? OR sku = ?').get(id, id);
      if (!item) return res.status(404).json({ error: 'Inventory item not found' });
      res.json(item);
    } catch (err: any) {
      res.status(500).json({ error: 'Database error', details: err.message });
    }
  });

  app.get('/api/stock-movements', authenticate, (req, res) => {
    try {
      const movements = db.prepare(`
        SELECT sm.*, ii.name as item_name, ii.sku
        FROM stock_movements sm
        LEFT JOIN inventory_items ii ON sm.item_id = ii.id
        ORDER BY sm.date DESC
      `).all();
      res.json(movements);
    } catch (err: any) {
      res.status(500).json({ error: 'Database error fetching movements', details: err.message });
    }
  });

  app.post('/api/inventory', authenticate, (req, res) => {
    try {
      const { sku, name, category, unit, qty_on_hand, min_qty, cost_price, sale_price } = req.body;
      const info = db.prepare(`
        INSERT INTO inventory_items (sku, name, category, unit, qty_on_hand, min_qty, cost_price, sale_price)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(sku, name, category, unit, qty_on_hand || 0, min_qty || 0, cost_price || 0, sale_price || 0);
      res.json({ id: info.lastInsertRowid });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create inventory item', details: err.message });
    }
  });

  app.patch('/api/inventory/:id', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      const { qty_on_hand, min_qty, name, category, unit, cost_price, sale_price } = req.body;
      
      // Update logic - only update fields that are provided
      const fields = [];
      const values = [];
      
      if (qty_on_hand !== undefined) { fields.push('qty_on_hand = ?'); values.push(qty_on_hand); }
      if (min_qty !== undefined) { fields.push('min_qty = ?'); values.push(min_qty); }
      if (name !== undefined) { fields.push('name = ?'); values.push(name); }
      if (category !== undefined) { fields.push('category = ?'); values.push(category); }
      if (unit !== undefined) { fields.push('unit = ?'); values.push(unit); }
      if (cost_price !== undefined) { fields.push('cost_price = ?'); values.push(cost_price); }
      if (sale_price !== undefined) { fields.push('sale_price = ?'); values.push(sale_price); }
      
      if (fields.length === 0) return res.status(400).json({ error: 'No fields provided for update' });
      
      values.push(id);
      db.prepare(`UPDATE inventory_items SET ${fields.join(', ')} WHERE id = ?`).run(...values);
      res.json({ message: 'Inventory item updated' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update inventory item', details: err.message });
    }
  });

  app.delete('/api/inventory/:id', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM inventory_items WHERE id = ?').run(id);
      res.json({ message: 'Item deleted' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete item', details: err.message });
    }
  });

  // --- PROJECT TEMPLATE ITEMS ---
  app.get('/api/project-template-items', authenticate, (req, res) => {
    try {
      const items = db.prepare(`
        SELECT pti.*, pc.name as category_name
        FROM project_template_items pti
        LEFT JOIN project_categories pc ON pti.category_id = pc.id
      `).all();
      res.json(items);
    } catch (err: any) {
      res.status(500).json({ error: 'Database error', details: err.message });
    }
  });

  app.post('/api/project-template-items', authenticate, (req, res) => {
    try {
      const { name, description, unit, default_unit_price, category_id } = req.body;
      const info = db.prepare(`
        INSERT INTO project_template_items (name, description, unit, default_unit_price, category_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(name, description, unit, default_unit_price || 0, category_id);
      res.json({ id: info.lastInsertRowid });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create template item', details: err.message });
    }
  });

  app.patch('/api/project-template-items/:id', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, unit, default_unit_price, category_id } = req.body;
      const fields = [];
      const values = [];
      if (name !== undefined) { fields.push('name = ?'); values.push(name); }
      if (description !== undefined) { fields.push('description = ?'); values.push(description); }
      if (unit !== undefined) { fields.push('unit = ?'); values.push(unit); }
      if (default_unit_price !== undefined) { fields.push('default_unit_price = ?'); values.push(default_unit_price); }
      if (category_id !== undefined) { fields.push('category_id = ?'); values.push(category_id); }
      
      if (fields.length === 0) return res.status(400).json({ error: 'No fields provided' });
      values.push(id);
      db.prepare(`UPDATE project_template_items SET ${fields.join(', ')} WHERE id = ?`).run(...values);
      res.json({ message: 'Template item updated' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update template item', details: err.message });
    }
  });

  app.delete('/api/project-template-items/:id', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM project_template_items WHERE id = ?').run(id);
      res.json({ message: 'Template item deleted' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete template item', details: err.message });
    }
  });

  // --- PROJECT CATEGORIES ---
  app.get('/api/project-categories', authenticate, (req, res) => {
    try {
      const categories = db.prepare('SELECT * FROM project_categories ORDER BY id ASC').all();
      res.json(categories);
    } catch (err: any) {
      res.status(500).json({ error: 'Database error', details: err.message });
    }
  });

  app.post('/api/project-categories', authenticate, (req, res) => {
    try {
      const { name } = req.body;
      const info = db.prepare('INSERT INTO project_categories (name) VALUES (?)').run(name);
      res.json({ id: info.lastInsertRowid, name });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create category', details: err.message });
    }
  });

  app.patch('/api/project-categories/:id', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      db.prepare('UPDATE project_categories SET name = ? WHERE id = ?').run(name, id);
      res.json({ message: 'Category updated' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update category', details: err.message });
    }
  });

  app.delete('/api/project-categories/:id', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM project_categories WHERE id = ?').run(id);
      res.json({ message: 'Category deleted' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete category', details: err.message });
    }
  });

  // --- COMPANY DETAILS Management ---
  app.get('/api/company-details', authenticate, (req, res) => {
    try {
      const companies = db.prepare('SELECT * FROM company_details ORDER BY id DESC').all();
      res.json(companies);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch company details', details: err.message });
    }
  });

  app.post('/api/company-details', authenticate, (req: any, res) => {
    try {
      // Accessible by Admin or Manager
      if (req.user.role !== 'admin' && req.user.role !== 'manager') {
        return res.status(403).json({ error: 'Forbidden: Admin or Manager role required' });
      }

      const { id, name, cr_number, vat_number, address, city, country, email, website, phone, logo_url } = req.body;
      if (!name) return res.status(400).json({ error: 'Company name is required' });

      if (id) {
        db.prepare(`
          UPDATE company_details 
          SET name = ?, cr_number = ?, vat_number = ?, address = ?, city = ?, country = ?, email = ?, website = ?, phone = ?, logo_url = ?
          WHERE id = ?
        `).run(name, cr_number || '', vat_number || '', address || '', city || '', country || '', email || '', website || '', phone || '', logo_url || '', id);
        res.json({ message: 'Company details updated successfully' });
      } else {
        const info = db.prepare(`
          INSERT INTO company_details (name, cr_number, vat_number, address, city, country, email, website, phone, logo_url)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(name, cr_number || '', vat_number || '', address || '', city || '', country || '', email || '', website || '', phone || '', logo_url || '');
        res.json({ message: 'Company created successfully', id: info.lastInsertRowid });
      }
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to save company details', details: err.message });
    }
  });

  app.delete('/api/company-details/:id', authenticate, (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admin role required' });
      }
      const { id } = req.params;
      db.prepare('DELETE FROM company_details WHERE id = ?').run(id);
      res.json({ message: 'Company deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete company', details: err.message });
    }
  });

  // --- USER MANAGEMENT (ADMIN ONLY) ---
  const authorize = (role: string) => (req: any, res: any, next: any) => {
    if (req.user && req.user.role === role) {
      next();
    } else {
      res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
  };

  app.get('/api/users', authenticate, authorize('admin'), (req, res) => {
    try {
      const users = db.prepare('SELECT id, username, role, created_at FROM users').all();
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch users', details: err.message });
    }
  });

  app.post('/api/users', authenticate, authorize('admin'), (req, res) => {
    try {
      const { username, password, role } = req.body;
      const hashedPassword = bcrypt.hashSync(password, 10);
      const info = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(username, hashedPassword, role || 'user');
      res.json({ id: info.lastInsertRowid });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create user', details: err.message });
    }
  });

  app.put('/api/users/:id', authenticate, authorize('admin'), (req, res) => {
    try {
      const { id } = req.params;
      const { username, password, role } = req.body;
      
      if (password) {
        const hashedPassword = bcrypt.hashSync(password, 10);
        db.prepare('UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?').run(username, hashedPassword, role, id);
      } else {
        db.prepare('UPDATE users SET username = ?, role = ? WHERE id = ?').run(username, role, id);
      }

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update user', details: err.message });
    }
  });

  app.put('/api/users/profile', authenticate, (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { username, password } = req.body;
      if (password) {
        const hashedPassword = bcrypt.hashSync(password, 10);
        db.prepare('UPDATE users SET username = ?, password = ? WHERE id = ?').run(username, hashedPassword, userId);
      } else {
        db.prepare('UPDATE users SET username = ? WHERE id = ?').run(username, userId);
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update profile', details: err.message });
    }
  });

  app.delete('/api/users/:id', authenticate, authorize('admin'), (req: any, res) => {
    try {
      const { id } = req.params;
      // Prevent deleting self
      if (Number(id) === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete your own admin account' });
      }
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
      res.json({ message: 'User deleted' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete user', details: err.message });
    }
  });

  // --- ACCOUNTING: Ledgers ---
  app.get('/api/ledgers', authenticate, (req, res) => {
    try {
      const ledgers = db.prepare(`
        SELECT l.*, c.name as account_name, c.code as account_code
        FROM ledgers l
        JOIN chart_of_accounts c ON l.account_id = c.id
      `).all();
      res.json(ledgers);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch ledgers', details: err.message });
    }
  });

  app.post('/api/ledgers', authenticate, (req, res) => {
    try {
      const { name, account_id } = req.body;
      const parsedId = parseAccountId(account_id);
      const info = db.prepare('INSERT INTO ledgers (name, account_id) VALUES (?, ?)').run(name, parsedId);
      res.status(201).json({ id: info.lastInsertRowid, name, account_id: parsedId });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to save ledger', details: err.message });
    }
  });

  app.delete('/api/ledgers/:id', authenticate, (req, res) => {
    try {
      db.prepare('DELETE FROM ledgers WHERE id = ?').run(req.params.id);
      res.json({ message: 'Ledger deleted' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete ledger', details: err.message });
    }
  });

  // --- ACCOUNTING: Chart of Accounts, Journals, Recon ---
  app.get('/api/coa', authenticate, (req, res) => {
    try {
      const accounts = db.prepare(`
        SELECT 
          a.*,
          (SELECT SUM(debit) - SUM(credit) FROM journal_items WHERE account_id = a.id) as balance,
          (SELECT group_concat(name, ' / ') FROM ledgers WHERE account_id = a.id) as ledgers
        FROM chart_of_accounts a
      `).all() as any[];
      
      const allLedgers = db.prepare('SELECT * FROM ledgers').all() as any[];
      const enrichedAccounts: any[] = [];
      
      accounts.forEach((a: any) => {
        const accountLedgers = allLedgers.filter(l => l.account_id === a.id);
        if (accountLedgers.length > 0) {
          accountLedgers.forEach(l => {
            enrichedAccounts.push({
              ...a,
              id: `${a.id}|${l.id}`,
              actual_account_id: a.id,
              display_name: `[Ledger: ${l.name}]`
            });
          });
        } else {
          enrichedAccounts.push({
            ...a,
            id: a.id.toString(),
            actual_account_id: a.id,
            display_name: `${a.code} - ${a.name}`
          });
        }
      });
      res.json(enrichedAccounts);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch COA', details: err.message });
    }
  });

  app.post('/api/coa', authenticate, (req, res) => {
    try {
      const { code, name, type } = req.body;
      const info = db.prepare('INSERT INTO chart_of_accounts (code, name, type) VALUES (?, ?, ?)').run(code, name, type);
      res.json({ id: info.lastInsertRowid });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create account', details: err.message });
    }
  });

  app.get('/api/reports/daybook', authenticate, (req, res) => {
    try {
      const { date } = req.query;
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      const entries = db.prepare(`
        SELECT je.*, 
               (SELECT SUM(debit) FROM journal_items WHERE journal_entry_id = je.id) as total_debit
        FROM journal_entries je
        WHERE je.date = ?
        ORDER BY je.id ASC
      `).all(targetDate) as any[];

      const enrichedEntries = entries.map(entry => {
        const items = db.prepare(`
          SELECT ji.*, coa.name as account_name, coa.code as account_code
          FROM journal_items ji
          JOIN chart_of_accounts coa ON ji.account_id = coa.id
          WHERE ji.journal_entry_id = ?
        `).all(entry.id);
        return { ...entry, items };
      });

      res.json(enrichedEntries);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to generate day book', details: err.message });
    }
  });

  app.get('/api/reports/cashbook', authenticate, (req, res) => {
    try {
      const { account_id, from, to } = req.query;
      
      let effectiveAccountId = parseAccountId(account_id);
      if (!effectiveAccountId) {
        const defaultAccount = db.prepare(`
          SELECT id FROM chart_of_accounts 
          WHERE (name LIKE '%Cash%' OR name LIKE '%Bank%') AND type = 'Asset'
          LIMIT 1
        `).get() as any;
        effectiveAccountId = defaultAccount?.id;
      }

      if (!effectiveAccountId) {
        return res.json({ transactions: [], opening_balance: 0, closing_balance: 0 });
      }

      const startDate = from || new Date().toISOString().split('T')[0];
      const endDate = to || startDate;

      const openingRes = db.prepare(`
        SELECT SUM(ji.debit) - SUM(ji.credit) as balance
        FROM journal_items ji
        JOIN journal_entries je ON ji.journal_entry_id = je.id
        WHERE ji.account_id = ? AND je.date < ?
      `).get(effectiveAccountId, startDate) as any;
      
      const openingBalance = openingRes?.balance || 0;

      const transactions = db.prepare(`
        SELECT ji.*, je.date, je.description, je.reference
        FROM journal_items ji
        JOIN journal_entries je ON ji.journal_entry_id = je.id
        WHERE ji.account_id = ? AND je.date BETWEEN ? AND ?
        ORDER BY je.date ASC, je.id ASC
      `).all(effectiveAccountId, startDate, endDate) as any[];

      let currentBalance = openingBalance;
      const transactionsWithBalance = transactions.map(t => {
        currentBalance += (t.debit - t.credit);
        return { ...t, running_balance: currentBalance };
      });

      res.json({
        account_id: effectiveAccountId,
        opening_balance: openingBalance,
        transactions: transactionsWithBalance,
        closing_balance: currentBalance
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to generate cash book', details: err.message });
    }
  });

  app.get('/api/journal-entries', authenticate, (req, res) => {
    try {
      const entries = db.prepare(`
        SELECT je.*, 
               (SELECT SUM(debit) FROM journal_items WHERE journal_entry_id = je.id) as total_debit
        FROM journal_entries je
        ORDER BY je.date DESC
      `).all();
      res.json(entries);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch journal entries', details: err.message });
    }
  });

  app.get('/api/journal-entries/:id', authenticate, (req, res) => {
    try {
      const { id } = req.params;
      const entry = db.prepare('SELECT * FROM journal_entries WHERE id = ?').get(id) as any;
      if (!entry) return res.status(404).json({ error: 'Entry not found' });
      
      const items = db.prepare(`
        SELECT ji.*, a.name as account_name, a.code as account_code
        FROM journal_items ji
        JOIN chart_of_accounts a ON ji.account_id = a.id
        WHERE ji.journal_entry_id = ?
      `).all(id);
      
      res.json({ ...entry, items });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch entry details', details: err.message });
    }
  });

  app.post('/api/journal-entries', authenticate, (req, res) => {
    try {
      const { date, description, reference, items } = req.body;
      
      const transaction = db.transaction((data: any) => {
        const info = db.prepare('INSERT INTO journal_entries (date, description, reference) VALUES (?, ?, ?)').run(data.date, data.description, data.reference);
        const entryId = info.lastInsertRowid;
        
        const insertItem = db.prepare('INSERT INTO journal_items (journal_entry_id, account_id, debit, credit, memo) VALUES (?, ?, ?, ?, ?)');
        for (const item of data.items) {
          insertItem.run(entryId, parseAccountId(item.account_id), item.debit || 0, item.credit || 0, item.memo || '');
        }
        return entryId;
      });

      const entryId = transaction({ date, description, reference, items });
      res.json({ id: entryId });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create journal entry', details: err.message });
    }
  });

  app.get('/api/bank-reconciliations', authenticate, (req, res) => {
    try {
      const recons = db.prepare(`
        SELECT br.*, a.name as account_name
        FROM bank_reconciliations br
        JOIN chart_of_accounts a ON br.account_id = a.id
        ORDER BY br.statement_date DESC
      `).all();
      res.json(recons);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch reconciliations', details: err.message });
    }
  });

  app.get('/api/reconciliation/transactions/:accountId', authenticate, (req, res) => {
    try {
      const accountId = parseAccountId(req.params.accountId);
      
      // 1. Accounting entries (Journal Items)
      const journals = db.prepare(`
        SELECT 
          ji.id as id,
          'journal' as type,
          (ji.debit - ji.credit) as amount,
          je.date as date,
          je.description as description,
          je.reference as reference
        FROM journal_items ji
        JOIN journal_entries je ON ji.journal_entry_id = je.id
        WHERE ji.account_id = ?
      `).all(accountId) as any[];

      // 2. Received transactions (Invoices) - typically positive amounts on statement
      // We only include these if we're looking at a bank account (usually Asset)
      const invoices = db.prepare(`
        SELECT 
          id,
          'invoice' as type,
          total_amount as amount,
          date,
          invoice_number as reference,
          customer_id as description
        FROM invoices
      `).all() as any[];

      // 3. Expense transactions (Bills) - typically negative amounts on statement
      const bills = db.prepare(`
        SELECT 
          id,
          'bill' as type,
          (total_amount * -1) as amount,
          date,
          bill_number as reference,
          supplier_id as description
        FROM bills
      `).all() as any[];

      res.json([...journals, ...invoices, ...bills].sort((a, b) => b.date.localeCompare(a.date)));
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch transactions', details: err.message });
    }
  });

  app.post('/api/bank-reconciliations', authenticate, (req, res) => {
    try {
      const { account_id, statement_date, statement_balance, ledger_balance } = req.body;
      const info = db.prepare('INSERT INTO bank_reconciliations (account_id, statement_date, statement_balance, ledger_balance) VALUES (?, ?, ?, ?)').run(parseAccountId(account_id), statement_date, statement_balance, ledger_balance);
      res.json({ id: info.lastInsertRowid });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create reconciliation', details: err.message });
    }
  });

  // --- SALES DASHBOARD STATS ---
  app.get('/api/sales-dashboard-stats', authenticate, (req, res) => {
    try {
      const totalQuotes = db.prepare('SELECT COUNT(*) as count FROM quotations').get() as { count: number };
      const totalOrders = db.prepare('SELECT COUNT(*) as count FROM sales_orders').get() as { count: number };
      
      const statusBreakdown = db.prepare(`
        SELECT status as name, COUNT(*) as value 
        FROM quotations 
        GROUP BY status
      `).all();

      const ordersFromQuotes = db.prepare('SELECT COUNT(*) as count FROM sales_orders WHERE quotation_id IS NOT NULL').get() as { count: number };

      // Trend data (last 6 months)
      const trendData = db.prepare(`
        WITH RECURSIVE months(m) AS (
          SELECT date('now', '-5 months', 'start of month')
          UNION ALL
          SELECT date(m, '+1 month') FROM months WHERE m < date('now', 'start of month')
        )
        SELECT 
          strftime('%b %Y', m) as month,
          (SELECT COUNT(*) FROM quotations WHERE strftime('%Y-%m', date) = strftime('%Y-%m', m)) as quotes,
          (SELECT COUNT(*) FROM sales_orders WHERE strftime('%Y-%m', date) = strftime('%Y-%m', m)) as orders
        FROM months
      `).all();

      res.json({
        totalQuotes: totalQuotes.count,
        totalOrders: totalOrders.count,
        statusBreakdown,
        ordersFromQuotes: ordersFromQuotes.count,
        trendData
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch dashboard stats', details: err.message });
    }
  });

  // --- PURCHASE DASHBOARD STATS ---
  app.get('/api/purchase-dashboard-stats', authenticate, (req, res) => {
    try {
      const totalBills = db.prepare('SELECT COUNT(*) as count FROM bills').get() as { count: number };
      const totalSuppliers = db.prepare('SELECT COUNT(*) as count FROM suppliers').get() as { count: number };
      
      const statusBreakdown = db.prepare(`
        SELECT status as name, COUNT(*) as value 
        FROM bills 
        GROUP BY status
      `).all();

      const totalPayables = db.prepare('SELECT SUM(total_amount) as total FROM bills WHERE status != ?').get('paid') as { total: number };

      // Trend data (last 6 months)
      const trendData = db.prepare(`
        WITH RECURSIVE months(m) AS (
          SELECT date('now', '-5 months', 'start of month')
          UNION ALL
          SELECT date(m, '+1 month') FROM months WHERE m < date('now', 'start of month')
        )
        SELECT 
          strftime('%b %Y', m) as month,
          (SELECT SUM(total_amount) FROM bills WHERE strftime('%Y-%m', date) = strftime('%Y-%m', m)) as spending
        FROM months
      `).all();

      res.json({
        totalBills: totalBills.count,
        totalSuppliers: totalSuppliers.count,
        statusBreakdown,
        totalPayable: totalPayables.total || 0,
        trendData
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch purchase stats', details: err.message });
    }
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // --- ERROR HANDLING ---
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
