require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const pipeline = [
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
            { $match: {} },
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
                        { $skip: 0 },
                        { $limit: 10 },
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
        console.log('Results:', JSON.stringify(results, null, 2));

    } catch (err) {
        console.error('Error running pipeline:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

run();
