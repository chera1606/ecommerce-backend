const User = require('../models/User');
const Product = require('../models/Product');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');
const { uploadBuffer } = require('../utils/cloudinaryHelper');

const PASSWORD_MIN_LENGTH = 8;
const UPDATABLE_USER_ROLES = ['REGULAR', 'PRIVILEGED', 'ADMIN', 'SUPER_ADMIN'];
const ADMIN_RESTRICTED_TARGET_ROLES = ['ADMIN', 'SUPER_ADMIN'];
const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';

const normalizeRole = (role) => String(role || '').toUpperCase();

const formatUserResponse = (userDoc) => {
    const userData = userDoc.toObject();
    userData.joinedAt = userDoc.createdAt ? new Date(userDoc.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }) : 'N/A';

    return userData;
};

/**
 * @desc    Get all users with stats and paginated data
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
const getUsers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const { role, status } = req.query;

    // Start of the day for newToday stat
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Dynamic match for filtering and search
    const matchQuery = {};
    if (role && role.toUpperCase() !== 'ALL' && role !== 'undefined' && role !== 'null') {
        matchQuery.role = role.toUpperCase();
    }
    if (status && status.toUpperCase() !== 'ALL' && status !== 'undefined' && status !== 'null') {
        matchQuery.status = status.toUpperCase();
    }

    if (search && search !== 'undefined' && search !== 'null') {
        const searchRegex = new RegExp(search, 'i');
        const searchOr = [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { email: searchRegex }
        ];

        // Handle guestId search (#GB-XXXX)
        if (search.toUpperCase().startsWith('#GB-')) {
            const idSuffix = search.slice(4).toUpperCase();
            if (idSuffix.length > 0) {
                searchOr.push({ "guestId": { $regex: idSuffix + '$', $options: 'i' } });
            }
        }

        matchQuery.$or = searchOr;
    }

    const pipeline = [
        // 1. Add fields for search and formatting
        {
            $addFields: {
                fullName: { $concat: ['$firstName', ' ', '$lastName'] },
                guestId: { 
                    $concat: [
                        '#GB-', 
                        { $toUpper: { $substrCP: [{ $toString: '$_id' }, 20, 4] } } 
                    ] 
                },
                joined: { 
                    $dateToString: { 
                        format: "%b %d, %Y", 
                        date: "$createdAt" 
                    } 
                }
            }
        },

        // 2. Apply filtering and search
        { $match: matchQuery },

        // 3. Facet for stats and data
        {
            $facet: {
                stats: [
                    {
                        $group: {
                            _id: null,
                            totalUsers: { $sum: 1 },
                            adminUsers: {
                                $sum: { $cond: [{ $eq: ['$role', 'ADMIN'] }, 1, 0] }
                            },
                            superAdminUsers: {
                                $sum: { $cond: [{ $eq: ['$role', 'SUPER_ADMIN'] }, 1, 0] }
                            },
                            privilegedUsers: { 
                                $sum: { $cond: [{ $eq: ['$role', 'PRIVILEGED'] }, 1, 0] } 
                            },
                            activeNow: { 
                                $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] } 
                            },
                            newToday: { 
                                $sum: { $cond: [{ $gte: ['$createdAt', startOfToday] }, 1, 0] } 
                            }
                        }
                    }
                ],
                data: [
                    { $sort: { createdAt: -1 } },
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $project: {
                            _id: 1,
                            guestId: 1,
                            fullName: 1,
                            email: 1,
                            joined: 1,
                            role: 1,
                            status: 1
                        }
                    }
                ],
                totalCount: [
                    { $count: 'count' }
                ]
            }
        }
    ];

    const results = await User.aggregate(pipeline);
    
    // Handle empty state explicitly
    const stats = results[0].stats[0] || { 
        totalUsers: 0, 
        adminUsers: 0,
        superAdminUsers: 0,
        privilegedUsers: 0, 
        activeNow: 0, 
        newToday: 0 
    };
    const data = results[0].data || [];
    const totalCount = results[0].totalCount[0] ? results[0].totalCount[0].count : 0;

    res.json({
        success: true,
        stats: {
            totalUsers: stats.totalUsers,
            adminUsers: stats.adminUsers,
            superAdminUsers: stats.superAdminUsers,
            privilegedUsers: stats.privilegedUsers,
            activeNow: stats.activeNow,
            newToday: stats.newToday
        },
        data: data,
        users: data,
        total: totalCount,
        page,
        pages: Math.ceil(totalCount / limit)
    });
});

/**
 * @desc    Update user status (Toggle ACTIVE/SUSPENDED)
 * @route   PATCH /api/admin/users/:id/status
 * @access  Private/Admin
 */
