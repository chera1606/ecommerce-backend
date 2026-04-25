const Notification = require('../models/Notification');
const User = require('../models/User');

const formatOrderCode = (orderId) => `QB-${orderId.toString().slice(-6).toUpperCase()}`;

const createNotification = async ({ userId, title, message, type = 'SYSTEM', link = '' }) => {
    if (!userId) return null;
    return Notification.create({ userId, title, message, type, link });
};

const notifyAdmins = async ({
    title,
    message,
    type = 'SYSTEM',
    link = '/admin/orders',
    excludeUserId = null
}) => {
    const query = { role: { $in: ['ADMIN', 'SUPER_ADMIN', 'PRIVILEGED'] } };
    if (excludeUserId) {
        query._id = { $ne: excludeUserId };
    }

    const admins = await User.find(query).select('_id');
    if (!admins.length) return [];

    const rows = admins.map((admin) => ({
        userId: admin._id,
        title,
        message,
        type,
        link
    }));

    return Notification.insertMany(rows);
};

const buildUserOrderStatusMessage = ({ orderCode, status }) => {
    const templates = {
        CONFIRMED: {
            title: 'Order Confirmed',
            message: `Your order ${orderCode} is confirmed and now in processing.`
        },
        SHIPPED: {
            title: 'Order Shipped',
            message: `Your order ${orderCode} has been shipped and is on the way.`
        },
        DELIVERED: {
            title: 'Order Delivered',
            message: `Your order ${orderCode} was delivered successfully. Thank you for shopping with us.`
        },
        CANCELLED: {
            title: 'Order Cancelled',
            message: `Your order ${orderCode} has been cancelled. Refund processing starts automatically if payment was captured.`
        }
    };

    if (templates[status]) {
        return templates[status];
    }

    return {
        title: 'Order Updated',
        message: `Your order ${orderCode} status changed to ${status}.`
    };
};

const notifyUserOrderStatusChanged = async ({ order, status }) => {
    const orderCode = formatOrderCode(order._id);
    const payload = buildUserOrderStatusMessage({ orderCode, status });

    return createNotification({
        userId: order.userId,
        title: payload.title,
        message: payload.message,
        type: 'ORDER_UPDATE',
        link: '/profile'
    });
};

const notifyAdminsOrderStatusChanged = async ({ order, status, actorName, actorId }) => {
    const orderCode = formatOrderCode(order._id);

    return notifyAdmins({
        title: 'Admin Updated Order',
        message: `${actorName} changed ${orderCode} to ${status}.`,
        type: 'ADMIN_ACTION',
        link: '/admin/orders',
        excludeUserId: actorId || null
    });
};

const notifyAdminsOrderPlaced = async ({ order, totalPrice, source = 'checkout' }) => {
    const orderCode = formatOrderCode(order._id);
    const channel = source === 'buy-now' ? 'Buy Now' : 'Checkout';

    return notifyAdmins({
        title: 'New Order Placed',
        message: `A customer placed order ${orderCode} (${channel}) for $${Number(totalPrice).toFixed(2)}.`,
        type: 'USER_ACTION',
        link: '/admin/orders'
    });
};

const notifyAdminsOrderCancelledByUser = async ({ order, actorName, actorId }) => {
    const orderCode = formatOrderCode(order._id);
    const customerLabel = actorName || 'A customer';

    return notifyAdmins({
        title: 'Customer Cancelled Order',
        message: `${customerLabel} cancelled order ${orderCode}.`,
        type: 'USER_ACTION',
        link: '/admin/orders',
        excludeUserId: actorId || null
    });
};

const notifyAdminsNewSupportMessage = async ({ name, email }) => {
    return notifyAdmins({
        title: 'New Support Message',
        message: `Customer ${name} (${email}) sent a new contact message.`,
        type: 'USER_ACTION',
        link: '/admin/messages'
    });
};

module.exports = {
    formatOrderCode,
    notifyAdminsOrderPlaced,
    notifyAdminsOrderStatusChanged,
    notifyAdminsOrderCancelledByUser,
    notifyUserOrderStatusChanged,
    notifyAdminsNewSupportMessage
};
