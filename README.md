# Efoy Gabeya - Backend API 🚀

Welcome to the backend engine powering **Efoy Gabeya**, a high-performance e-commerce platform built for scale, security, and a seamless developer experience. 

This repository contains the robust Node.js/Express architecture that handles everything from secure user authentication to complex inventory management and order processing.

---

## 🛠️ Tech Stack

*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** MongoDB with Mongoose ODM
*   **Authentication:** JWT (JSON Web Tokens) with HTTP-only cookies
*   **Media Storage:** Cloudinary (via Multer)
*   **Documentation:** Swagger / OpenAPI

## ✨ Key Features

1.  **Role-Based Access Control (RBAC):** Strict security layers separating `REGULAR` users, `PRIVILEGED` admins, `ADMIN` operators, and `SUPER_ADMIN` controllers.
2.  **Robust Product Engine:** 
    *   Dynamic inventory tracking.
    *   Zero-trust rating system (automatically calculated from user reviews to prevent administrative tampering).
    *   Intelligent query filtering (excluding broken images automatically).
3.  **Guest & Authenticated Carts:** Intelligent APIs that support both authenticated users and ephemeral guest carts.
4.  **Order Lifecycle Management:** Secure, strict state-machine transitions for orders (Pending &rarr; Shipped &rarr; Delivered) with real-time push notifications.
5.  **Analytics Dashboard:** Real-time data aggregation delivering metrics on revenue, category performance, and inventory velocity.

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v16+) and [MongoDB](https://www.mongodb.com/) installed on your machine.

### 2. Installation
Clone the repository and install the dependencies:
```bash
git clone https://github.com/chera1606/ecommerce-backend.git
cd ecommerce-backend/backend
npm install
```

### 3. Environment Variables
Create a `.env` file in the root of the `backend` folder and configure the following parameters:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Cloudinary Setup
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Database Seeding (Optional)
If you want to start with a fresh set of dummy products and categories:
```bash
npm run seed
```
To generate the initial Super Admin account:
```bash
npm run seed:admin
```

### 5. Start the Server
```bash
npm run dev
```
*The server will spin up on `http://localhost:5000`.*

## 📚 API Documentation
Once the server is running locally, you can view the fully interactive Swagger API documentation by navigating to:
👉 `http://localhost:5000/api-docs` or
 - `https://ecommerce-backend-1-87dk.onrender.com/api-docs`

---

## ☁️ Deployment

This backend is optimized for cloud deployment. It is currently configured to run smoothly on **Render**. 
*   Ensure that the `FRONTEND_URL` environment variable is strictly set to your production frontend domain to satisfy CORS policies.
*   Secure HTTP-only cookies require `NODE_ENV=production` to enforce the `secure: true` flag.

---
*Built with ❤️ for Efoy Gabeya.*
