// pages/api/redemption.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        try {
            // Connect to MongoDB
            const { db } = await connectToDatabase();

            const { staff_pass_id } = req.body;

            // Look up the representative's staff_pass_id against the staff collection to obtain their team_name
            const staffInfo = await db.collection('staff').findOne({ staff_pass_id });
            if (!staffInfo) {
                return res.status(400).json({ error: 'Invalid staff pass ID' });
            }

            const { team_name } = staffInfo;

            // Check if the team_name exists in the redeemed collection
            const existingRedemption = await db.collection('redeemed').findOne({ team_name });
            if (existingRedemption) {
                return res.status(400).json({ error: `${team_name} team has already redeemed the gift` });
            }

            // Add a new record to the redeemed collection
            await db.collection('redeemed').insertOne({
                staff_pass_id,
                team_name,
                redeemed_at: new Date()
            });

            res.status(200).json({ message: 'Redemption successful', team_name });
        } catch (error) {
            console.error('Error redeeming gift:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    } else {
        res.status(405).json({ error: 'Method Not Allowed' });
    }
}
