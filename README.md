# 📦 COD Leads — Système de Gestion Commandes Maroc

Système complet de gestion de leads COD (Cash On Delivery) pour le marché marocain.

## 🚀 Déploiement sur Railway

### Étape 1 — Pusher sur GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TON_USER/cod-leads.git
git push -u origin main
```

### Étape 2 — Railway Setup
1. Aller sur [railway.app](https://railway.app)
2. **New Project → Deploy from GitHub repo**
3. Sélectionner le repo `cod-leads`
4. Railway détecte automatiquement `nixpacks.toml`

### Étape 3 — Variables d'environnement sur Railway
Dans Railway → Settings → Variables, ajouter :
```
JWT_SECRET=une_cle_secrete_longue_et_aleatoire_ici
DB_PATH=/data
PORT=3001
```

### Étape 4 — Volume persistant
Dans Railway → Settings → Volumes :
- Mount Path: `/data`
- Taille: 1 GB (suffisant pour des centaines de milliers de commandes)

### Étape 5 — Variables frontend
Si vous déployez le frontend séparément :
```
REACT_APP_API_URL=https://votre-backend.railway.app
```

---

## 🏗️ Architecture

```
cod-leads/
├── backend/          ← Node.js + Express + SQLite
│   ├── server.js     ← API + sert le build React
│   ├── data/         ← Base de données SQLite (Railway volume)
│   └── public/       ← Build React (généré au deploy)
├── frontend/         ← React
│   └── src/
│       ├── pages/    ← NewOrder, Orders, PrintPage, Stats, Products, Users
│       ├── components/
│       └── utils/
├── nixpacks.toml     ← Config build Railway
└── railway.toml      ← Config déploiement Railway
```

## 🔑 Connexion par défaut
- **Admin:** `admin` / `admin123`
- ⚠️ Changer le mot de passe admin dès le premier accès!

## ✨ Fonctionnalités

### Support
- ✅ Confirmer une commande (nom, tél, adresse, ville, produit, prix)
- 📋 Voir ses propres commandes
- 🖨️ Imprimer les étiquettes colisage
- ⬇️ Export CSV

### Admin
- 📊 Statistiques par jour/support/ville
- 👥 Gestion de l'équipe support
- 📦 Gestion des produits
- 🗂️ Voir TOUTES les commandes
- 🗑️ Supprimer des commandes

### Impression Colisage
- Grille 2 colonnes format A4
- Nom client en grand, téléphone en grand
- Adresse complète + ville
- Montant COD bien visible
- Référence unique traçable

### Export CSV
- Filtrable par date, support, ville, statut
- Compatible Excel (BOM UTF-8)
- Tous les champs inclus

## 🛠️ Dev local

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (autre terminal)
cd frontend && npm install && npm start
```

## 📱 Statuts commande
- **confirmée** → Nouvelle commande confirmée par le support
- **expédiée** → Colis envoyé au transporteur
- **livrée** → Client a reçu et payé
- **annulée** → Client a annulé
- **retournée** → Colis retourné
