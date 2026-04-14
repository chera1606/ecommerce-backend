const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EFOY GEBYA Admin API',
      version: '1.5.0',
      description: 'Comprehensive administrative API documentation for the EFOY GEBYA E-commerce platform.',
    },
    servers: [
      {
        url: 'https://ecommerce-backend-1-87dk.onrender.com',
        description: 'Production server',
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
    security: [
      {
        bearerAuth: [],
      },
    ],
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
