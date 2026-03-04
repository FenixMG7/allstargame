# 🏀 ALL-STAR GAME — Guide de déploiement complet
## Zéro compétence requise — Suivez les étapes dans l'ordre !

---

## ÉTAPE 1 : Créer votre base de données (Supabase) — 10 min

### 1.1 Créer un compte gratuit
1. Allez sur **https://supabase.com**
2. Cliquez **"Start your project"**
3. Connectez-vous avec GitHub ou Email
4. Cliquez **"New project"**
5. Donnez un nom : `allstargame`
6. Choisissez un mot de passe de base de données (notez-le)
7. Région : **West EU (Ireland)** (le plus proche de la France)
8. Cliquez **"Create new project"** — attendez 1-2 minutes

### 1.2 Créer les tables
1. Dans le menu gauche, cliquez **"SQL Editor"**
2. Cliquez **"New query"**
3. Ouvrez le fichier `supabase/schema.sql` de ce projet
4. Copiez **tout** le contenu et collez-le dans l'éditeur
5. Cliquez **"Run"** (bouton vert)
6. Vous devez voir : "Success. No rows returned"

### 1.3 Créer le compte administrateur
1. Dans le menu gauche, cliquez **"Authentication"**
2. Cliquez **"Add user"** → **"Create new user"**
3. Email : votre email admin (ex: admin@monclub.fr)
4. Password : choisissez un mot de passe fort
5. Cliquez **"Create User"**

### 1.4 Récupérer vos clés API
1. Dans le menu gauche, cliquez **"Settings"** (roue dentée en bas)
2. Cliquez **"API"**
3. Notez les deux valeurs :
   - **Project URL** : `https://xxxxxxxxxxxx.supabase.co`
   - **anon public** key : `eyJhbGci...` (longue chaîne)

---

## ÉTAPE 2 : Mettre le code en ligne (GitHub) — 5 min

### 2.1 Créer un compte GitHub gratuit
1. Allez sur **https://github.com**
2. Cliquez **"Sign up"** et créez un compte gratuit

### 2.2 Créer un repository
1. Cliquez **"+"** en haut à droite → **"New repository"**
2. Nom : `allstargame`
3. Laissez en **Public** (nécessaire pour Vercel gratuit)
4. Cliquez **"Create repository"**

### 2.3 Uploader les fichiers
1. Sur la page de votre repository vide, cliquez **"uploading an existing file"**
2. Glissez-déposez **tous les fichiers** du dossier `allstargame`
   > ⚠️ Glissez les fichiers, PAS le dossier lui-même
   > ⚠️ N'uploadez PAS le dossier `node_modules` ni `.next`
3. En bas, cliquez **"Commit changes"**

---

## ÉTAPE 3 : Déployer le site (Vercel) — 5 min

### 3.1 Créer un compte Vercel
1. Allez sur **https://vercel.com**
2. Cliquez **"Sign Up"**
3. Choisissez **"Continue with GitHub"** (connectez votre compte GitHub)

### 3.2 Importer le projet
1. Cliquez **"Add New..."** → **"Project"**
2. Trouvez votre repository `allstargame` et cliquez **"Import"**
3. Dans **"Environment Variables"**, ajoutez :
   - Nom : `NEXT_PUBLIC_SUPABASE_URL` → Valeur : votre URL Supabase
   - Cliquez **"Add"**
   - Nom : `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Valeur : votre clé anon
   - Cliquez **"Add"**
4. Cliquez **"Deploy"**
5. Attendez 2-3 minutes... 🎉

Votre site est maintenant en ligne sur une URL du type :
`https://allstargame-xxxx.vercel.app`

---

## ÉTAPE 4 : Configurer votre site — 5 min

### 4.1 Ouvrir le vote
1. Allez sur votre site : `https://allstargame-xxxx.vercel.app/admin/login`
2. Connectez-vous avec l'email et mot de passe créés à l'étape 1.3
3. Cliquez sur l'onglet **"⚙️ Paramètres"**
4. Mettez le nom de votre événement et la date
5. Activez **"Vote ouvert"**
6. Cliquez **"Sauvegarder"**

### 4.2 Ajouter vos joueurs
1. Cliquez sur l'onglet **"🏀 Joueurs"**
2. Ajoutez chaque joueur (prénom, nom, numéro, poste)
3. Vous pourrez aussi ajouter des photos plus tard

### 4.3 Générer les codes de vote
1. Cliquez sur l'onglet **"🎫 Codes"**
2. Entrez le nombre de codes à générer (ex: 100)
3. Cliquez **"✨ Générer"**
4. Cliquez **"📥 Télécharger CSV"**
5. Imprimez ou distribuez les codes !

---

## ÉTAPE 5 : Personnalisation optionnelle

### Changer le logo 🏀
Dans le fichier `src/app/page.tsx`, ligne ~85, remplacez l'emoji 🏀 par votre logo :
```jsx
// Remplacez cette ligne :
<span className="text-3xl">🏀</span>

// Par votre image :
<img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain" />
```
Puis uploadez votre logo dans le dossier `public/` sur GitHub.

### Changer les couleurs 🎨
Dans `tailwind.config.ts`, modifiez :
```js
orange: {
  DEFAULT: "#E8651A",  // ← Votre couleur principale
}
```

### Changer le nom du site
Dans `src/app/layout.tsx`, modifiez :
```js
title: "All-Star Game — Vote",  // ← Votre titre
description: "...",              // ← Votre description
```

---

## 🆘 Problèmes courants

| Problème | Solution |
|----------|----------|
| "Error: Invalid API Key" | Vérifiez les variables d'environnement sur Vercel |
| "Code invalide" mais le code existe | Vérifiez que la table voting_codes a bien été créée |
| La page admin redirige vers login | Vérifiez que l'utilisateur est bien créé dans Supabase Auth |
| Le vote reste fermé | Activez "Vote ouvert" dans Paramètres de l'admin |

---

## 📞 Structure des fichiers

```
allstargame/
├── src/
│   ├── app/
│   │   ├── page.tsx          → Page d'accueil (saisie du code)
│   │   ├── vote/page.tsx     → Page de vote
│   │   ├── merci/page.tsx    → Page de confirmation
│   │   ├── admin/
│   │   │   ├── page.tsx      → Dashboard admin
│   │   │   └── login/page.tsx → Connexion admin
│   │   ├── layout.tsx        → Structure de base
│   │   └── globals.css       → Styles globaux
│   ├── lib/supabase.ts       → Connexion base de données
│   └── middleware.ts         → Protection admin
├── supabase/
│   └── schema.sql            → Script de création des tables
├── .env.example              → Template variables d'environnement
└── package.json              → Dépendances du projet
```

---

Créé avec ❤️ pour votre club de basket · Budget 0€ · Hébergé sur Vercel + Supabase
