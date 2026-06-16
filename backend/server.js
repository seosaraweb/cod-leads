const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'cod_leads_secret_2024';

const DB_DIR = process.env.DB_PATH || path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(DB_DIR, 'uploads');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const db = new Database(path.join(DB_DIR, 'leads.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'support',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    base_price REAL DEFAULT 0,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Each image belongs to a product, optionally linked to a variant
  CREATE TABLE IF NOT EXISTS product_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  -- Variants: size and/or color combinations
  CREATE TABLE IF NOT EXISTS product_variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    size TEXT DEFAULT '',
    color TEXT DEFAULT '',
    price REAL DEFAULT 0,
    image_id INTEGER,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (image_id) REFERENCES product_images(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_ref TEXT UNIQUE NOT NULL,
    product_id INTEGER,
    product_name TEXT NOT NULL,
    variant_id INTEGER,
    variant_label TEXT DEFAULT '',
    client_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    price REAL DEFAULT 0,
    quantity INTEGER DEFAULT 1,
    notes TEXT DEFAULT '',
    status TEXT DEFAULT 'confirmée',
    support_id INTEGER,
    support_name TEXT NOT NULL,
    confirmed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migrations — add columns if they don't exist
try { db.exec("ALTER TABLE orders ADD COLUMN product_image TEXT DEFAULT ''"); } catch(e) {}
try { db.exec("ALTER TABLE orders ADD COLUMN variant_id INTEGER"); } catch(e) {}
try { db.exec("ALTER TABLE orders ADD COLUMN variant_label TEXT DEFAULT ''"); } catch(e) {}
try { db.exec("ALTER TABLE orders ADD COLUMN items TEXT DEFAULT '[]'"); } catch(e) {}

if (!db.prepare('SELECT id FROM users WHERE username = ?').get('admin')) {
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', bcrypt.hashSync('admin123', 10), 'admin');
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));
app.use('/uploads', express.static(UPLOADS_DIR));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `img_${Date.now()}_${Math.random().toString(36).slice(2,6)}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 }, fileFilter: (req, file, cb) => cb(null, /image/.test(file.mimetype)) });

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Non autorisé' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Token invalide' }); }
}
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin requis' });
  next();
}
function genRef() {
  const d = new Date();
  return `COD-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
}

function getProduct(id) {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!product) return null;
  const images = db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order').all(id);
  const variants = db.prepare('SELECT * FROM product_variants WHERE product_id = ? ORDER BY sort_order').all(id);
  return { ...product, images, variants };
}

// ── AUTH ──
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Identifiants incorrects' });
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '12h' });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

// ── PRODUCTS ──
app.get('/api/products', auth, (req, res) => {
  const products = db.prepare('SELECT * FROM products WHERE active = 1 ORDER BY name').all();
  res.json(products.map(p => getProduct(p.id)));
});

app.get('/api/products/all', auth, adminOnly, (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  res.json(products.map(p => getProduct(p.id)));
});

app.get('/api/products/:id', auth, (req, res) => {
  const p = getProduct(req.params.id);
  if (!p) return res.status(404).json({ error: 'Introuvable' });
  res.json(p);
});

// Create product (name, description, base_price only — images & variants added separately)
app.post('/api/products', auth, adminOnly, (req, res) => {
  const { name, description, base_price } = req.body;
  if (!name) return res.status(400).json({ error: 'Nom requis' });
  const r = db.prepare('INSERT INTO products (name, description, base_price) VALUES (?, ?, ?)').run(name, description||'', base_price||0);
  res.json(getProduct(r.lastInsertRowid));
});

app.put('/api/products/:id', auth, adminOnly, (req, res) => {
  const { name, description, base_price, active } = req.body;
  db.prepare('UPDATE products SET name=?, description=?, base_price=?, active=? WHERE id=?')
    .run(name, description||'', base_price||0, active===false||active==='0'?0:1, req.params.id);
  res.json(getProduct(req.params.id));
});

