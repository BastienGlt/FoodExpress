const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

require('./config/db.config');


/////SWAGGER/////
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FoodExpress API',
      version: '1.0.0',
      description: 'A basic blog API',
    }
  },
    apis: ['swagger.yaml'],
  };

const swaggerSpec = swaggerDocument(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


/////ROUTES/////
const userRoutes = require('./routes/user.route');
app.use('/users', userRoutes);
const restaurantRoutes = require('./routes/restaurant.route');
app.use('/restaurants', restaurantRoutes);
const menuRoutes = require('./routes/menu.route');
app.use('/menus', menuRoutes);

const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

module.exports = {
  app, 
  server
}