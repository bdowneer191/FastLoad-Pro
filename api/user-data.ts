import { put, list, del } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const emptyUserData = { geminiApiKey: '', pageSpeedApiKey: '' };

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Vercel automatically parses the query string.
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
        console.log('User ID is missing or invalid.');
        return res.status(400).json({ message: 'User ID is required.' });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        console.error('BLOB_READ_WRITE_TOKEN is not configured.');
        return res.status(500).json({ message: 'Storage token is not configured.' });
    }

    const blobPath = `user-data/${userId}.json`;
    console.log(`Processing ${req.method} request for blob path: ${blobPath}`);

    try {
        if (req.method === 'GET') {
            const { blobs } = await list({ prefix: blobPath, limit: 1, token: process.env.BLOB_READ_WRITE_TOKEN });

            if (blobs.length === 0) {
                console.log(`No blob found for user ${userId}, returning empty data.`);
                return res.status(200).json(emptyUserData);
            }

            const blob = await fetch(blobs[0].url);
            if (!blob.ok) {
                 console.error(`Failed to fetch blob from URL ${blobs[0].url}. Status: ${blob.status}`);
                 // If fetching fails, return default data to prevent client-side error.
                 return res.status(200).json(emptyUserData);
            }

            const data = await blob.json();
            console.log(`Successfully fetched data for user ${userId}.`);
            return res.status(200).json(data);
        }

        if (req.method === 'POST') {
            // Vercel automatically parses the JSON body.
            const { geminiApiKey, pageSpeedApiKey } = req.body;

            let existingData = { ...emptyUserData };
            const { blobs } = await list({ prefix: blobPath, limit: 1, token: process.env.BLOB_READ_WRITE_TOKEN });
            if (blobs.length > 0) {
                 const blob = await fetch(blobs[0].url);
                 if (blob.ok) {
                     try {
                        existingData = await blob.json();
                     } catch(e) {
                        console.error('Failed to parse existing blob, will overwrite.');
                     }
                 }
            }

            const updatedData = {
                geminiApiKey: geminiApiKey !== undefined ? geminiApiKey : existingData.geminiApiKey,
                pageSpeedApiKey: pageSpeedApiKey !== undefined ? pageSpeedApiKey : existingData.pageSpeedApiKey,
            };

            await put(blobPath, JSON.stringify(updatedData), {
                access: 'public',
                addRandomSuffix: false,
                token: process.env.BLOB_READ_WRITE_TOKEN,
            });

            console.log(`Successfully saved data for user ${userId}.`);
            return res.status(200).json({ success: true, message: 'API keys saved.' });
        }

        if (req.method === 'DELETE') {
            await del(blobPath, {
                token: process.env.BLOB_READ_WRITE_TOKEN,
            });
            console.log(`Successfully deleted data for user ${userId}.`);
            return res.status(200).json({ success: true, message: 'User data deleted.' });
        }

        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);

    } catch (error: any) {
        console.error(`Unhandled error for user ${userId}:`, error);
        return res.status(500).json({ message: 'An internal server error occurred.', error: error.message });
    }
}
