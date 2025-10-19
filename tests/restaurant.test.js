const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { app, server } = require('../server');
const Restaurants = require('../models/restaurant.model');
const Users = require('../models/user.model');

// Configuration de l'environnement de test
process.env.JWT_SECRET = 'test-secret-key';

// Mock de mongoose pour éviter la connexion réelle à la base de données
jest.mock('../config/db.config', () => ({}));

// Mock des modèles
jest.mock('../models/restaurant.model');
jest.mock('../models/user.model');

// Variables globales pour les tests
let adminToken;
let userToken;
let testRestaurantId = new mongoose.Types.ObjectId().toString();
let testAdminId = new mongoose.Types.ObjectId().toString();
let testUserId = new mongoose.Types.ObjectId().toString();

describe('Restaurant Routes - FoodExpress API', () => {
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

  // ========== TESTS POUR GET ALL RESTAURANTS (PUBLIC) ==========
  describe('GET /restaurants', () => {
    it('devrait récupérer tous les restaurants avec pagination', async () => {
      const mockRestaurants = [
        {
          _id: testRestaurantId,
          name: 'Restaurant Test 1',
          address: '123 Rue Test',
          phone: '0123456789',
          opening_hours: '9h-22h'
        },
        {
          _id: new mongoose.Types.ObjectId().toString(),
          name: 'Restaurant Test 2',
          address: '456 Rue Test',
          phone: '0987654321',
          opening_hours: '10h-23h'
        }
      ];

      Restaurants.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockRestaurants)
      });

      Restaurants.countDocuments.mockResolvedValue(2);

      const response = await request(app).get('/restaurants');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('restaurants');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.restaurants)).toBe(true);
      expect(response.body.restaurants.length).toBe(2);
    });

    it('devrait récupérer les restaurants avec recherche', async () => {
      const mockRestaurants = [
        {
          _id: testRestaurantId,
          name: 'Pizza Express',
          address: '123 Rue Test',
          phone: '0123456789',
          opening_hours: '9h-22h'
        }
      ];

      Restaurants.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockRestaurants)
      });

      Restaurants.countDocuments.mockResolvedValue(1);

      const response = await request(app)
        .get('/restaurants')
        .query({ search: 'Pizza' });

      expect(response.status).toBe(200);
      expect(response.body.restaurants).toHaveLength(1);
    });

    it('devrait gérer les paramètres de tri', async () => {
      Restaurants.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });

      Restaurants.countDocuments.mockResolvedValue(0);

      const response = await request(app)
        .get('/restaurants')
        .query({ sortBy: 'name', sortOrder: 'desc' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('pagination');
    });
  });

  // ========== TESTS POUR GET RESTAURANT BY ID (PUBLIC) ==========
  describe('GET /restaurants/:id', () => {
    it('devrait récupérer un restaurant par son ID', async () => {
      const mockRestaurant = {
        _id: testRestaurantId,
        name: 'Restaurant Test',
        address: '123 Rue Test',
        phone: '0123456789',
        opening_hours: '9h-22h'
      };

      Restaurants.findById.mockResolvedValue(mockRestaurant);

      const response = await request(app).get(`/restaurants/${testRestaurantId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('restaurant');
      expect(response.body.restaurant.name).toBe('Restaurant Test');
    });

    it('devrait retourner 404 si le restaurant n\'existe pas', async () => {
      Restaurants.findById.mockResolvedValue(null);

      const response = await request(app)
        .get(`/restaurants/${new mongoose.Types.ObjectId()}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Restaurant non trouvé');
    });
  });

  // ========== TESTS POUR CREATE RESTAURANT (ADMIN ONLY) ==========
  describe('POST /restaurants', () => {
    it('devrait créer un nouveau restaurant en tant qu\'admin', async () => {
      const newRestaurant = {
        name: 'Nouveau Restaurant',
        address: '789 Rue Nouvelle',
        phone: '0111222333',
        opening_hours: '11h-23h'
      };

      const mockAdmin = {
        _id: testAdminId,
        email: 'admin@test.com',
        role: 'admin'
      };

      const mockSavedRestaurant = {
        _id: testRestaurantId,
        ...newRestaurant,
        save: jest.fn()
      };

      Users.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockAdmin)
      });

      Restaurants.findOne.mockResolvedValue(null);
      Restaurants.prototype.save = jest.fn().mockResolvedValue(mockSavedRestaurant);

      const response = await request(app)
        .post('/restaurants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newRestaurant);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Restaurant créé avec succès');
      expect(response.body).toHaveProperty('restaurant');
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
        .post('/restaurants')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Test',
          address: 'Test',
          phone: '0123456789',
          opening_hours: '9h-22h'
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('administrateurs');
    });

    it('devrait refuser la création sans authentification', async () => {
      const response = await request(app)
        .post('/restaurants')
        .send({
          name: 'Test',
          address: 'Test',
          phone: '0123456789',
          opening_hours: '9h-22h'
        });

      expect(response.status).toBe(401);
    });

    it('devrait refuser la création d\'un restaurant déjà existant', async () => {
      const mockAdmin = {
        _id: testAdminId,
        email: 'admin@test.com',
        role: 'admin'
      };

      Users.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockAdmin)
      });

      Restaurants.findOne.mockResolvedValue({
        name: 'Restaurant Existant',
        address: '123 Rue Test'
      });

      const response = await request(app)
        .post('/restaurants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Restaurant Existant',
          address: '123 Rue Test',
          phone: '0123456789',
          opening_hours: '9h-22h'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('existe déjà');
    });
  });

  // ========== TESTS POUR UPDATE RESTAURANT (ADMIN ONLY) ==========
  describe('PUT /restaurants/:id', () => {
    it('devrait mettre à jour un restaurant en tant qu\'admin', async () => {
      const updateData = {
        name: 'Restaurant Modifié',
        phone: '0999888777'
      };

      const mockAdmin = {
        _id: testAdminId,
        email: 'admin@test.com',
        role: 'admin'
      };

      const mockUpdatedRestaurant = {
        _id: testRestaurantId,
        name: updateData.name,
        address: '123 Rue Test',
        phone: updateData.phone,
        opening_hours: '9h-22h'
      };

      Users.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockAdmin)
      });

      Restaurants.findByIdAndUpdate.mockResolvedValue(mockUpdatedRestaurant);

      const response = await request(app)
        .put(`/restaurants/${testRestaurantId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Restaurant mis à jour avec succès');
      expect(response.body.restaurant.name).toBe(updateData.name);
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
        .put(`/restaurants/${testRestaurantId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Test' });

      expect(response.status).toBe(403);
    });

    it('devrait retourner 404 si le restaurant n\'existe pas', async () => {
      const mockAdmin = {
        _id: testAdminId,
        email: 'admin@test.com',
        role: 'admin'
      };

      Users.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockAdmin)
      });

      Restaurants.findByIdAndUpdate.mockResolvedValue(null);

      const response = await request(app)
        .put(`/restaurants/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Restaurant non trouvé');
    });
  });

  // ========== TESTS POUR DELETE RESTAURANT (ADMIN ONLY) ==========
  describe('DELETE /restaurants/:id', () => {
    it('devrait supprimer un restaurant en tant qu\'admin', async () => {
      const mockAdmin = {
        _id: testAdminId,
        email: 'admin@test.com',
        role: 'admin'
      };

      const mockRestaurant = {
        _id: testRestaurantId,
        name: 'Restaurant à supprimer'
      };

      Users.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockAdmin)
      });

      Restaurants.findByIdAndDelete.mockResolvedValue(mockRestaurant);

      const response = await request(app)
        .delete(`/restaurants/${testRestaurantId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Restaurant supprimé avec succès');
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
        .delete(`/restaurants/${testRestaurantId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    it('devrait retourner 404 si le restaurant n\'existe pas', async () => {
      const mockAdmin = {
        _id: testAdminId,
        email: 'admin@test.com',
        role: 'admin'
      };

      Users.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockAdmin)
      });

      Restaurants.findByIdAndDelete.mockResolvedValue(null);

      const response = await request(app)
        .delete(`/restaurants/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Restaurant non trouvé');
    });
  });
});
