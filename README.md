# 🏹 Gestion Tir à l'Arc FSCF

Application Progressive Web App (PWA) pour la gestion de compétitions de tir à l'arc selon le règlement de la Fédération Sportive et Culturelle de France (FSCF).

## 🎯 Fonctionnalités

- ✅ **Gestion des archers** : Inscription et gestion des participants
- ✅ **Configuration des pas de tir** : Définition des distances, types de cibles et configuration des compétitions
- ✅ **Saisie des résultats** : Enregistrement des scores de compétition
- ✅ **Export de données** : Export CSV et JSON pour exploitation externe
- ✅ **Fonctionnement 100% hors-ligne** : Utilisation sans connexion Internet après installation
- ✅ **Synchronisation automatique** : Gestion intelligente du cache et des données

## 📋 Prérequis

- Un navigateur web moderne supportant les PWA (Chrome, Edge, Firefox, Safari)
- Pour le développement : un serveur HTTP local (Python, Node.js, ou autre)

## 🚀 Installation

### Accès en ligne (GitHub Pages)

L'application est déployée automatiquement sur GitHub Pages à chaque push sur la branche `main`.

**URL de l'application** : [https://jry25.github.io/gestion-tir-arc-fscf/](https://jry25.github.io/gestion-tir-arc-fscf/)

### Installation comme application (PWA)

1. Ouvrez l'application dans votre navigateur
2. Cliquez sur l'icône d'installation dans la barre d'adresse (ou menu du navigateur)
3. Suivez les instructions pour installer sur votre appareil
4. L'application sera disponible comme une application native

### Développement local

```bash
# Avec Python 3
python -m http.server 8000 -d pwa

# Avec Node.js (http-server)
npx http-server pwa -p 8000

# Avec PHP
php -S localhost:8000 -t pwa
```

Puis ouvrez http://localhost:8000 dans votre navigateur.

## 📦 Déploiement

### GitHub Pages (Automatique)

Le déploiement sur GitHub Pages est automatique via GitHub Actions :

1. Chaque push sur la branche `main` déclenche le workflow de déploiement
2. Le workflow configure GitHub Pages et déploie les fichiers statiques
3. L'application est accessible à l'URL : `https://jry25.github.io/gestion-tir-arc-fscf/`

**Configuration requise** (une seule fois) :
1. Aller dans les paramètres du repository (`Settings` > `Pages`)
2. Sous "Source", sélectionner "GitHub Actions"
3. Le workflow `.github/workflows/deploy.yml` gérera automatiquement le déploiement

**Note** : Le fichier `.nojekyll` est présent pour éviter le traitement Jekyll par GitHub Pages.

## 🏗️ Architecture

### Structure du projet

```
gestion-tir-arc-fscf/pwa
├── index.html              # Page principale
├── manifest.json           # Manifest PWA
├── service-worker.js       # Service Worker pour fonctionnement hors-ligne
├── css/
│   └── styles.css          # Styles CSS
├── js/
│   ├── app.js              # Point d'entrée de l'application
│   ├── db.js               # Module IndexedDB
│   ├── router.js           # Routeur SPA
│   ├── utils.js            # Fonctions utilitaires
│   └── pages/              # Modules des pages
│       ├── archers.js      # Page gestion archers
│       ├── shooting-ranges.js  # Page pas de tir
│       ├── results.js      # Page résultats
│       └── export.js       # Page export
└── icons/                  # Icônes PWA (multiples tailles)
```

### Choix techniques

#### 1. Progressive Web App (PWA)
- **Pourquoi ?** Permet l'installation sur tous les appareils (ordinateur, tablette, mobile) et le fonctionnement hors-ligne
- **Service Worker** : Gestion du cache pour accès hors-ligne
- **Manifest** : Métadonnées pour l'installation de l'application

#### 2. Vanilla JavaScript (ES6 Modules)
- **Pourquoi ?** Pas de dépendances externes, application légère et rapide
- **Modularisation** : Code organisé en modules pour faciliter la maintenance
- **ES6+** : Utilisation des fonctionnalités modernes de JavaScript

#### 3. IndexedDB
- **Pourquoi ?** Base de données locale pour stockage hors-ligne
- **Capacité** : Stockage illimité (contrairement à localStorage)
- **Performance** : Opérations asynchrones, indexation pour requêtes rapides

