import { put, list, del } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Session } from '../types';


export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { method } = req;
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ message: 'User ID is required.' });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return res.status(500).json({ message: 'Storage token is not configured.' });
    }
    
    const blobPath = `sessions/${userId}.json`;

    try {
        if (method === 'GET') {
            const { blobs } = await list({ prefix: blobPath, limit: 1, token: process.env.BLOB_READ_WRITE_TOKEN });
            if (blobs.length === 0) {
                return res.status(200).json([]);
            }
            
            try {
                const response = await fetch(blobs[0].url);
                if (!response.ok) throw new Error(`Fetch failed with status ${response.status}`);
                if (response.headers.get('content-length') === '0') {
                     return res.status(200).json([]);
                }
                const data = await response.json();
                return res.status(200).json(data);
            } catch (e) {
                console.error(`Failed to read or parse session data for user ${userId}:`, e);
                return res.status(200).json([]);
            }
        }

        if (method === 'POST') {
            const newSession: Omit<Session, 'id'> = req.body;
            
            let sessions: Session[] = [];
            const { blobs } = await list({ prefix: blobPath, limit: 1, token: process.env.BLOB_READ_WRITE_TOKEN });
            if (blobs.length > 0) {
                try {
                    const response = await fetch(blobs[0].url);
                    if (response.ok && response.headers.get('content-length') !== '0') {
                       const existingData = await response.json();
                       if (Array.isArray(existingData)) {
                          sessions = existingData;
                       }
                    }
                } catch (e) { 
                    console.error("Could not parse existing session data, starting new log.", e);
                }
            }
            
            const sessionWithId: Session = { ...newSession, id: new Date().toISOString() };
            const updatedSessions = [sessionWithId, ...sessions]
                .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

            await put(blobPath, JSON.stringify(updatedSessions), {
                access: 'public',
                addRandomSuffix: false,
                token: process.env.BLOB_READ_WRITE_TOKEN,
            });

            return res.status(200).json(sessionWithId);
        }
        
        if (method === 'DELETE') {
            const { blobs } = await list({ prefix: blobPath, limit: 1, token: process.env.BLOB_READ_WRITE_TOKEN });
            if(blobs.length > 0) {
               await del(blobs[0].url, { token: process.env.BLOB_READ_WRITE_TOKEN });
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