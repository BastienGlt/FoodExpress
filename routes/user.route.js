const router = require('express').Router();
const UserController = require('../controllers/user.controller');
const { authenticateToken, requireAdmin, requireOwnershipOrAdmin } = require('../middleware/auth.middleware');

// Routes publiques (pas d'authentification requise)
router.post('/register', UserController.createUser);  // Création de compte
router.post('/login', UserController.loginUser);      // Connexion

// Routes protégées (authentification requise)
router.get('/', authenticateToken, requireAdmin, UserController.getAllUsers);                    // Liste tous les utilisateurs (Admin seulement)
router.get('/:id', authenticateToken, requireOwnershipOrAdmin, UserController.getUserById);     // Voir un utilisateur (Propriétaire ou Admin)
router.put('/:id', authenticateToken, requireOwnershipOrAdmin, UserController.updateUser);     // Modifier un utilisateur (Propriétaire ou Admin)
router.delete('/:id', authenticateToken, requireOwnershipOrAdmin, UserController.deleteUser);  // Supprimer un utilisateur (Propriétaire ou Admin)

module.exports = router;