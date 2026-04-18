const express = require('express');
const router = express.Router();
const { 
    getUserProfile,
    updateUserProfile,
    updateUserProfilePhoto,
    updateUserPassword
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { adminAuth } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

// ALL routes below require login and admin role
router.use(protect, adminAuth); 

/**
 * @openapi
 * /api/admin/profile:
 *   get:
 *     tags: [Admin Profile]
 *     summary: Get logged in admin profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin profile data
 *   put:
 *     tags: [Admin Profile]
 *     summary: Update admin profile
 *     description: Supports updating name and profile picture. Accepts photoUrl as a string (Base64) or profilePicture.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               photoUrl: { type: string, description: 'Profile picture URL or Base64 string' }
 *     responses:
 *       200:
 *         description: Profile updated successfully. Returns updated user object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.route('/profile')
    .get(getUserProfile)
    .put(updateUserProfile);

/**
 * @openapi
 * /api/admin/profile/photo:
 *   patch:
 *     tags: [Admin Profile]
 *     summary: Update admin profile photo
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Photo updated successfully
 */
router.patch('/profile/photo', upload.single('image'), updateUserProfilePhoto);

/**
 * @openapi
 * /api/admin/profile/password:
 *   put:
 *     tags: [Admin Profile]
 *     summary: Change admin password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200:
 *         description: Password successfully changed
 */
router.put('/profile/password', updateUserPassword);

module.exports = router;
