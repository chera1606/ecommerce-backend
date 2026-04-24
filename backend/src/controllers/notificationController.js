const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');

/**
 * @desc    Get all notifications for logged in user
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(50); // Get last 50 notifications

    const unreadCount = await Notification.countDocuments({ 
        userId: req.user._id, 
        isRead: false 
    });

    res.status(200).json({
        success: true,
        count: notifications.length,
        unreadCount,
        data: notifications
    });
});

/**
 * @desc    Mark a notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
const markAsRead = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: 'Invalid notification ID' });
    }

    const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { isRead: true },
        { new: true }
    );

    if (!notification) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({
        success: true,
        data: notification
    });
});

/**
 * @desc    Mark all user notifications as read
 * @route   PATCH /api/notifications/read-all
 * @access  Private
 */
const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { userId: req.user._id, isRead: false },
        { isRead: true }
    );

    res.status(200).json({
        success: true,
        message: 'All notifications marked as read'
    });
});

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
const deleteNotification = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: 'Invalid notification ID' });
    }

    const notification = await Notification.findOneAndDelete({ 
        _id: req.params.id, 
        userId: req.user._id 
    });

    if (!notification) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({
        success: true,
        message: 'Notification removed'
    });
});

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
};
