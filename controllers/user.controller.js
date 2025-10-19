const Users = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Créer un nouvel utilisateur
const createUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await Users.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'Un utilisateur avec cet email ou ce nom d\'utilisateur existe déjà'
      });
    }

    // Hasher le mot de passe
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Créer le nouvel utilisateur
    const newUser = new Users({
      username,
      email,
      password: hashedPassword,
      role: role || 'user'
    });

    const savedUser = await newUser.save();

    // Retourner l'utilisateur sans le mot de passe
    const { password: _, ...userResponse } = savedUser.toObject();

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: userResponse
    });

  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la création de l\'utilisateur',
      error: error.message
    });
  }
};

// Obtenir tous les utilisateurs (Admin seulement)
const getAllUsers = async (req, res) => {
  try {
    // Seuls les admins peuvent voir tous les utilisateurs
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Accès réservé aux administrateurs'
      });
    }

    const users = await Users.find().select('-password');
    res.status(200).json({
      message: 'Utilisateurs récupérés avec succès',
      users
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la récupération des utilisateurs',
      error: error.message
    });
  }
};

// Obtenir un utilisateur par ID (Propriétaire ou Admin)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier les droits d'accès
    if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
      return res.status(403).json({
        message: 'Accès non autorisé. Vous ne pouvez accéder qu\'à vos propres données.'
      });
    }

    const user = await Users.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json({
      message: 'Utilisateur récupéré avec succès',
      user
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la récupération de l\'utilisateur',
      error: error.message
    });
  }
};

// Mettre à jour un utilisateur (Propriétaire ou Admin)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, role } = req.body;

    // Vérifier les droits d'accès
    if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
      return res.status(403).json({
        message: 'Accès non autorisé. Vous ne pouvez modifier que vos propres données.'
      });
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    
    // Seuls les admins peuvent changer les rôles
    if (role) {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          message: 'Seuls les administrateurs peuvent modifier les rôles'
        });
      }
      updateData.role = role;
    }

    // Si un nouveau mot de passe est fourni, le hasher
    if (password) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    const updatedUser = await Users.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json({
      message: 'Utilisateur mis à jour avec succès',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la mise à jour de l\'utilisateur',
      error: error.message
    });
  }
};

// Supprimer un utilisateur (Propriétaire ou Admin)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier les droits d'accès
    if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
      return res.status(403).json({
        message: 'Accès non autorisé. Vous ne pouvez supprimer que votre propre compte.'
      });
    }

    const deletedUser = await Users.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json({
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la suppression de l\'utilisateur',
      error: error.message
    });
  }
};

// Connexion utilisateur
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Trouver l'utilisateur par email
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Retourner l'utilisateur sans le mot de passe + token
    const { password: _, ...userResponse } = user.toObject();

    res.status(200).json({
      message: 'Connexion réussie',
      user: userResponse,
      token: token
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la connexion',
      error: error.message
    });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  loginUser
};