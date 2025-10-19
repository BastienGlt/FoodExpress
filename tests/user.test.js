const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { app, server } = require('../server');
const Users = require('../models/user.model');

// Configuration de l'environnement de test
process.env.JWT_SECRET = 'test-secret-key';

// Mock de mongoose pour éviter la connexion réelle à la base de données
jest.mock('../config/db.config', () => ({}));

// Mock du modèle User
jest.mock('../models/user.model');

// Variables globales pour les tests
let adminToken;
let userToken;
let testUserId = new mongoose.Types.ObjectId().toString();
let testAdminId = new mongoose.Types.ObjectId().toString();

describe('User Routes - FoodExpress API', () => {
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

  // ========== TESTS POUR L'ENREGISTREMENT ==========
  describe('POST /users/register', () => {
    it('devrait créer un nouvel utilisateur avec succès', async () => {
      const newUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        role: 'user'
      };

      const mockSavedUser = {
        _id: testUserId,
        username: newUser.username,
        email: newUser.email,
        role: 'user',
        toObject: function() {
          return { ...this, password: 'hashedpassword' };
        }
      };

      Users.findOne.mockResolvedValue(null);
      Users.prototype.save = jest.fn().mockResolvedValue(mockSavedUser);

      const response = await request(app)
        .post('/users/register')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Utilisateur créé avec succès');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('devrait rejeter un utilisateur avec un email déjà existant', async () => {
      const existingUser = {
        username: 'existing',
        email: 'existing@example.com',
        password: 'Password123!'
      };

      Users.findOne.mockResolvedValue({ email: existingUser.email });

      const response = await request(app)
        .post('/users/register')
        .send(existingUser);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('existe déjà');
    });
  });

  // ========== TESTS POUR LA CONNEXION ==========
  describe('POST /users/login', () => {
    it('devrait connecter un utilisateur avec des identifiants valides', async () => {
      const loginData = {
        email: 'user@test.com',
        password: 'Password123!'
      };

      const mockUser = {
        _id: testUserId,
        username: 'testuser',
        email: loginData.email,
        password: await bcrypt.hash(loginData.password, 10),
        role: 'user',
        toObject: function() {
          return {
            _id: this._id,
            username: this.username,
            email: this.email,
            role: this.role,
            password: this.password
          };
        }
      };

      Users.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/users/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Connexion réussie');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('devrait rejeter la connexion avec un email invalide', async () => {
      Users.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/users/login')
        .send({ email: 'nonexistent@test.com', password: 'Password123!' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Email ou mot de passe incorrect');
    });

    it('devrait rejeter la connexion avec un mot de passe invalide', async () => {
      const mockUser = {
        _id: testUserId,
        email: 'user@test.com',
        password: await bcrypt.hash('correctpassword', 10),
        role: 'user'
      };

      Users.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/users/login')
        .send({ email: 'user@test.com', password: 'wrongpassword' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Email ou mot de passe incorrect');
    });
  });

  // ========== TESTS POUR GET ALL USERS (ADMIN ONLY) ==========
  describe('GET /users', () => {
    it('devrait récupérer tous les utilisateurs en tant qu\'admin', async () => {
      const mockUsers = [
        { _id: testUserId, username: 'user1', email: 'user1@test.com', role: 'user' },
        { _id: testAdminId, username: 'admin', email: 'admin@test.com', role: 'admin' }
      ];

      const mockAdmin = {
        _id: testAdminId,
        email: 'admin@test.com',
        role: 'admin',
        select: jest.fn().mockReturnThis()
      };

      Users.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockAdmin)
      });
      
      Users.find.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUsers)
      });

      const response = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    it('devrait refuser l\'accès aux utilisateurs non-admin', async () => {
      const mockUser = {
        _id: testUserId,
        email: 'user@test.com',
        role: 'user'
      };

      Users.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const response = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('administrateurs');
    });

    it('devrait refuser l\'accès sans token', async () => {
      const response = await request(app).get('/users');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });
  });

  // ========== TESTS POUR GET USER BY ID ==========
  describe('GET /users/:id', () => {
    it('devrait permettre à un utilisateur de voir son propre profil', async () => {
      const mockUser = {
        _id: testUserId,
        username: 'testuser',
        email: 'user@test.com',
        role: 'user'
      };

      Users.findById.mockReturnValue({
        select: jest.fn()
          .mockResolvedValueOnce(mockUser) // Pour l'authentification
          .mockResolvedValueOnce(mockUser) // Pour getUserById
      });

      const response = await request(app)
        .get(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('user@test.com');
    });

    it('devrait permettre à un admin de voir n\'importe quel profil', async () => {
      const mockAdmin = {
        _id: testAdminId,
        email: 'admin@test.com',
        role: 'admin'
      };

      const mockTargetUser = {
        _id: testUserId,
        username: 'otheruser',
        email: 'other@test.com',
        role: 'user'
      };

      Users.findById.mockReturnValue({
        select: jest.fn()
          .mockResolvedValueOnce(mockAdmin) // Pour l'authentification
          .mockResolvedValueOnce(mockTargetUser) // Pour getUserById
      });

      const response = await request(app)
        .get(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
    });

    it('devrait refuser à un utilisateur de voir le profil d\'un autre', async () => {
      const mockUser = {
        _id: testUserId,
        email: 'user@test.com',
        role: 'user'
      };

      const otherUserId = new mongoose.Types.ObjectId().toString();

      Users.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const response = await request(app)
        .get(`/users/${otherUserId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
  });

  // ========== TESTS POUR UPDATE USER ==========
  describe('PUT /users/:id', () => {
    it('devrait permettre à un utilisateur de modifier son propre profil', async () => {
      const updateData = {
        username: 'updateduser',
        email: 'updated@test.com'
      };

      const mockUser = {
        _id: testUserId,
        email: 'user@test.com',
        role: 'user'
      };

      const mockUpdatedUser = {
        _id: testUserId,
        username: updateData.username,
        email: updateData.email,
        role: 'user'
      };

      Users.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });
      
      Users.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUpdatedUser)
      });

      const response = await request(app)
        .put(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Utilisateur mis à jour avec succès');
      expect(response.body).toHaveProperty('user');
    });

    it('devrait empêcher un utilisateur normal de changer son rôle', async () => {
      const mockUser = {
        _id: testUserId,
        email: 'user@test.com',
        role: 'user'
      };

      Users.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const response = await request(app)
        .put(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'admin' });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('administrateurs');
    });
  });

  // ========== TESTS POUR DELETE USER ==========
  describe('DELETE /users/:id', () => {
    it('devrait permettre à un utilisateur de supprimer son propre compte', async () => {
      const mockUser = {
        _id: testUserId,
        email: 'user@test.com',
        role: 'user'
      };

      Users.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });
      
      Users.findByIdAndDelete.mockResolvedValue(mockUser);

      const response = await request(app)
        .delete(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Utilisateur supprimé avec succès');
    });

    it('devrait permettre à un admin de supprimer n\'importe quel compte', async () => {
      const mockAdmin = {
        _id: testAdminId,
        email: 'admin@test.com',
        role: 'admin'
      };

      const mockTargetUser = {
        _id: testUserId,
        email: 'user@test.com',
        role: 'user'
      };

      Users.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockAdmin)
      });
      
      Users.findByIdAndDelete.mockResolvedValue(mockTargetUser);

      const response = await request(app)
        .delete(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Utilisateur supprimé avec succès');
    });

    it('devrait refuser à un utilisateur de supprimer le compte d\'un autre', async () => {
      const mockUser = {
        _id: testUserId,
        email: 'user@test.com',
        role: 'user'
      };

      const otherUserId = new mongoose.Types.ObjectId().toString();

      Users.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const response = await request(app)
        .delete(`/users/${otherUserId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
  });
});