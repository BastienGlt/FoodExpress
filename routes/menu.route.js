const router = require('express').Router();
const MenuController = require('../controllers/menu.controller');
const { authenticateToken, requireAdmin } = require('../middleware/auth.middleware');

// Routes publiques (lecture sans authentification)
router.get('/', MenuController.getAllMenus);                              // Lire tous les menus avec pagination et tri
router.get('/:id', MenuController.getMenuById);                          // Lire un menu par ID
router.get('/restaurant/:restaurantId', MenuController.getMenusByRestaurant); // Lire les menus d'un restaurant

// Routes protégées (Admin seulement)
router.post('/', authenticateToken, requireAdmin, MenuController.createMenu);       // Créer un menu (Admin seulement)
router.put('/:id', authenticateToken, requireAdmin, MenuController.updateMenu);    // Modifier un menu (Admin seulement)
router.delete('/:id', authenticateToken, requireAdmin, MenuController.deleteMenu); // Supprimer un menu (Admin seulement)

module.exports = router;
