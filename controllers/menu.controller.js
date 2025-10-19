const Menu = require('../models/menu.model');
const Restaurant = require('../models/restaurant.model');

// Créer un nouveau menu (Admin seulement)
const createMenu = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Accès réservé aux administrateurs'
      });
    }

    const { restaurant_id, name, description, price, category } = req.body;

    // Vérifier si le restaurant existe
    const restaurant = await Restaurant.findById(restaurant_id);
    if (!restaurant) {
      return res.status(404).json({
        message: 'Restaurant non trouvé'
      });
    }

    // Créer le nouveau menu
    const newMenu = new Menu({
      restaurant_id,
      name,
      description,
      price,
      category
    });

    const savedMenu = await newMenu.save();
    
    // Peupler les données du restaurant pour la réponse
    await savedMenu.populate('restaurant_id', 'name address');

    res.status(201).json({
      message: 'Menu créé avec succès',
      menu: savedMenu
    });

  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la création du menu',
      error: error.message
    });
  }
};

// Obtenir tous les menus avec pagination et tri (Public)
const getAllMenus = async (req, res) => {
  try {
    // Paramètres de pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Paramètres de tri
    const sortBy = req.query.sortBy || 'name'; // 'name', 'price', 'category'
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
    
    // Validation du champ de tri
    const allowedSortFields = ['name', 'price', 'category', 'createdAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'name';
    
    // Construction de l'objet de tri
    const sortObject = {};
    sortObject[sortField] = sortOrder;

    // Paramètres de filtrage
    const searchQuery = {};
    
    // Filtrer par restaurant
    if (req.query.restaurant_id) {
      searchQuery.restaurant_id = req.query.restaurant_id;
    }
    
    // Filtrer par catégorie
    if (req.query.category) {
      searchQuery.category = req.query.category;
    }
    
    // Filtrer par plage de prix
    if (req.query.minPrice || req.query.maxPrice) {
      searchQuery.price = {};
      if (req.query.minPrice) {
        searchQuery.price.$gte = parseFloat(req.query.minPrice);
      }
      if (req.query.maxPrice) {
        searchQuery.price.$lte = parseFloat(req.query.maxPrice);
      }
    }
    
    // Recherche textuelle
    if (req.query.search) {
      searchQuery.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Exécution de la requête avec pagination et population
    const menus = await Menu.find(searchQuery)
      .populate('restaurant_id', 'name address phone')
      .sort(sortObject)
      .skip(skip)
      .limit(limit);

    // Compter le total pour la pagination
    const total = await Menu.countDocuments(searchQuery);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      message: 'Menus récupérés avec succès',
      menus,
      pagination: {
        currentPage: page,
        totalPages,
        totalMenus: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      }
    });

  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la récupération des menus',
      error: error.message
    });
  }
};

// Obtenir un menu par ID (Public)
const getMenuById = async (req, res) => {
  try {
    const { id } = req.params;
    const menu = await Menu.findById(id).populate('restaurant_id', 'name address phone opening_hours');

    if (!menu) {
      return res.status(404).json({
        message: 'Menu non trouvé'
      });
    }

    res.status(200).json({
      message: 'Menu récupéré avec succès',
      menu
    });

  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la récupération du menu',
      error: error.message
    });
  }
};

// Obtenir tous les menus d'un restaurant (Public)
const getMenusByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    // Paramètres de pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Paramètres de tri
    const sortBy = req.query.sortBy || 'category';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
    const allowedSortFields = ['name', 'price', 'category'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'category';
    
    const sortObject = {};
    sortObject[sortField] = sortOrder;

    // Vérifier si le restaurant existe
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        message: 'Restaurant non trouvé'
      });
    }

    // Rechercher les menus du restaurant
    const searchQuery = { restaurant_id: restaurantId };
    
    // Filtrer par catégorie si spécifié
    if (req.query.category) {
      searchQuery.category = req.query.category;
    }

    const menus = await Menu.find(searchQuery)
      .populate('restaurant_id', 'name address')
      .sort(sortObject)
      .skip(skip)
      .limit(limit);

    const total = await Menu.countDocuments(searchQuery);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      message: 'Menus du restaurant récupérés avec succès',
      restaurant: {
        id: restaurant._id,
        name: restaurant.name,
        address: restaurant.address
      },
      menus,
      pagination: {
        currentPage: page,
        totalPages,
        totalMenus: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      }
    });

  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la récupération des menus du restaurant',
      error: error.message
    });
  }
};

// Mettre à jour un menu (Admin seulement)
const updateMenu = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Accès réservé aux administrateurs'
      });
    }

    const { id } = req.params;
    const { restaurant_id, name, description, price, category } = req.body;

    // Si restaurant_id est fourni, vérifier qu'il existe
    if (restaurant_id) {
      const restaurant = await Restaurant.findById(restaurant_id);
      if (!restaurant) {
        return res.status(404).json({
          message: 'Restaurant non trouvé'
        });
      }
    }

    const updateData = {};
    if (restaurant_id) updateData.restaurant_id = restaurant_id;
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (category) updateData.category = category;

    const updatedMenu = await Menu.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('restaurant_id', 'name address');

    if (!updatedMenu) {
      return res.status(404).json({
        message: 'Menu non trouvé'
      });
    }

    res.status(200).json({
      message: 'Menu mis à jour avec succès',
      menu: updatedMenu
    });

  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la mise à jour du menu',
      error: error.message
    });
  }
};

// Supprimer un menu (Admin seulement)
const deleteMenu = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Accès réservé aux administrateurs'
      });
    }

    const { id } = req.params;
    const deletedMenu = await Menu.findByIdAndDelete(id);

    if (!deletedMenu) {
      return res.status(404).json({
        message: 'Menu non trouvé'
      });
    }

    res.status(200).json({
      message: 'Menu supprimé avec succès'
    });

  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la suppression du menu',
      error: error.message
    });
  }
};

module.exports = {
  createMenu,
  getAllMenus,
  getMenuById,
  getMenusByRestaurant,
  updateMenu,
  deleteMenu
};
