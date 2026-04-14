const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');

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
    if (role) matchQuery.role = role;
    if (status) matchQuery.status = status;

    if (search) {
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
                            _id: 0,
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
        privilegedUsers: 0, 
        activeNow: 0, 
        newToday: 0 
    };
    const data = results[0].data || [];

    res.json({
        success: true,
        stats: {
            totalUsers: stats.totalUsers,
            privilegedUsers: stats.privilegedUsers,
            activeNow: stats.activeNow,
            newToday: stats.newToday
        },
        data
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
 * @desc    Update user role (Toggle REGULAR/PRIVILEGED/ADMIN)
 * @route   PATCH /api/admin/users/:id/role
 * @access  Private/Admin
 */
const updateUserRole = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: "Invalid User ID format" });
    }
    const userId = req.params.id;
    const { role } = req.body;

    if (!['REGULAR', 'PRIVILEGED', 'ADMIN'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role selection.' });
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

    user.role = role;
    await user.save();

    res.json({
        success: true,
        message: `User role successfully elevated/changed to ${role}`,
        data: {
            role: user.role
        }
    });
});

module.exports = {
    getUsers,
    updateUserStatus,
    updateUserRole
};
