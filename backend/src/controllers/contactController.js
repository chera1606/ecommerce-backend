const ContactMessage = require('../models/ContactMessage');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Send a contact message
// @route   POST /api/contact
const sendContactMessage = asyncHandler(async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({
            success: false,
            message: 'Please provide name, email and message'
        });
    }

    const newMessage = await ContactMessage.create({
        name,
        email,
        message
    });

    res.status(201).json({
        success: true,
        message: 'Message sent successfully. We will get back to you soon!',
        data: newMessage
    });
});

// @desc    Get all contact messages (Admin)
// @route   GET /api/admin/messages
const getContactMessages = asyncHandler(async (req, res) => {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: messages.length,
        data: messages
    });
});

// @desc    Update message status (Admin)
// @route   PATCH /api/admin/messages/:id/status
const updateMessageStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const message = await ContactMessage.findById(req.params.id);

    if (!message) {
        return res.status(404).json({
            success: false,
            message: 'Message not found'
        });
    }

    message.status = status;
    await message.save();

    res.status(200).json({
        success: true,
        data: message
    });
});

// @desc    Delete a contact message (Admin)
// @route   DELETE /api/admin/messages/:id
const deleteContactMessage = asyncHandler(async (req, res) => {
    const message = await ContactMessage.findById(req.params.id);

    if (!message) {
        return res.status(404).json({
            success: false,
            message: 'Message not found'
        });
    }

    await message.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Message deleted successfully'
    });
});

module.exports = {
    sendContactMessage,
    getContactMessages,
    updateMessageStatus,
    deleteContactMessage
};