const updateUserStatus = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: "Invalid User ID format" });
    }
    const userId = req.params.id;
    const { status } = req.body;

    if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status. Use ACTIVE or SUSPENDED.' });
    }

    // Strict self-modification block
    if (req.user._id.toString() === userId) {
        return res.status(400).json({ 
            success: false, 
            message: 'Critical Error: Administrators cannot modify their own status to prevent lockouts.' 
        });
    }

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    const actorRole = normalizeRole(req.user?.role);
    const targetRole = normalizeRole(user.role);

    // Admins can only moderate REGULAR/PRIVILEGED users.
    if (actorRole !== SUPER_ADMIN_ROLE && ADMIN_RESTRICTED_TARGET_ROLES.includes(targetRole)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only super admins can change admin-level account status.'
        });
    }

    // Safety guard: never suspend the last active super admin.
    if (targetRole === SUPER_ADMIN_ROLE && status === 'SUSPENDED' && user.status === 'ACTIVE') {
        const activeSuperAdmins = await User.countDocuments({ role: SUPER_ADMIN_ROLE, status: 'ACTIVE' });
        if (activeSuperAdmins <= 1) {
            return res.status(400).json({
                success: false,
                message: 'Cannot suspend the last active super admin account.'
            });
        }
    }

    user.status = status;
    await user.save();

    res.json({
        success: true,
        message: `User status successfully updated to ${status}`,
        data: {
            status: user.status
        }
    });
});

/**
 * @desc    Update user role (Toggle REGULAR/PRIVILEGED/ADMIN/SUPER_ADMIN)
 * @route   PATCH /api/admin/users/:id/role
 * @access  Private/Super Admin
 */
const updateUserRole = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: "Invalid User ID format" });
    }
    const userId = req.params.id;
    const { role } = req.body;

    const requestedRole = normalizeRole(role);

    if (!UPDATABLE_USER_ROLES.includes(requestedRole)) {
        return res.status(400).json({ success: false, message: 'Invalid role selection.' });
    }

    if (normalizeRole(req.user?.role) !== SUPER_ADMIN_ROLE) {
        return res.status(403).json({
            success: false,
            message: 'Only a super admin can modify user roles.'
        });
    }

    // Strict self-modification block
    if (req.user._id.toString() === userId) {
        return res.status(400).json({ 
            success: false, 
            message: 'Critical Error: Administrators cannot modify their own role.' 
        });
    }

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentRole = normalizeRole(user.role);

    // Safety guard: do not allow removing the final super admin.
    if (currentRole === SUPER_ADMIN_ROLE && requestedRole !== SUPER_ADMIN_ROLE) {
        const superAdminCount = await User.countDocuments({ role: SUPER_ADMIN_ROLE });
        if (superAdminCount <= 1) {
            return res.status(400).json({
                success: false,
                message: 'Cannot demote the last super admin account.'
            });
        }
    }

    user.role = requestedRole;
    await user.save();

    res.json({
        success: true,
        message: `User role successfully elevated/changed to ${requestedRole}`,
        data: {
            role: user.role
        }
    });
});

// ════════════════════════════════════════════════════════════════════════════
// NEW: STANDARD USER PROFILE METHODS (Private)
// ════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Get logged in user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: formatUserResponse(user) });
});

/**
 * @desc    Update user profile details
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.firstName = req.body.firstName || user.firstName;
        user.lastName = req.body.lastName || user.lastName;
        
        // Map photoUrl from frontend to profilePicture
        if (req.body.photoUrl !== undefined) {
             user.profilePicture = req.body.photoUrl;
        } else if (req.body.profilePicture !== undefined) {
             user.profilePicture = req.body.profilePicture;
        }

        const updatedUser = await user.save();
        const responseData = formatUserResponse(updatedUser);
        
        res.json({
            success: true,
            data: responseData,
            user: responseData // Alias for frontend
        });
    } else {
        res.status(404).json({ success: false, message: 'User not found' });
    }
});

/**
 * @desc    Update password manually
 * @route   PUT /api/users/password
 * @access  Private
 */
