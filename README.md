#  FoodExpress API

API REST pour la gestion de restaurants et de menus développée avec Node.js, Express et MongoDB.

##  Table des matières

- [Description](#description)
- [Fonctionnalités](#fonctionnalités)
- [Technologies utilisées](#technologies-utilisées)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Démarrage](#démarrage)
- [Tests](#tests)
- [Documentation API](#documentation-api)
- [Structure du projet](#structure-du-projet)
- [Endpoints](#endpoints)
- [Licence](#licence)

##  Description

FoodExpress est une API RESTful complète permettant de gérer des restaurants, leurs menus et les utilisateurs. L'API offre des fonctionnalités d'authentification JWT, de gestion des rôles (admin/user), et de CRUD complet sur les ressources.

##  Fonctionnalités

-  **Authentification & Autorisation**
  - Inscription et connexion utilisateur
  - Tokens JWT pour la sécurisation des endpoints
  - Gestion des rôles (Admin/User)
  
-  **Gestion des utilisateurs**
  - CRUD complet sur les utilisateurs
  - Hashage des mots de passe avec bcrypt
  - Contrôle d'accès basé sur les rôles
  
-  **Gestion des restaurants**
  - CRUD complet (Admin uniquement pour CUD)
  - Pagination et tri des résultats
  - Recherche par nom ou adresse
  
-  **Gestion des menus**
  - CRUD complet (Admin uniquement pour CUD)
  - Filtrage par restaurant, catégorie, et prix
  - Liaison avec les restaurants
  - Pagination et tri avancés

-  **Documentation**
  - Documentation Swagger/OpenAPI intégrée
  - Tests unitaires complets avec Jest

##  Technologies utilisées

- **Runtime:** Node.js
- **Framework:** Express.js v5.1.0
- **Base de données:** MongoDB avec Mongoose v8.19.0
- **Authentification:** JWT (jsonwebtoken v9.0.2)
- **Sécurité:** bcrypt v6.0.0
- **Documentation:** Swagger UI Express & Swagger JSDoc
- **Tests:** Jest v30.2.0 & Supertest v7.1.4
- **Développement:** Nodemon v3.1.10
- **Variables d'environnement:** dotenv v17.2.3

##  Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** (version 14.x ou supérieure) - [Télécharger Node.js](https://nodejs.org/)
- **MongoDB** (version 4.x ou supérieure) - [Télécharger MongoDB](https://www.mongodb.com/try/download/community)
- **npm** ou **yarn** (généralement installé avec Node.js)

Vérifiez vos installations :
```bash
node --version
npm --version
mongod --version
```

##  Installation

### 1. Cloner le projet

```bash
git clone https://github.com/BastienGlt/FoodExpress.git
cd FoodExpress
```

### 2. Installer les dépendances

```bash
npm install
```

Cette commande installera toutes les dépendances listées dans `package.json`.

##  Configuration

### 1. Configurer MongoDB

Assurez-vous que MongoDB est en cours d'exécution sur votre machine :

```bash
# Windows (si installé comme service)
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
# ou
mongod
```

### 2. Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet :

```bash
# .env
DB_URL=mongodb://localhost:27017
JWT_SECRET=your-secret-key-here
PORT=3000
```

** Important:** Remplacez `your-secret-key-here` par une clé secrète forte pour la production.

### 3. Variables d'environnement disponibles

| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| `DB_URL` | URL de connexion MongoDB | `mongodb://localhost:27017` |
| `JWT_SECRET` | Clé secrète pour JWT | `your-secret-key` |
| `PORT` | Port du serveur | `3000` |

##  Démarrage

### Mode production

```bash
npm start
```

Le serveur démarre sur `http://localhost:3000`

### Mode développement (avec rechargement automatique)

```bash
npm run dev
```

Le serveur redémarre automatiquement à chaque modification de fichier.

### Vérification

Une fois le serveur démarré, vous devriez voir :
```
Connected to the database mongodb://localhost:27017/foodexpress
Server is running on http://localhost:3000
```

##  Tests

Le projet inclut une suite complète de tests unitaires.

### Exécuter tous les tests

```bash
npm test
```

### Couverture des tests

Les tests couvrent :
-  16 tests pour les utilisateurs (`user.test.js`)
-  15 tests pour les restaurants (`restaurant.test.js`)
-  20 tests pour les menus (`menu.test.js`)

**Total : 51 tests**

### Structure des tests

```
tests/
 user.test.js          # Tests des endpoints utilisateurs
 restaurant.test.js    # Tests des endpoints restaurants
 menu.test.js          # Tests des endpoints menus
```

##  Documentation API

### Swagger UI

Une documentation interactive complète est disponible via Swagger UI :

```
http://localhost:3000/api-docs
```

### Documentation Postman

Des fichiers de documentation Postman sont également disponibles dans le projet.

##  Structure du projet

```
FoodExpress/
 config/
    db.config.js              # Configuration MongoDB
 controllers/
    menu.controller.js        # Logique métier des menus
    restaurant.controller.js  # Logique métier des restaurants
    user.controller.js        # Logique métier des utilisateurs
 middleware/
    auth.middleware.js        # Middlewares d'authentification
 models/
    menu.model.js             # Modèle Mongoose pour les menus
    restaurant.model.js       # Modèle Mongoose pour les restaurants
    user.model.js             # Modèle Mongoose pour les utilisateurs
 routes/
    menu.route.js             # Routes des menus
    restaurant.route.js       # Routes des restaurants
    user.route.js             # Routes des utilisateurs
 tests/
    menu.test.js              # Tests unitaires des menus
    restaurant.test.js        # Tests unitaires des restaurants
    user.test.js              # Tests unitaires des utilisateurs
 .env                          # Variables d'environnement
 jest.config.js                # Configuration Jest
 package.json                  # Dépendances et scripts
 server.js                     # Point d'entrée de l'application
 swagger.yaml                  # Spécification OpenAPI
```

##  Endpoints

### Authentification (Public)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/users/register` | Inscription d'un nouvel utilisateur |
| `POST` | `/users/login` | Connexion et obtention du token JWT |

### Utilisateurs (Protégé)

| Méthode | Endpoint | Auth | Rôle | Description |
|---------|----------|------|------|-------------|
| `GET` | `/users` |  | Admin | Liste tous les utilisateurs |
| `GET` | `/users/:id` |  | Owner/Admin | Récupère un utilisateur |
| `PUT` | `/users/:id` |  | Owner/Admin | Met à jour un utilisateur |
| `DELETE` | `/users/:id` |  | Owner/Admin | Supprime un utilisateur |

### Restaurants

| Méthode | Endpoint | Auth | Rôle | Description |
|---------|----------|------|------|-------------|
| `GET` | `/restaurants` |  | Public | Liste tous les restaurants (pagination) |
| `GET` | `/restaurants/:id` |  | Public | Récupère un restaurant |
| `POST` | `/restaurants` |  | Admin | Crée un restaurant |
| `PUT` | `/restaurants/:id` |  | Admin | Met à jour un restaurant |
| `DELETE` | `/restaurants/:id` |  | Admin | Supprime un restaurant |

### Menus

| Méthode | Endpoint | Auth | Rôle | Description |
|---------|----------|------|------|-------------|
| `GET` | `/menus` |  | Public | Liste tous les menus (pagination, filtres) |
| `GET` | `/menus/:id` |  | Public | Récupère un menu |
| `GET` | `/menus/restaurant/:restaurantId` |  | Public | Menus d'un restaurant |
| `POST` | `/menus` |  | Admin | Crée un menu |
| `PUT` | `/menus/:id` |  | Admin | Met à jour un menu |
| `DELETE` | `/menus/:id` |  | Admin | Supprime un menu |

### Paramètres de requête disponibles

#### Pagination
- `page` : Numéro de page (défaut: 1)
- `limit` : Nombre d'éléments par page (défaut: 10)

#### Tri
- `sortBy` : Champ de tri (`name`, `price`, `category`, etc.)
- `sortOrder` : Ordre de tri (`asc` ou `desc`)

#### Filtres (menus)
- `category` : Filtre par catégorie (entrée, plat, dessert, boisson, apéritif)
- `restaurant_id` : Filtre par restaurant
- `minPrice` / `maxPrice` : Plage de prix
- `search` : Recherche textuelle

##  Authentification

L'API utilise JWT (JSON Web Tokens) pour l'authentification.

### Obtenir un token

1. Inscrivez-vous ou connectez-vous :
```bash
POST /users/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

2. Utilisez le token dans les requêtes :
```bash
Authorization: Bearer <votre-token-jwt>
```

### Exemple avec curl

```bash
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

##  Catégories de menu disponibles

- `entrée` - Entrées et hors-d'œuvre
- `plat` - Plats principaux
- `dessert` - Desserts
- `boisson` - Boissons
- `apéritif` - Apéritifs

##  Rôles utilisateurs

- **User** : Utilisateur standard (lecture, gestion de son propre compte)
- **Admin** : Administrateur (toutes les permissions, gestion des restaurants et menus)

##  Auteur

**Bastien**
