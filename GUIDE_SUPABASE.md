# 🔧 Configuration et débogage Supabase

## Problèmes identifiés et solutions

### 1. Les suppressions et modifications ne fonctionnent pas

**Cause probable**: Les politiques de sécurité (RLS) dans Supabase ne sont pas correctement configurées ou la connexion n'est pas authentifiée.

### 2. Vérifications à effectuer

#### Étape 1: Créer un fichier `.env.local`

Copiez le fichier `.env.example` et renommez-le `.env.local`:

```bash
cp .env.example .env.local
```

Puis éditez-le avec vos vraies clés Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://VOTRE-PROJET.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key-ici
```

**Où trouver ces clés:**
1. Allez sur https://supabase.com
2. Sélectionnez votre projet
3. Cliquez sur **Settings** (roue dentée en bas à gauche)
4. Cliquez sur **API**
5. Copiez:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Étape 2: Exécuter le schema SQL dans Supabase

1. Dans votre dashboard Supabase, allez dans **SQL Editor**
2. Copiez-collez le contenu du fichier `/workspace/supabase/schema.sql`
3. Cliquez sur **Run** pour exécuter

Cela va créer:
- Les tables `players`, `voting_codes`, `votes`, `vote_settings`
- Les politiques de sécurité (RLS)
- La fonction `submit_vote()`

#### Étape 3: Vérifier les politiques RLS

Après avoir exécuté le schema, vérifiez dans Supabase:
1. Allez dans **Authentication** → **Policies**
2. Pour chaque table (`players`, `voting_codes`, `votes`, `vote_settings`), assurez-vous qu'il y a:
   - Une politique de lecture publique (`SELECT USING (true)`)
   - Une politique admin (`ALL USING (auth.role() = 'authenticated')`)

### 3. Comment tester si ça marche

1. Lancez l'application: `npm run dev`
2. Allez sur `/admin/login`
3. Connectez-vous avec le code bypass: `01234` / `01234`
4. Ouvrez la console du navigateur (F12) pour voir les erreurs éventuelles
5. Essayez de supprimer un joueur ou d'invalider un code

### 4. Messages d'erreur ajoutés

J'ai ajouté des messages d'erreur détaillés pour chaque opération:
- ❌ Suppression de joueur
- ❌ Modification statut joueur
- ❌ Ajout joueur
- ❌ Upload photo
- ❌ Génération codes
- ❌ Invalidation code
- ❌ Réinitialisation votes
- ❌ Sauvegarde paramètres

Chaque erreur affiche maintenant:
- Un message clair à l'utilisateur
- Un détail technique dans la console (F12)

### 5. Si ça ne marche toujours pas

**Vérifiez dans la console du navigateur (F12):**
- Y a-t-il des erreurs de connexion à Supabase?
- Les requêtes échouent-elles avec un code 401 (non autorisé) ou 403 (interdit)?

**Si erreur 401/403:**
- Vos clés Supabase sont incorrectes
- OU les politiques RLS ne sont pas bien configurées

**Si erreur de réseau:**
- Vérifiez que l'URL Supabase est correcte
- Vérifiez votre connexion internet

### 6. Commande utile pour redémarrer

```bash
npm run dev
```

Puis ouvrez http://localhost:3000/admin
