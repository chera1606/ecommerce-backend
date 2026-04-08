const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

// Load env vars
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Allows the server to accept JSON

// Basic Route
app.get("/", (req, res) => {
  res.send("E-Shop API is running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
