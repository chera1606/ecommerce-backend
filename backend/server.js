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
app.use('/api/auth', authRoutes);

// Error Middleware
const { notFound, errorHandler } = require('./src/middleware/errorMiddleware');
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
