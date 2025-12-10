# Test d'installation et validation PWA

## Instructions de test

### 1. Installation locale

```bash
# Avec Python 3
cd /home/runner/work/gestion-tir-arc-fscf/gestion-tir-arc-fscf
python3 -m http.server 8000

# Ou avec Node.js
npx http-server -p 8000
```

Ouvrir http://localhost:8000 dans votre navigateur.

### 2. Vérification PWA

#### Service Worker
- Ouvrir DevTools > Application > Service Workers
- Vérifier que le Service Worker est enregistré et actif
- Statut : "activated and is running"

#### Manifest
- DevTools > Application > Manifest
- Vérifier les métadonnées :
  - Name: "Gestion Tir à l'Arc FSCF"
  - Start URL: "/"
  - Display: "standalone"
  - Icons: 8 tailles disponibles

#### Installation
- Cliquer sur l'icône d'installation dans la barre d'adresse
- Vérifier que l'application s'installe
- Lancer l'application installée

### 3. Test fonctionnel hors-ligne

1. Ouvrir l'application
2. Ajouter un archer
3. Configurer un pas de tir
4. DevTools > Network > Cocher "Offline"
5. Recharger la page
6. Vérifier que :
   - L'application se charge
   - Les données sont toujours présentes
   - Les fonctionnalités fonctionnent
   - L'indicateur affiche "Hors ligne"

### 4. Test IndexedDB

- DevTools > Application > Storage > IndexedDB
- Vérifier la présence de "TirArcFSCF"
- Collections :
  - archers
  - categories (avec données par défaut)
  - shootingRanges
  - results

### 5. Test navigation

- Naviguer entre les 4 pages principales
- Vérifier que l'indicateur actif change
- Tester sur mobile (DevTools > Toggle device toolbar)

### 6. Test CRUD

#### Archers
- Ajouter un archer
- Rechercher un archer
- Supprimer un archer

#### Pas de tir
- Créer un pas de tir
- Vérifier l'affichage
- Supprimer un pas de tir

#### Résultats
- Ajouter un résultat (nécessite archer + pas de tir)
- Vérifier l'affichage dans le tableau

#### Export
- Vérifier les statistiques
- Tester export CSV
- Tester export JSON

### 7. Test responsive

- Desktop (1920x1080)
- Tablette (768x1024)
- Mobile (375x667)

Tous les éléments doivent s'adapter correctement.

### Résultats attendus

✅ Service Worker actif
✅ Manifest valide
✅ Installation possible
✅ Fonctionnement hors-ligne
✅ IndexedDB opérationnelle
✅ Navigation fluide
✅ CRUD fonctionnel
✅ Responsive design
✅ Aucune erreur console
✅ Performances acceptables

