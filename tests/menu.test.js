const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { app, server } = require('../server');
const Menu = require('../models/menu.model');
const Restaurant = require('../models/restaurant.model');
const Users = require('../models/user.model');

// Configuration de l'environnement de test
process.env.JWT_SECRET = 'test-secret-key';

// Mock de mongoose pour éviter la connexion réelle à la base de données
jest.mock('../config/db.config', () => ({}));

// Mock des modèles
jest.mock('../models/menu.model');
jest.mock('../models/restaurant.model');
jest.mock('../models/user.model');

// Variables globales pour les tests
let adminToken;
let userToken;
let testMenuId = new mongoose.Types.ObjectId().toString();
let testRestaurantId = new mongoose.Types.ObjectId().toString();
let testAdminId = new mongoose.Types.ObjectId().toString();
let testUserId = new mongoose.Types.ObjectId().toString();

describe('Menu Routes - FoodExpress API', () => {
  beforeAll(() => {
    // Créer des tokens pour les tests
    adminToken = jwt.sign(
      { userId: testAdminId, email: 'admin@test.com', role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    userToken = jwt.sign(
      { userId: testUserId, email: 'user@test.com', role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  });

  afterAll(async () => {
    // Fermer le serveur après les tests
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========== TESTS POUR GET ALL MENUS (PUBLIC) ==========
  describe('GET /menus', () => {
    it('devrait récupérer tous les menus avec pagination', async () => {
      const mockMenus = [
        {
          _id: testMenuId,
          restaurant_id: testRestaurantId,
          name: 'Pizza Margherita',
          description: 'Pizza classique',
          price: 12.50,
          category: 'plat'
        },
        {
          _id: new mongoose.Types.ObjectId().toString(),
          restaurant_id: testRestaurantId,
          name: 'Tiramisu',
          description: 'Dessert italien',
          price: 6.50,
          category: 'dessert'
        }
      ];

      Menu.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockMenus)
      });

      Menu.countDocuments.mockResolvedValue(2);

      const response = await request(app).get('/menus');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('menus');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.menus)).toBe(true);
      expect(response.body.menus.length).toBe(2);
    });

    it('devrait filtrer les menus par catégorie', async () => {
      const mockMenus = [
        {
          _id: testMenuId,
          name: 'Pizza Margherita',
          category: 'plat',
          price: 12.50
        }
      ];

      Menu.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockMenus)
      });

      Menu.countDocuments.mockResolvedValue(1);

      const response = await request(app)
        .get('/menus')
        .query({ category: 'plat' });

      expect(response.status).toBe(200);
      expect(response.body.menus).toHaveLength(1);
    });

    it('devrait filtrer les menus par plage de prix', async () => {
      Menu.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });

      Menu.countDocuments.mockResolvedValue(0);

      const response = await request(app)
        .get('/menus')
        .query({ minPrice: 10, maxPrice: 20 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('pagination');
    });

    it('devrait filtrer les menus par restaurant_id', async () => {
      Menu.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });

      Menu.countDocuments.mockResolvedValue(0);

      const response = await request(app)
        .get('/menus')
        .query({ restaurant_id: testRestaurantId });

      expect(response.status).toBe(200);
    });
  });

  // ========== TESTS POUR GET MENU BY ID (PUBLIC) ==========
  describe('GET /menus/:id', () => {
    it('devrait récupérer un menu par son ID', async () => {
      const mockMenu = {
        _id: testMenuId,
        restaurant_id: {
          _id: testRestaurantId,
          name: 'Restaurant Test',
          address: '123 Rue Test'
        },
        name: 'Pizza Margherita',
        description: 'Pizza classique',
        price: 12.50,
        category: 'plat'
      };

      Menu.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockMenu)
      });

      const response = await request(app).get(`/menus/${testMenuId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('menu');
      expect(response.body.menu.name).toBe('Pizza Margherita');
    });

    it('devrait retourner 404 si le menu n\'existe pas', async () => {
      Menu.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      const response = await request(app)
        .get(`/menus/${new mongoose.Types.ObjectId()}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Menu non trouvé');
    });
  });

  // ========== TESTS POUR GET MENUS BY RESTAURANT ==========
  describe('GET /menus/restaurant/:restaurantId', () => {
    it('devrait récupérer tous les menus d\'un restaurant', async () => {
      const mockRestaurant = {
        _id: testRestaurantId,
        name: 'Restaurant Test',
        address: '123 Rue Test'
      };

      const mockMenus = [
        {
          _id: testMenuId,
          name: 'Pizza Margherita',
          price: 12.50,
          category: 'plat'
        }
      ];

      Restaurant.findById.mockResolvedValue(mockRestaurant);

      Menu.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockMenus)
      });

      Menu.countDocuments.mockResolvedValue(1);

      const response = await request(app)
        .get(`/menus/restaurant/${testRestaurantId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('menus');
      expect(response.body).toHaveProperty('restaurant');
      expect(response.body.restaurant.name).toBe('Restaurant Test');
    });

    it('devrait retourner 404 si le restaurant n\'existe pas', async () => {
      Restaurant.findById.mockResolvedValue(null);

      const response = await request(app)
        .get(`/menus/restaurant/${new mongoose.Types.ObjectId()}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Restaurant non trouvé');
    });

    it('devrait filtrer les menus par catégorie dans un restaurant', async () => {
      const mockRestaurant = {
        _id: testRestaurantId,
        name: 'Restaurant Test',
        address: '123 Rue Test'
      };

      Restaurant.findById.mockResolvedValue(mockRestaurant);

      Menu.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });

      Menu.countDocuments.mockResolvedValue(0);

      const response = await request(app)
        .get(`/menus/restaurant/${testRestaurantId}`)
        .query({ category: 'dessert' });

      expect(response.status).toBe(200);
    });
  });

  // ========== TESTS POUR CREATE MENU (ADMIN ONLY) ==========
  describe('POST /menus', () => {
    it('devrait créer un nouveau menu en tant qu\'admin', async () => {
      const newMenu = {
        restaurant_id: testRestaurantId,
        name: 'Nouveau Plat',
        description: 'Un délicieux plat',
        price: 15.00,
        category: 'plat'
      };

      const mockAdmin = {
        _id: testAdminId,
        email: 'admin@test.com',
        role: 'admin'
      };

      const mockRestaurant = {
        _id: testRestaurantId,
        name: 'Restaurant Test'
      };

      const mockSavedMenu = {
        _id: testMenuId,
        ...newMenu,
        populate: jest.fn().mockResolvedValue({
          _id: testMenuId,
          ...newMenu,
          restaurant_id: mockRestaurant
        })
      };

      Users.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockAdmin)
      });

      Restaurant.findById.mockResolvedValue(mockRestaurant);
      Menu.prototype.save = jest.fn().mockResolvedValue(mockSavedMenu);

      const response = await request(app)
        .post('/menus')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newMenu);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Menu créé avec succès');
      expect(response.body).toHaveProperty('menu');
    });

    it('devrait refuser la création si le restaurant n\'existe pas', async () => {
      const mockAdmin = {
        _id: testAdminId,
        email: 'admin@test.com',
        role: 'admin'
      };

      Users.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockAdmin)
      });

      Restaurant.findById.mockResolvedValue(null);

      const response = await request(app)
        .post('/menus')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          restaurant_id: new mongoose.Types.ObjectId(),
          name: 'Test',
          description: 'Test',
          price: 10,
          category: 'plat'
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Restaurant non trouvé');
    });

    it('devrait refuser la création par un utilisateur non-admin', async () => {
      const mockUser = {
        _id: testUserId,
        email: 'user@test.com',
        role: 'user'
      };

      Users.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const response = await request(app)
        .post('/menus')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          restaurant_id: testRestaurantId,
          name: 'Test',
          description: 'Test',
          price: 10,
          category: 'plat'
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('administrateurs');
    });

    it('devrait refuser la création sans authentification', async () => {
      const response = await request(app)
        .post('/menus')
        .send({
          restaurant_id: testRestaurantId,
          name: 'Test',
          description: 'Test',
          price: 10,
          category: 'plat'
        });

      expect(response.status).toBe(401);
    });
  });

  // ========== TESTS POUR UPDATE MENU (ADMIN ONLY) ==========
  describe('PUT /menus/:id', () => {
    it('devrait mettre à jour un menu en tant qu\'admin', async () => {
      const updateData = {
        name: 'Menu Modifié',
        price: 18.50
      };

      const mockAdmin = {
        _id: testAdminId,
        email: 'admin@test.com',
        role: 'admin'
      };

      const mockUpdatedMenu = {
        _id: testMenuId,
        restaurant_id: testRestaurantId,
        name: updateData.name,
        description: 'Description',
        price: updateData.price,
        category: 'plat'
      };

      Users.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockAdmin)
      });

      Menu.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUpdatedMenu)
      });

      const response = await request(app)
        .put(`/menus/${testMenuId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Menu mis à jour avec succès');
      expect(response.body.menu.name).toBe(updateData.name);
    });

    it('devrait vérifier l\'existence du restaurant lors de la mise à jour', async () => {
      const mockAdmin = {
        _id: testAdminId,
        email: 'admin@test.com',
        role: 'admin'
      };

      Users.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockAdmin)
      });

      Restaurant.findById.mockResolvedValue(null);

      const response = await request(app)
        .put(`/menus/${testMenuId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ restaurant_id: new mongoose.Types.ObjectId() });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Restaurant non trouvé');
    });

    it('devrait refuser la mise à jour par un utilisateur non-admin', async () => {
      const mockUser = {
        _id: testUserId,
        email: 'user@test.com',
        role: 'user'
      };

      Users.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const response = await request(app)
        .put(`/menus/${testMenuId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Test' });

      expect(response.status).toBe(403);
    });

    it('devrait retourner 404 si le menu n\'existe pas', async () => {
      const mockAdmin = {
        _id: testAdminId,
        email: 'admin@test.com',
        role: 'admin'
      };

      Users.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockAdmin)
      });

      Menu.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      const response = await request(app)
        .put(`/menus/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Menu non trouvé');
    });
  });

  // ========== TESTS POUR DELETE MENU (ADMIN ONLY) ==========
  describe('DELETE /menus/:id', () => {
    it('devrait supprimer un menu en tant qu\'admin', async () => {
      const mockAdmin = {
        _id: testAdminId,
        email: 'admin@test.com',
        role: 'admin'
      };

      const mockMenu = {
        _id: testMenuId,
        name: 'Menu à supprimer'
      };

      Users.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockAdmin)
      });

      Menu.findByIdAndDelete.mockResolvedValue(mockMenu);

      const response = await request(app)
        .delete(`/menus/${testMenuId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Menu supprimé avec succès');
    });

    it('devrait refuser la suppression par un utilisateur non-admin', async () => {
      const mockUser = {
        _id: testUserId,
        email: 'user@test.com',
        role: 'user'
      };

      Users.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const response = await request(app)
        .delete(`/menus/${testMenuId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    it('devrait retourner 404 si le menu n\'existe pas', async () => {
      const mockAdmin = {
        _id: testAdminId,
        email: 'admin@test.com',
        role: 'admin'
      };

      Users.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockAdmin)
      });

      Menu.findByIdAndDelete.mockResolvedValue(null);

      const response = await request(app)
        .delete(`/menus/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Menu non trouvé');
    });
  });
});
