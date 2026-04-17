const express = require('express');
const router = express.Router();
const { 
    getUserProfile,
    updateUserProfile,
    updateUserProfilePhoto,
    updateUserPassword,
    addAddress,
    updateAddress,
    deleteAddress
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// ALL routes below require login
router.use(protect); 

/**
 * @openapi
 * /api/users/profile:
 *   get:
 *     tags: [User Profile]
 *     summary: Get logged in user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *   put:
 *     tags: [User Profile]
 *     summary: Update user profile
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
 *               profilePicture: { type: string }
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.route('/profile')
    .get(getUserProfile)
    .put(updateUserProfile);

/**
 * @openapi
 * /api/users/profile/photo:
 *   patch:
 *     tags: [User Profile]
 *     summary: Update profile photo
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
 * /api/users/password:
 *   put:
 *     tags: [User Profile]
 *     summary: Change password
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
router.put('/password', updateUserPassword);

/**
 * @openapi
 * /api/users/profile/photo:
 *   patch:
 *     tags: [User Profile]
 *     summary: Update profile photo
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
 *         description: Photo updated
 */
router.patch('/profile/photo', upload.single('image'), updateUserProfilePhoto);

/**
 * @openapi
 * /api/users/addresses:
 *   post:
 *     tags: [User Profile]
 *     summary: Add new saved address
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [contactName, phone, country, address]
 *             properties:
 *               contactName: { type: string }
 *               phone: { type: string }
 *               country: { type: string }
 *               address: { type: string }
 *               isDefault: { type: boolean }
 *     responses:
 *       200:
 *         description: Address added
 */
router.post('/addresses', addAddress);

/**
 * @openapi
 * /api/users/addresses/{id}:
 *   put:
 *     tags: [User Profile]
 *     summary: Update an address
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contactName: { type: string }
 *               phone: { type: string }
 *               country: { type: string }
 *               address: { type: string }
 *               isDefault: { type: boolean }
 *     responses:
 *       200:
 *         description: Address updated
 *   delete:
 *     tags: [User Profile]
 *     summary: Delete an address
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Address deleted
 */
router.route('/addresses/:id')
    .put(updateAddress)
    .delete(deleteAddress);

module.exports = router;