app.delete('/api/products/:id', auth, adminOnly, (req, res) => {
  db.prepare('UPDATE products SET active=0 WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ── PRODUCT IMAGES ──
app.post('/api/products/:id/images', auth, adminOnly, upload.array('images', 50), (req, res) => {
  const productId = req.params.id;
  const existing = db.prepare('SELECT MAX(sort_order) as m FROM product_images WHERE product_id = ?').get(productId);
  let order = (existing?.m || 0);
  const inserted = [];
  for (const file of req.files) {
    order++;
    const r = db.prepare('INSERT INTO product_images (product_id, filename, sort_order) VALUES (?, ?, ?)').run(productId, file.filename, order);
    inserted.push({ id: r.lastInsertRowid, filename: file.filename, sort_order: order });
  }
  res.json(inserted);
});

app.delete('/api/images/:id', auth, adminOnly, (req, res) => {
  const img = db.prepare('SELECT * FROM product_images WHERE id = ?').get(req.params.id);
  if (!img) return res.status(404).json({ error: 'Image introuvable' });
  // unlink file
  try { fs.unlinkSync(path.join(UPLOADS_DIR, img.filename)); } catch {}
  // remove variant links
  db.prepare('UPDATE product_variants SET image_id = NULL WHERE image_id = ?').run(req.params.id);
  db.prepare('DELETE FROM product_images WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.put('/api/products/:id/images/reorder', auth, adminOnly, (req, res) => {
  const { order } = req.body; // array of image ids
  order.forEach((imgId, idx) => {
    db.prepare('UPDATE product_images SET sort_order = ? WHERE id = ?').run(idx + 1, imgId);
  });
  res.json({ ok: true });
});

// ── PRODUCT VARIANTS ──
app.post('/api/products/:id/variants', auth, adminOnly, (req, res) => {
  const { variants } = req.body; // array of {size, color, price, image_id}
  db.prepare('DELETE FROM product_variants WHERE product_id = ?').run(req.params.id);
  const inserted = [];
  variants.forEach((v, idx) => {
    const r = db.prepare('INSERT INTO product_variants (product_id, size, color, price, image_id, sort_order) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.params.id, v.size||'', v.color||'', v.price||0, v.image_id||null, idx+1);
    inserted.push({ id: r.lastInsertRowid, ...v });
  });
  res.json(inserted);
});

// ── ORDERS ──
app.post('/api/orders', auth, (req, res) => {
  const { product_id, product_name, product_image, variant_id, variant_label, items, client_name, phone, address, city, price, quantity, notes } = req.body;
  if (!client_name || !phone || !address || !city)
    return res.status(400).json({ error: 'Champs obligatoires manquants' });

  // items = array of {product_name, variant_label, price, quantity, product_image}
  const itemsArr = items && items.length > 0 ? items : [{product_name: product_name||'', variant_label: variant_label||'', price: price||0, quantity: quantity||1, product_image: product_image||''}];
  
  // First item = main product info for backward compat
  const first = itemsArr[0];
  const totalPrice = itemsArr.reduce((s, i) => s + (i.price * i.quantity), 0);
  const mainName = itemsArr.length === 1 ? first.product_name : itemsArr.map(i => `${i.product_name}${i.variant_label?' ('+i.variant_label+')':''}${i.quantity>1?' x'+i.quantity:''}`).join(' + ');

  const ref = genRef();
  db.prepare(`INSERT INTO orders (order_ref,product_id,product_name,product_image,variant_id,variant_label,items,client_name,phone,address,city,price,quantity,notes,support_id,support_name) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(ref, product_id||null, mainName, first.product_image||'', variant_id||null, first.variant_label||'', JSON.stringify(itemsArr), client_name, phone, address, city, totalPrice, 1, notes||'', req.user.id, req.user.username);
  res.json(db.prepare('SELECT * FROM orders WHERE order_ref = ?').get(ref));
});

app.get('/api/orders', auth, (req, res) => {
  const { date_from, date_to, support_id, city, status, search } = req.query;
  let query = 'SELECT * FROM orders WHERE 1=1'; const params = [];
  if (date_from) { query += ' AND DATE(confirmed_at) >= ?'; params.push(date_from); }
  if (date_to)   { query += ' AND DATE(confirmed_at) <= ?'; params.push(date_to); }
  if (support_id) { query += ' AND support_id = ?'; params.push(support_id); }
  if (city)       { query += ' AND city LIKE ?'; params.push(`%${city}%`); }
  if (status)     { query += ' AND status = ?'; params.push(status); }
  if (search)     { query += ' AND (client_name LIKE ? OR phone LIKE ? OR order_ref LIKE ?)'; params.push(`%${search}%`,`%${search}%`,`%${search}%`); }
  if (req.user.role === 'support') { query += ' AND support_id = ?'; params.push(req.user.id); }
  res.json(db.prepare(query + ' ORDER BY confirmed_at DESC').all(...params));
});

app.get('/api/orders/stats', auth, (req, res) => {
  const d = req.query.date || new Date().toISOString().split('T')[0];
  res.json({
    todayCount: db.prepare('SELECT COUNT(*) as c FROM orders WHERE DATE(confirmed_at)=?').get(d).c,
    todayBySupport: db.prepare('SELECT support_name, COUNT(*) as count FROM orders WHERE DATE(confirmed_at)=? GROUP BY support_name ORDER BY count DESC').all(d),
    todayByCity: db.prepare('SELECT city, COUNT(*) as count FROM orders WHERE DATE(confirmed_at)=? GROUP BY city ORDER BY count DESC LIMIT 10').all(d),
    totalCount: db.prepare('SELECT COUNT(*) as c FROM orders').get().c,
    totalByStatus: db.prepare('SELECT status, COUNT(*) as count FROM orders GROUP BY status').all(),
    date: d
  });
});

app.put('/api/orders/:id/status', auth, (req, res) => {
  const valid = ['confirmée','expédiée','livrée','annulée','retournée'];
  if (!valid.includes(req.body.status)) return res.status(400).json({ error: 'Statut invalide' });
  const order = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Introuvable' });
  if (req.user.role === 'support' && order.support_id !== req.user.id) return res.status(403).json({ error: 'Non autorisé' });
  db.prepare('UPDATE orders SET status=? WHERE id=?').run(req.body.status, req.params.id);
  res.json({ ok: true });
});

app.put('/api/orders/:id', auth, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Introuvable' });
  if (req.user.role === 'support' && order.support_id !== req.user.id) return res.status(403).json({ error: 'Non autorisé' });
  const { client_name, phone, address, city, notes, price, quantity } = req.body;
  db.prepare('UPDATE orders SET client_name=?, phone=?, address=?, city=?, notes=?, price=?, quantity=? WHERE id=?')
    .run(client_name, phone, address, city, notes||'', price, quantity, req.params.id);
  res.json(db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id));
});

app.delete('/api/orders/:id', auth, adminOnly, (req, res) => {
  db.prepare('DELETE FROM orders WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ── USERS ──
app.get('/api/users', auth, adminOnly, (req, res) => res.json(db.prepare('SELECT id, username, role, created_at FROM users ORDER BY username').all()));
app.post('/api/users', auth, adminOnly, (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Champs requis' });
  try {
    const r = db.prepare('INSERT INTO users (username, password, role) VALUES (?,?,?)').run(username, bcrypt.hashSync(password, 10), role||'support');
    res.json({ id: r.lastInsertRowid, username, role: role||'support' });
  } catch { res.status(400).json({ error: 'Utilisateur déjà existant' }); }
});
app.put('/api/users/:id/password', auth, adminOnly, (req, res) => {
  db.prepare('UPDATE users SET password=? WHERE id=?').run(bcrypt.hashSync(req.body.password, 10), req.params.id);
  res.json({ ok: true });
});
app.delete('/api/users/:id', auth, adminOnly, (req, res) => {
  if (req.params.id == req.user.id) return res.status(400).json({ error: 'Impossible' });
  db.prepare('DELETE FROM users WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ── EXPORT CSV ──
app.get('/api/export/csv', auth, (req, res) => {
  const { date_from, date_to, support_id, city, status } = req.query;
  let query = 'SELECT * FROM orders WHERE 1=1'; const params = [];
  if (date_from) { query += ' AND DATE(confirmed_at) >= ?'; params.push(date_from); }
  if (date_to)   { query += ' AND DATE(confirmed_at) <= ?'; params.push(date_to); }
  if (support_id) { query += ' AND support_id = ?'; params.push(support_id); }
  if (city)       { query += ' AND city LIKE ?'; params.push(`%${city}%`); }
  if (status)     { query += ' AND status = ?'; params.push(status); }
  if (req.user.role === 'support') { query += ' AND support_id = ?'; params.push(req.user.id); }
  const orders = db.prepare(query + ' ORDER BY confirmed_at DESC').all(...params);

  // Format matching WDV model: CODE SUIVI | DESTINATAIRE | TELEPHONE | ADRESSE | PRIX | VILLE | COMMENTAIRE | QUARTIER | PRODUIT | VALEUR DECLAREE
  const headers = ['CODE SUIVI','DESTINATAIRE','TELEPHONE','ADRESSE','PRIX','VILLE','COMMENTAIRE','QUARTIER','PRODUIT','VALEUR DECLAREE'];
  const rows = orders.map(o => [
    o.order_ref,
    o.client_name,
    o.phone,
    `"${(o.address||'').replace(/"/g,'""')}"`,
    o.price * o.quantity,
    o.city,
    `"${(o.notes||'').replace(/"/g,'""')}"`,
    '', // QUARTIER — vide, à remplir manuellement si besoin
    o.product_name + (o.variant_label ? ` - ${o.variant_label}` : '') + (o.quantity > 1 ? ` x${o.quantity}` : ''),
    o.price * o.quantity
  ]);
  res.setHeader('Content-Type','text/csv; charset=utf-8');
  res.setHeader('Content-Disposition',`attachment; filename="colis_${date_from||'all'}.csv"`);
  res.send('\uFEFF' + [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n'));
});

app.get('/api/export/xlsx', (req, res, next) => {
  // Support token via query string for direct download
  if (req.query.token && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
}, auth, (req, res) => {
  try {
    const { date_from, date_to, support_id, city, status } = req.query;
    let query = 'SELECT * FROM orders WHERE 1=1'; const params = [];
    if (date_from) { query += ' AND DATE(confirmed_at) >= ?'; params.push(date_from); }
    if (date_to)   { query += ' AND DATE(confirmed_at) <= ?'; params.push(date_to); }
    if (support_id) { query += ' AND support_id = ?'; params.push(support_id); }
    if (city)       { query += ' AND city LIKE ?'; params.push(`%${city}%`); }
    if (status)     { query += ' AND status = ?'; params.push(status); }
    if (req.user.role === 'support') { query += ' AND support_id = ?'; params.push(req.user.id); }
    const orders = db.prepare(query + ' ORDER BY confirmed_at DESC').all(...params);

    const zlib = require('zlib');
    // Use inlineStr instead of shared strings - more compatible with Excel
    const esc = s => String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const colLetter = i => i<26 ? String.fromCharCode(65+i) : 'A'+String.fromCharCode(65+i-26);
    const HEADERS = ['CODE SUIVI','DESTINATAIRE','TELEPHONE','ADRESSE','PRIX','VILLE','COMMENTAIRE','QUARTIER','PRODUIT','VALEUR DECLAREE'];
    const WIDTHS  = [26, 23, 18, 18, 11, 20, 36, 9, 30, 19];

    const strCell = (col, row, val) => `<c r="${col}${row}" t="inlineStr"><is><t>${esc(val)}</t></is></c>`;
    const numCell = (col, row, val) => `<c r="${col}${row}"><v>${Number(val)||0}</v></c>`;

    const colsXml = WIDTHS.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('');
    let rowsXml = `<row r="1">` + HEADERS.map((h,ci)=>`<c r="${colLetter(ci)}1" t="inlineStr" s="1"><is><t>${esc(h)}</t></is></c>`).join('') + `</row>`;

    orders.forEach((o, ri) => {
      const r = ri+2;
      const produit = o.product_name+(o.variant_label?` - ${o.variant_label}`:'')+((o.quantity||1)>1?` x${o.quantity}`:'');
      const vals = [
        o.order_ref, o.client_name, String(o.phone||''), o.address||'',
        null, o.city||'', o.notes||'', '', produit, null
      ];
      const prix = (o.price||0)*(o.quantity||1);
      rowsXml += `<row r="${r}">` + vals.map((v,ci) => {
        if(ci===4) return numCell(colLetter(ci), r, prix);
        if(ci===9) return numCell(colLetter(ci), r, prix);
        return strCell(colLetter(ci), r, v||'');
      }).join('') + `</row>`;
    });

    const lastRow = orders.length + 1;
    const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetPr><outlinePr summaryBelow="1" summaryRight="1"/></sheetPr><dimension ref="A1:J${lastRow}"/><sheetViews><sheetView workbookViewId="0"><selection activeCell="A1" sqref="A1"/></sheetView></sheetViews><sheetFormatPr baseColWidth="8" defaultRowHeight="15"/><cols>${colsXml}</cols><sheetData>${rowsXml}</sheetData></worksheet>`;

    const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="10"/><name val="Arial"/></font><font><b/><sz val="10"/><name val="Arial"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>`;

    const XML = {
      '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
      '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
      'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Colis" sheetId="1" r:id="rId1"/></sheets></workbook>`,
      'xl/_rels/workbook.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
      'xl/worksheets/sheet1.xml': sheetXml,
      'xl/styles.xml': stylesXml,
    };

    const crcTable = new Uint32Array(256);
    for(let i=0;i<256;i++){let c=i;for(let j=0;j<8;j++)c=(c&1)?0xEDB88320^(c>>>1):(c>>>1);crcTable[i]=c;}
    const crc32 = buf => {let c=0xFFFFFFFF;for(let i=0;i<buf.length;i++)c=crcTable[(c^buf[i])&0xFF]^(c>>>8);return(c^0xFFFFFFFF)>>>0;};
    const w32 = (b,v,o) => {b[o]=v&0xFF;b[o+1]=(v>>8)&0xFF;b[o+2]=(v>>16)&0xFF;b[o+3]=(v>>24)&0xFF;};
    const w16 = (b,v,o) => {b[o]=v&0xFF;b[o+1]=(v>>8)&0xFF;};
    const d=new Date();
    const dosDate=((d.getFullYear()-1980)<<25)|((d.getMonth()+1)<<21)|(d.getDate()<<16)|(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1);

    const parts=[],centrals=[];let pos=0;
    for(const [name,xmlStr] of Object.entries(XML)){
      const raw=Buffer.from(xmlStr,'utf8');
      const comp=zlib.deflateRawSync(raw,{level:6});
      const crc=crc32(raw);
      const nameB=Buffer.from(name,'utf8');
      const lh=Buffer.alloc(30+nameB.length);
      w32(lh,0x04034b50,0);w16(lh,20,4);w16(lh,0,6);w16(lh,8,8);w32(lh,dosDate,10);
      w32(lh,crc,14);w32(lh,comp.length,18);w32(lh,raw.length,22);w16(lh,nameB.length,26);w16(lh,0,28);
      nameB.copy(lh,30);
      centrals.push({nameB,crc,compLen:comp.length,rawLen:raw.length,offset:pos});
      parts.push(lh,comp);pos+=lh.length+comp.length;
    }
    const cdParts=centrals.map(e=>{
      const cd=Buffer.alloc(46+e.nameB.length);
      w32(cd,0x02014b50,0);w16(cd,20,4);w16(cd,20,6);w16(cd,0,8);w16(cd,8,10);w32(cd,dosDate,12);
      w32(cd,e.crc,16);w32(cd,e.compLen,20);w32(cd,e.rawLen,24);w16(cd,e.nameB.length,28);
      w16(cd,0,30);w16(cd,0,32);w16(cd,0,34);w16(cd,0,36);w32(cd,0,38);w32(cd,e.offset,42);
      e.nameB.copy(cd,46);return cd;
    });
    const cdBuf=Buffer.concat(cdParts);
    const eocd=Buffer.alloc(22);
    w32(eocd,0x06054b50,0);w16(eocd,0,4);w16(eocd,0,6);
    w16(eocd,centrals.length,8);w16(eocd,centrals.length,10);
    w32(eocd,cdBuf.length,12);w32(eocd,pos,16);w16(eocd,0,20);

    const zipBuf=Buffer.concat([...parts,cdBuf,eocd]);
    res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition',`attachment; filename="colis_${date_from||'all'}.xlsx"`);
    res.send(zipBuf);
  } catch(err) {
    console.error('XLSX error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

const buildPath = path.join(__dirname, 'public');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  app.get('*', (req, res) => res.sendFile(path.join(buildPath, 'index.html')));
}

app.listen(PORT, () => console.log(`✅ COD Leads on port ${PORT}`));