const updateUserPassword = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
        return res.status(400).json({ success: false, message: 'Current password and new password are required' });
    }
    if (newPassword.length < PASSWORD_MIN_LENGTH) {
        return res.status(400).json({
            success: false,
            message: `New password must be at least ${PASSWORD_MIN_LENGTH} characters long`
        });
    }
    if (typeof confirmPassword === 'string' && confirmPassword !== newPassword) {
        return res.status(400).json({ success: false, message: 'New password and confirmation do not match' });
    }
    if (currentPassword === newPassword) {
        return res.status(400).json({ success: false, message: 'New password must be different from current password' });
    }
    
    // Check old password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
       return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    user.password = newPassword;
    await user.save();
    
    res.json({ success: true, message: 'Password updated successfully' });
});

/**
 * @desc    Update profile photo
 * @route   PATCH /api/users/profile/photo
 * @access  Private
 */
const updateUserProfilePhoto = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    try {
        let photoUrl;
        if (req.file) {
            const folder = ['ADMIN', 'SUPER_ADMIN'].includes(String(req.user?.role || '').toUpperCase())
                ? 'profiles/admin'
                : 'profiles/users';
            photoUrl = await uploadBuffer(req.file.buffer, folder);
        } else if (req.body.photoUrl || req.body.image) {
            // Handle base64 or string URL from body
            photoUrl = req.body.photoUrl || req.body.image;
        } else {
            return res.status(400).json({ success: false, message: 'No image provided' });
        }

        user.profilePicture = photoUrl;
        const updatedUser = await user.save();
        const responseData = formatUserResponse(updatedUser);

        res.json({
            success: true,
            message: 'Profile photo updated successfully',
            data: {
                profilePicture: photoUrl,
                user: responseData
            },
            user: responseData // Alias for frontend
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Cloudinary upload failed', error: error.message });
    }
});

// ════════════════════════════════════════════════════════════════════════════
// NEW: USER ADDRESS MANAGEMENT
// ════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Add a new saved address
 * @route   POST /api/users/addresses
 * @access  Private
 */
const addAddress = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const { contactName, phone, country, address, isDefault } = req.body;

    if (isDefault) {
        // Reset all others to false
        user.addresses.forEach(a => a.isDefault = false);
    }

    user.addresses.push({ contactName, phone, country, address, isDefault });
    await user.save();

    res.json({ success: true, data: user.addresses });
});

/**
 * @desc    Update a saved address
 * @route   PUT /api/users/addresses/:id
 * @access  Private
 */
const updateAddress = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const addressToFix = user.addresses.id(req.params.id);

    if (!addressToFix) {
        return res.status(404).json({ success: false, message: 'Address not found' });
    }

    addressToFix.contactName = req.body.contactName || addressToFix.contactName;
    addressToFix.phone = req.body.phone || addressToFix.phone;
    addressToFix.country = req.body.country || addressToFix.country;
    addressToFix.address = req.body.address || addressToFix.address;
    
    if (req.body.isDefault) {
        user.addresses.forEach(a => {
           if (a._id.toString() !== req.params.id) a.isDefault = false;
        });
        addressToFix.isDefault = true;
    }

    await user.save();
    res.json({ success: true, data: user.addresses });
});

/**
 * @desc    Delete a saved address
 * @route   DELETE /api/users/addresses/:id
 * @access  Private
 */
const deleteAddress = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    user.addresses.pull({ _id: req.params.id }); 
    await user.save();
    res.json({ success: true, data: user.addresses });
});

module.exports = {
    getUsers,
    updateUserStatus,
    updateUserRole,
    // Standard User Endpoints
    getUserProfile,
    updateUserProfile,
    updateUserProfilePhoto,
    updateUserPassword,
    addAddress,
    updateAddress,
    deleteAddress
};
