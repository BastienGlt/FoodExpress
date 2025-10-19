const router = require('express').Router();
const RestaurantController = require('../controllers/restaurant.controller');
const { authenticateToken, requireAdmin } = require('../middleware/auth.middleware');

// Routes publiques (lecture sans authentification)
router.get('/', RestaurantController.getAllRestaurants);           // Lire tous les restaurants avec pagination et tri
router.get('/:id', RestaurantController.getRestaurantById);       // Lire un restaurant par ID

// Routes protégées (Admin seulement)
router.post('/', authenticateToken, requireAdmin, RestaurantController.createRestaurant);      // Créer un restaurant (Admin seulement)
router.put('/:id', authenticateToken, requireAdmin, RestaurantController.updateRestaurant);    // Modifier un restaurant (Admin seulement)
router.delete('/:id', authenticateToken, requireAdmin, RestaurantController.deleteRestaurant); // Supprimer un restaurant (Admin seulement)

module.exports = router;
