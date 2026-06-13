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
  const { product_id, product_name, product_image, variant_id, variant_label, client_name, phone, address, city, price, quantity, notes } = req.body;
  if (!client_name || !phone || !address || !city || !product_name)
    return res.status(400).json({ error: 'Champs obligatoires manquants' });
  const ref = genRef();
  db.prepare(`INSERT INTO orders (order_ref,product_id,product_name,product_image,variant_id,variant_label,client_name,phone,address,city,price,quantity,notes,support_id,support_name) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(ref, product_id||null, product_name, product_image||'', variant_id||null, variant_label||'', client_name, phone, address, city, price||0, quantity||1, notes||'', req.user.id, req.user.username);
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
  const headers = ['Référence','Produit','Variante','Client','Téléphone','Adresse','Ville','Prix','Qté','Statut','Support','Date','Notes'];
  const rows = orders.map(o => [o.order_ref,o.product_name,o.variant_label||'',o.client_name,o.phone,`"${(o.address||'').replace(/"/g,'""')}"`,o.city,o.price,o.quantity,o.status,o.support_name,new Date(o.confirmed_at).toLocaleString('fr-MA'),`"${(o.notes||'').replace(/"/g,'""')}"`]);
  res.setHeader('Content-Type','text/csv; charset=utf-8');
  res.setHeader('Content-Disposition',`attachment; filename="commandes_${date_from||'all'}.csv"`);
  res.send('\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n'));
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

const buildPath = path.join(__dirname, 'public');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  app.get('*', (req, res) => res.sendFile(path.join(buildPath, 'index.html')));
}

app.listen(PORT, () => console.log(`✅ COD Leads on port ${PORT}`));