#### 4. Architecture Single Page Application (SPA)
- **Pourquoi ?** Expérience utilisateur fluide sans rechargements
- **Routeur simple** : Navigation par hash (#) pour compatibilité maximale
- **Composants pages** : Chaque page est un module indépendant

## 💾 Schéma de données (IndexedDB)

### Collection `archers`
```javascript
{
  id: number (auto),
  name: string,
  firstName: string,
  license: string (unique),
  category: string,        // POU, BEN, MIN, CAD, JUN, SEN, VET
  weapon: string,          // CL, CO, BB, AD
  club: string,
  createdAt: ISOString
}
```

### Collection `categories`
```javascript
{
  id: number (auto),
  code: string (unique),
  name: string,
  type: string,            // 'age' ou 'weapon'
  minAge: number,          // pour catégories d'âge
  maxAge: number
}
```

### Collection `shootingRanges` (Pas de tir)
```javascript
{
  id: number (auto),
  name: string,
  distance: number,        // en mètres
  targetType: string,      // 40cm, 60cm, 80cm, 122cm
  numberOfTargets: number,
  createdAt: ISOString
}
```

### Collection `results`
```javascript
{
  id: number (auto),
  archerId: number,        // référence à archers
  rangeId: number,         // référence à shootingRanges
  score: number,
  arrows: array,           // détail des flèches (extension future)
  date: ISOString,
  notes: string
}
```

## 🔧 Fonctionnalités détaillées

### Gestion des archers
- Ajout d'archers avec nom, prénom, licence, catégorie d'âge et type d'arc
- Recherche et filtrage
- Suppression d'archers
- Validation des doublons de licence

### Pas de tir
- Configuration des distances (10m, 18m, 25m, 30m, 50m, 70m)
- Sélection du type de cible (40cm, 60cm, 80cm, 122cm)
- Nombre de cibles disponibles
- Suppression et gestion

### Résultats
- Saisie des scores par archer et pas de tir
- Association automatique archer/compétition
- Historique complet des résultats
- Notes et commentaires

### Export
- Export CSV des archers, résultats et pas de tir
- Export JSON complet pour sauvegarde/restauration
- Statistiques en temps réel (nombre d'archers, scores moyens, etc.)

## 📱 Compatibilité

- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Safari (Desktop & Mobile)
- ✅ Responsive Design (s'adapte à toutes les tailles d'écran)

## 🔐 Sécurité & Confidentialité

- ✅ Toutes les données sont stockées **localement** sur l'appareil
- ✅ Aucune transmission de données vers des serveurs externes
- ✅ Respect total de la vie privée des utilisateurs
- ✅ Pas de tracking, pas d'analytics

## 🚧 Extensions futures possibles

- Import de données CSV/Excel
- Génération de PDF pour résultats imprimables
- Classements automatiques par catégorie
- Gestion de plusieurs compétitions simultanées
- Synchronisation multi-appareils (optionnel)
- Mode multi-utilisateurs pour saisie simultanée
- Saisie détaillée flèche par flèche
- Calculs automatiques selon règlement FSCF
- Barèmes et coefficients par catégorie

## 📚 Développement

### Structure du code

- **pwa/app.js** : Initialisation de l'application, enregistrement du Service Worker
- **pwa/db.js** : Gestion IndexedDB avec méthodes CRUD génériques
- **pwa/router.js** : Routeur simple pour navigation SPA
- **pwa/utils.js** : Fonctions utilitaires (toast, validation, export, etc.)
- **pwa/pages/*.js** : Modules de pages avec logique métier isolée

### Conventions

- Utilisation de ES6 Modules (`import`/`export`)
- Async/await pour opérations asynchrones
- Commentaires JSDoc pour documentation
- Nommage en français pour domaine métier
- Code en anglais pour fonctions techniques

### Tests manuels

1. **Installation PWA** : Vérifier que l'application peut être installée
2. **Fonctionnement hors-ligne** : Couper la connexion et vérifier que tout fonctionne
3. **CRUD Archers** : Ajouter, lister, rechercher, supprimer
4. **CRUD Pas de tir** : Créer et supprimer des configurations
5. **Saisie résultats** : Enregistrer des scores
6. **Export** : Vérifier exports CSV et JSON

## 📄 Licence

Ce projet est développé pour la FSCF (Fédération Sportive et Culturelle de France).

## 📞 Support

Pour toute question concernant l'utilisation de l'application, veuillez consulter la documentation FSCF sur le règlement du tir à l'arc : https://www.fscf.asso.fr/
