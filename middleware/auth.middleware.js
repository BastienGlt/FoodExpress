const jwt = require('jsonwebtoken');
const Users = require('../models/user.model');

// Middleware pour vérifier le token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        message: 'Token d\'accès requis'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await Users.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        message: 'Token invalide'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({
      message: 'Token invalide ou expiré'
    });
  }
};

// Middleware pour vérifier si l'utilisateur est admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Accès réservé aux administrateurs'
    });
  }
  next();
};

// Middleware pour vérifier si l'utilisateur peut accéder à la ressource
const requireOwnershipOrAdmin = (req, res, next) => {
  const requestedUserId = req.params.id;
  
  if (req.user.role === 'admin' || req.user._id.toString() === requestedUserId) {
    next();
  } else {
    return res.status(403).json({
      message: 'Accès non autorisé. Vous ne pouvez accéder qu\'à vos propres données.'
    });
  }
};

// Middleware optionnel - continue même sans token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await Users.findById(decoded.userId).select('-password');
      req.user = user;
    }
    
    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireOwnershipOrAdmin,
  optionalAuth
};