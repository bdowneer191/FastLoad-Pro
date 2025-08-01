import { put, list, del } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Session } from '../types';

const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { method } = req;
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ message: 'User ID is required.' });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return res.status(500).json({ message: 'Storage token is not configured.' });
    }
    
    const userSessionPath = `sessions/${userId}/`;

    try {
        if (method === 'GET') {
            const { blobs } = await list({ prefix: userSessionPath, token: process.env.BLOB_READ_WRITE_TOKEN });
            
            const sessions: Session[] = [];
            const blobsToDelete: string[] = [];
            let hasOldLogs = false;

            for (const blob of blobs) {
                try {
                    const response = await fetch(blob.url);
                    if (!response.ok) continue;
                    const session = await response.json() as Session;

                    const sessionAge = Date.now() - new Date(session.startTime).getTime();
                    if (sessionAge > THIRTY_DAYS_IN_MS) {
                        blobsToDelete.push(blob.url);
                        hasOldLogs = true;
                        continue;
                    }
                    sessions.push(session);
                } catch (e) {
                    console.error(`Failed to parse session data for blob ${blob.pathname}, scheduling for deletion.`, e);
                    blobsToDelete.push(blob.url);
                }
            }

            if (blobsToDelete.length > 0) {
                console.log(`Deleting ${blobsToDelete.length} old or invalid session logs for user ${userId}.`);
                await del(blobsToDelete, { token: process.env.BLOB_READ_WRITE_TOKEN });
            }

            const sortedSessions = sessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

            const responsePayload = {
                sessions: sortedSessions,
                notification: hasOldLogs ? `Some of your session logs older than 30 days have been automatically deleted. Please download your logs regularly.` : null
            };

            return res.status(200).json(responsePayload);
        }

        if (method === 'POST') {
            const newSession: Omit<Session, 'id'> = req.body;
            const sessionId = new Date().toISOString();
            const sessionWithId: Session = { ...newSession, id: sessionId };
            
            const blobPath = `${userSessionPath}${sessionId}.json`;

            await put(blobPath, JSON.stringify(sessionWithId), {
                access: 'public',
                addRandomSuffix: false,
                token: process.env.BLOB_READ_WRITE_TOKEN,
            });

            return res.status(200).json(sessionWithId);
        }
        
        if (method === 'DELETE') {
            const { blobs } = await list({ prefix: userSessionPath, token: process.env.BLOB_READ_WRITE_TOKEN });
            if (blobs.length > 0) {
                await del(blobs.map(b => b.url), { token: process.env.BLOB_READ_WRITE_TOKEN });
            }
            return res.status(200).json({ success: true, message: 'History cleared.' });
        }

        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).end(`Method ${method} Not Allowed`);

    } catch (error: any) {
        console.error(`Error in /api/sessions for user ${userId}:`, error);
        return res.status(500).json({ message: 'An internal server error occurred.', error: error.message });
    }
}
