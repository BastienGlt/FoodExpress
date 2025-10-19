const mongoose = require('mongoose');

const schemaMenu = new mongoose.Schema({
  restaurant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  name: {
    type: String,
    required: true,
    maxlength: 255,
    trim: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['entrée', 'plat', 'dessert', 'boisson', 'apéritif'],
    trim: true
  }
}, { timestamps: true });

// Index pour améliorer les performances de tri et recherche
schemaMenu.index({ price: 1 });
schemaMenu.index({ category: 1 });
schemaMenu.index({ restaurant_id: 1 });
schemaMenu.index({ name: 1 });

const Menu = mongoose.model('Menu', schemaMenu);

module.exports = Menu;
