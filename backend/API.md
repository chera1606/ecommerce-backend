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
    "id": "65f8a...",
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
