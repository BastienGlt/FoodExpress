const Restaurants = require('../models/restaurant.model');

// Créer un nouveau restaurant (Admin seulement)
const createRestaurant = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Accès réservé aux administrateurs'
      });
    }

    const { name, address, phone, opening_hours } = req.body;

    // Vérifier si un restaurant avec le même nom et adresse existe déjà
    const existingRestaurant = await Restaurants.findOne({
      name: name,
      address: address
    });

    if (existingRestaurant) {
      return res.status(400).json({
        message: 'Un restaurant avec ce nom et cette adresse existe déjà'
      });
    }

    // Créer le nouveau restaurant
    const newRestaurant = new Restaurants({
      name,
      address,
      phone,
      opening_hours
    });

    const savedRestaurant = await newRestaurant.save();

    res.status(201).json({
      message: 'Restaurant créé avec succès',
      restaurant: savedRestaurant
    });

  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la création du restaurant',
      error: error.message
    });
  }
};

// Obtenir tous les restaurants avec pagination et tri (Public)
const getAllRestaurants = async (req, res) => {
  try {
    // Paramètres de pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Paramètres de tri
    const sortBy = req.query.sortBy || 'name'; // 'name' ou 'address'
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
    
    // Validation du champ de tri
    const allowedSortFields = ['name', 'address', 'createdAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'name';
    
    // Construction de l'objet de tri
    const sortObject = {};
    sortObject[sortField] = sortOrder;

    // Paramètres de recherche (optionnel)
    const searchQuery = {};
    if (req.query.search) {
      searchQuery.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { address: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Exécution de la requête avec pagination
    const restaurants = await Restaurants.find(searchQuery)
      .sort(sortObject)
      .skip(skip)
      .limit(limit);

    // Compter le total pour la pagination
    const total = await Restaurants.countDocuments(searchQuery);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      message: 'Restaurants récupérés avec succès',
      restaurants,
      pagination: {
        currentPage: page,
        totalPages,
        totalRestaurants: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      }
    });

  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la récupération des restaurants',
      error: error.message
    });
  }
};

// Obtenir un restaurant par ID (Public)
const getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurants.findById(id);

    if (!restaurant) {
      return res.status(404).json({
        message: 'Restaurant non trouvé'
      });
    }

    res.status(200).json({
      message: 'Restaurant récupéré avec succès',
      restaurant
    });

  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la récupération du restaurant',
      error: error.message
    });
  }
};

// Mettre à jour un restaurant (Admin seulement)
const updateRestaurant = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Accès réservé aux administrateurs'
      });
    }

    const { id } = req.params;
    const { name, address, phone, opening_hours } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (address) updateData.address = address;
    if (phone) updateData.phone = phone;
    if (opening_hours) updateData.opening_hours = opening_hours;

    const updatedRestaurant = await Restaurants.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedRestaurant) {
      return res.status(404).json({
        message: 'Restaurant non trouvé'
      });
    }

    res.status(200).json({
      message: 'Restaurant mis à jour avec succès',
      restaurant: updatedRestaurant
    });

  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la mise à jour du restaurant',
      error: error.message
    });
  }
};

// Supprimer un restaurant (Admin seulement)
const deleteRestaurant = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Accès réservé aux administrateurs'
      });
    }

    const { id } = req.params;
    const deletedRestaurant = await Restaurants.findByIdAndDelete(id);

    if (!deletedRestaurant) {
      return res.status(404).json({
        message: 'Restaurant non trouvé'
      });
    }

    res.status(200).json({
      message: 'Restaurant supprimé avec succès'
    });

  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la suppression du restaurant',
      error: error.message
    });
  }
};

module.exports = {
  createRestaurant,
  getAllRestaurants,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant
};
