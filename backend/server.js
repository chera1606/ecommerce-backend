const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

// Load env vars
dotenv.config();

// Connect to Database
const connectDB = require('./src/config/db');
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Allows the server to accept application/json
app.use(express.urlencoded({ extended: true })); // Allows the server to accept application/x-www-form-urlencoded

// Basic Route
app.get("/", (req, res) => {
  res.send("E-Shop API is running...");
});

// Authentication Routes
const authRoutes = require('./src/routes/authRoutes');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');

// Swagger UI Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authRoutes);

// Admin Routes
const adminRoutes = require('./src/routes/adminRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const userRoutes = require('./src/routes/userRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');
const productRoutes = require('./src/routes/productRoutes');

app.use('/api/admin', adminRoutes);
app.use('/api/admin/orders', orderRoutes);
app.use('/api/admin/users', userRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/admin/products', productRoutes);

// Error Middleware
const { notFound, errorHandler } = require('./src/middleware/errorMiddleware');
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
