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

// @desc    Get all subscribers (Admin)
// @route   GET /api/admin/newsletter
const getSubscribers = asyncHandler(async (req, res) => {
    const subscribers = await Newsletter.find().sort({ subscribedAt: -1 });

    res.status(200).json({
        success: true,
        count: subscribers.length,
        data: subscribers
    });
});

// @desc    Delete a subscriber (Admin)
// @route   DELETE /api/admin/newsletter/:id
const deleteSubscriber = asyncHandler(async (req, res) => {
    const subscriber = await Newsletter.findById(req.params.id);

    if (!subscriber) {
        return res.status(404).json({
            success: false,
            message: 'Subscriber not found'
        });
    }

    await subscriber.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Subscriber removed'
    });
});

module.exports = {
    subscribeNewsletter,
    getSubscribers,
    deleteSubscriber
};
