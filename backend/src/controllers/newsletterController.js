const Newsletter = require('../models/Newsletter');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Subscribe to newsletter
// @route   POST /api/newsletter/subscribe
const subscribeNewsletter = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'Email is required'
        });
    }

    const existingSubscription = await Newsletter.findOne({ email });

    if (existingSubscription) {
        return res.status(400).json({
            success: false,
            message: 'Email already subscribed'
        });
    }

    await Newsletter.create({ email });

    res.status(201).json({
        success: true,
        message: 'Subscribed successfully'
    });
});

module.exports = {
    subscribeNewsletter
};
