import OtpLog from '../models/OtpLog.js';

export async function monthlyStats(apiUserId, year, month){
  const start = new Date(year, month-1, 1);
  const end = new Date(year, month, 1);
  const pipeline = [
    { $match: { apiUser: apiUserId, createdAt: { $gte: start, $lt: end } } },
    { $group: { _id: null, count: { $sum: 1 }, cost: { $sum: '$cost' } } }
  ];
    const [agg] = await OtpLog.aggregate(pipeline);
  return { count: agg?.count || 0, cost: agg?.cost || 0 };
}
