const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'cod_leads_secret_2024_change_in_prod';

const DB_DIR = process.env.DB_PATH || path.join(__dirname, 'data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
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
    price REAL DEFAULT 0,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_ref TEXT UNIQUE NOT NULL,
    product_id INTEGER,
    product_name TEXT NOT NULL,
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

const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', hash, 'admin');
  console.log('Admin créé: admin / admin123');
}

app.use(cors());
app.use(express.json());
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use('/api', limiter);

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
  const date = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `COD-${date}-${rand}`;
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Identifiants incorrects' });
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '12h' });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

app.get('/api/products', auth, (req, res) => {
  res.json(db.prepare('SELECT * FROM products WHERE active = 1 ORDER BY name').all());
});
app.get('/api/products/all', auth, adminOnly, (req, res) => {
  res.json(db.prepare('SELECT * FROM products ORDER BY name').all());
});
app.post('/api/products', auth, adminOnly, (req, res) => {
  const { name, price } = req.body;
  if (!name) return res.status(400).json({ error: 'Nom requis' });
  const r = db.prepare('INSERT INTO products (name, price) VALUES (?, ?)').run(name, price || 0);
  res.json({ id: r.lastInsertRowid, name, price: price || 0 });
});
app.put('/api/products/:id', auth, adminOnly, (req, res) => {
  const { name, price, active } = req.body;
  db.prepare('UPDATE products SET name=?, price=?, active=? WHERE id=?').run(name, price, active ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

app.post('/api/orders', auth, (req, res) => {
  const { product_id, product_name, client_name, phone, address, city, price, quantity, notes } = req.body;
  if (!client_name || !phone || !address || !city || !product_name)
    return res.status(400).json({ error: 'Champs obligatoires manquants' });
  const ref = genRef();
  db.prepare(`INSERT INTO orders (order_ref,product_id,product_name,client_name,phone,address,city,price,quantity,notes,support_id,support_name) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(ref, product_id||null, product_name, client_name, phone, address, city, price||0, quantity||1, notes||'', req.user.id, req.user.username);
  res.json(db.prepare('SELECT * FROM orders WHERE order_ref = ?').get(ref));
});

app.get('/api/orders', auth, (req, res) => {
  const { date_from, date_to, support_id, city, status, search } = req.query;
  let query = 'SELECT * FROM orders WHERE 1=1';
  const params = [];
  if (date_from) { query += ' AND DATE(confirmed_at) >= ?'; params.push(date_from); }
  if (date_to)   { query += ' AND DATE(confirmed_at) <= ?'; params.push(date_to); }
  if (support_id) { query += ' AND support_id = ?'; params.push(support_id); }
  if (city)       { query += ' AND city LIKE ?'; params.push(`%${city}%`); }
  if (status)     { query += ' AND status = ?'; params.push(status); }
  if (search)     { query += ' AND (client_name LIKE ? OR phone LIKE ? OR order_ref LIKE ?)'; params.push(`%${search}%`,`%${search}%`,`%${search}%`); }
  if (req.user.role === 'support') { query += ' AND support_id = ?'; params.push(req.user.id); }
  query += ' ORDER BY confirmed_at DESC';
  res.json(db.prepare(query).all(...params));
});

app.get('/api/orders/stats', auth, (req, res) => {
  const targetDate = req.query.date || new Date().toISOString().split('T')[0];
  res.json({
    todayCount: db.prepare('SELECT COUNT(*) as c FROM orders WHERE DATE(confirmed_at) = ?').get(targetDate).c,
    todayBySupport: db.prepare('SELECT support_name, COUNT(*) as count FROM orders WHERE DATE(confirmed_at) = ? GROUP BY support_name ORDER BY count DESC').all(targetDate),
    todayByCity: db.prepare('SELECT city, COUNT(*) as count FROM orders WHERE DATE(confirmed_at) = ? GROUP BY city ORDER BY count DESC LIMIT 10').all(targetDate),
    totalCount: db.prepare('SELECT COUNT(*) as c FROM orders').get().c,
    totalByStatus: db.prepare('SELECT status, COUNT(*) as count FROM orders GROUP BY status').all(),
    date: targetDate
  });
});

app.put('/api/orders/:id/status', auth, (req, res) => {
  const { status } = req.body;
  const valid = ['confirmée','expédiée','livrée','annulée','retournée'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Statut invalide' });
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Introuvable' });
  if (req.user.role === 'support' && order.support_id !== req.user.id) return res.status(403).json({ error: 'Non autorisé' });
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/orders/:id', auth, adminOnly, (req, res) => {
  db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.get('/api/users', auth, adminOnly, (req, res) => {
  res.json(db.prepare('SELECT id, username, role, created_at FROM users ORDER BY username').all());
});
app.post('/api/users', auth, adminOnly, (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Champs requis' });
  try {
    const r = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(username, bcrypt.hashSync(password, 10), role || 'support');
    res.json({ id: r.lastInsertRowid, username, role: role || 'support' });
  } catch { res.status(400).json({ error: 'Utilisateur déjà existant' }); }
});
app.put('/api/users/:id/password', auth, adminOnly, (req, res) => {
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(bcrypt.hashSync(req.body.password, 10), req.params.id);
  res.json({ ok: true });
});
app.delete('/api/users/:id', auth, adminOnly, (req, res) => {
  if (req.params.id == req.user.id) return res.status(400).json({ error: 'Impossible de supprimer votre propre compte' });
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

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
  const headers = ['Référence','Produit','Client','Téléphone','Adresse','Ville','Prix','Qté','Statut','Support','Date','Notes'];
  const rows = orders.map(o => [o.order_ref,o.product_name,o.client_name,o.phone,`"${o.address.replace(/"/g,'""')}"`,o.city,o.price,o.quantity,o.status,o.support_name,new Date(o.confirmed_at).toLocaleString('fr-MA'),`"${(o.notes||'').replace(/"/g,'""')}"`]);
  res.setHeader('Content-Type','text/csv; charset=utf-8');
  res.setHeader('Content-Disposition',`attachment; filename="commandes_${date_from||'all'}.csv"`);
  res.send('\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n'));
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Serve React build
const buildPath = path.join(__dirname, 'public');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  app.get('*', (req, res) => res.sendFile(path.join(buildPath, 'index.html')));
}

app.listen(PORT, () => console.log(`✅ COD Leads on port ${PORT}`));
