const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EFOY GEBYA E-Shop API',
      version: '2.0.0',
      description: 'Full API documentation for the EFOY GEBYA E-commerce platform — includes public Home/Shop APIs, Auth, Cart, Orders, and Admin endpoints.',
    },
    servers: [
      {
        url: 'https://ecommerce-backend-1-87dk.onrender.com',
        description: 'Production server (Use this for frontend integration)',
      },
      {
        url: 'http://localhost:5000',
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    // Security is set per-endpoint. Public routes declare security: [] to override this.
    security: [],
  },
  // Scanning both the routes and the global schema definitions
  apis: [
    './src/swagger/schemas.js', 
    './src/routes/*.js', 
    './server.js'
  ], 
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
