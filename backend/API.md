# E-Shop Backend API Documentation

Welcome to the E-Shop Backend API documentation. This document provides details for all existing endpoints as of the current version.

**Base URL:** `https://ecommerce-backend-1-87dk.onrender.com`

---

## 🔐 Authentication Endpoints

### 1. Register User
Create a new user account.

- **URL:** `/api/auth/register`
- **Method:** `POST`
- **Access:** Public

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "Password123!",
  "confirmPassword": "Password123!"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Registration successful. You can now login."
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "User already exists"
}
```

---

### 2. Login User
Authenticate and receive Access and Refresh tokens.

- **URL:** `/api/auth/login`
- **Method:** `POST`
- **Access:** Public

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "Password123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "email": "john.doe@example.com",
    "role": "user",
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

### 3. Refresh Token
Obtain a new Access Token using a valid Refresh Token.

- **URL:** `/api/auth/refresh-token`
- **Method:** `POST`
- **Access:** Public

**Request Body:**
```json
{
  "token": "eyJhbG... (RefreshToken)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbG... (New AccessToken)"
  }
}
```

---

### 4. Forgot Password
Request a 6-digit OTP to reset your password.

- **URL:** `/api/auth/forgot-password`
- **Method:** `POST`
- **Access:** Public

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset OTP sent to your email"
}
```

---

### 5. Reset Password
Reset your password using the OTP received via email.

- **URL:** `/api/auth/reset-password`
- **Method:** `POST`
- **Access:** Public

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "otp": "123456",
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successful. You can now login."
}
```

---

### 6. Logout
Invalidate the current session and clear the refresh token.

- **URL:** `/api/auth/logout`
- **Method:** `POST`
- **Access:** Private (Requires Authorization Header)

**Headers:**
`Authorization: Bearer <accessToken>`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 🛡️ Admin Dashboard Endpoints

All endpoints below require a valid JWT Access Token and an `admin` role.

**Headers:**
`Authorization: Bearer <accessToken>`

---

### 1. Overview & Generic Admin

#### Dashboard Overview
- **URL:** `/api/admin/overview`
- **Method:** `GET`

#### Products Dashboard Stream
- **URL:** `/api/admin/products/stream`
- **Method:** `GET`

#### Recent Orders
- **URL:** `/api/admin/orders/recent`
- **Method:** `GET`

#### Order Details
- **URL:** `/api/admin/orders/:id`
- **Method:** `GET`

---

### 2. Products

#### Get Products
- **URL:** `/api/admin/products`
- **Method:** `GET`

#### Create Product
- **URL:** `/api/admin/products`
- **Method:** `POST`
- **Content-Type:** `multipart/form-data` (requires `image` file upload)

#### Update Product
- **URL:** `/api/admin/products/:id`
- **Method:** `PUT`
- **Content-Type:** `multipart/form-data` (supports `image` file upload)

#### Delete Product
- **URL:** `/api/admin/products/:id`
- **Method:** `DELETE`

---

### 3. Orders

#### Get Orders (Transaction Log)
- **URL:** `/api/admin/orders`
- **Method:** `GET`
- **Query Params:**
  - `page` (optional, default: 1)
  - `limit` (optional, default: 10)
  - `search` (optional, matches user name or formatted orderId)

**Success Response (200):**
```json
{
  "success": true,
  "stats": {
    "activeShipments": 10,
    "urgentOrders": 5
  },
  "data": [
    {
      "orderId": "QB-2B9F",
      "guest": "John Doe",
      "product": "Smartphone",
      "total": 999.99,
      "date": "2026-04-14T12:00:00Z",
      "status": "PENDING",
      "priority": false
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

#### Update Order Status
Strict transition rules: `PENDING` &rarr; `SHIPPED` &rarr; `DELIVERED`. Backward transitions or skipping states are rejected.

- **URL:** `/api/admin/orders/:id/status`
- **Method:** `PATCH`

**Request Body:**
```json
{
  "status": "SHIPPED"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "status": "SHIPPED"
  }
}
```

---

### 4. Guests (Users)

#### Get Users
- **URL:** `/api/admin/users`
- **Method:** `GET`
- **Query Params:**
  - `page` (optional, default: 1)
  - `limit` (optional, default: 10)
  - `search` (optional, matches name, email, or guestId)
  - `role` (optional, `REGULAR` or `PRIVILEGED`)
  - `status` (optional, `ACTIVE` or `SUSPENDED`)

**Success Response (200):**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 120,
    "privilegedUsers": 12,
    "activeNow": 115,
    "newToday": 3
  },
  "data": [
    {
      "guestId": "#GB-2B9F",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "joined": "Apr 14, 2026",
      "role": "REGULAR",
      "status": "ACTIVE"
    }
  ]
}
```

#### Update User Status
Administrators cannot suspend their own accounts.

- **URL:** `/api/admin/users/:id/status`
- **Method:** `PATCH`

**Request Body:**
```json
{
  "status": "SUSPENDED"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User status updated to SUSPENDED",
  "data": {
    "status": "SUSPENDED"
  }
}
```

#### Update User Role
Administrators cannot change their own roles or assign `ADMIN` role.

- **URL:** `/api/admin/users/:id/role`
- **Method:** `PATCH`

**Request Body:**
```json
{
  "role": "PRIVILEGED"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User role updated to PRIVILEGED",
  "data": {
    "role": "PRIVILEGED"
  }
}
```

---

### 5. Analytics

#### Performance Dashboard
Aggregated analytics calculated purely from real database values (no mocks). Orders revenue calculation based solely on `DELIVERED` status.

- **URL:** `/api/admin/analytics/performance`
- **Method:** `GET`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "revenue": {
      "total": 9250.50,
      "currency": "USD",
      "growthRate": 12.45
    },
    "topCategories": [
      {
        "name": "ELECTRONICS",
        "percentage": 85
      },
      {
        "name": "FOOTWEAR",
        "percentage": 15
      }
    ],
    "assetVelocity": [
      {
        "productName": "Ergotech Keyboard",
        "inventoryChurnDays": 5,
        "statusColor": "red"
      }
    ],
    "inventory": {
      "totalValue": 140000.00,
      "currency": "USD",
      "systemLoad": "Nominal"
    },
    "products": [
      {
        "id": "#QB-0000",
        "name": "Ergotech Keyboard",
        "color": "Black",
        "stock": 4,
        "price": 100,
        "thumbnail": "https://example.com/image.jpg",
        "isLowStock": true
      }
    ]
  }
}
```
