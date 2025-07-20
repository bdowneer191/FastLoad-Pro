import { put, list, del } from '@vercel/blob';

export const config = {
  runtime: 'edge',
};

// Redefine Session type to avoid import path issues in the serverless function environment
interface Session {
  id?: string;
  url: string;
  startTime: string;
  endTime: string;
  duration: number;
  beforeScores: { mobile: number; desktop: number };
  afterScores: { mobile: number; desktop: number };
  userId: string;
}

export default async function handler(request: Request) {
    const { method } = request;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return new Response('Error: A user ID must be provided.', { status: 400 });
    }
    
    const blobPath = `sessions/${userId}.json`;

    switch (method) {
        case 'GET':
            try {
                const { blobs } = await list({ prefix: blobPath, limit: 1 });
                const existingBlob = blobs.find(b => b.pathname === blobPath);

                if (!existingBlob) {
                    return new Response(JSON.stringify([]), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                    });
                }

                const response = await fetch(existingBlob.url);
                 if (!response.ok) {
                  // If fetching the blob URL fails, assume it's empty or inaccessible
                  return new Response(JSON.stringify([]), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                    });
                }
                const sessions = await response.json();
                
                return new Response(JSON.stringify(sessions), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            } catch (error: any) {
                console.error('Vercel Blob GET Error:', error);
                 // Return an empty array on error to allow the app to function
                return new Response(JSON.stringify([]), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            
        case 'POST':
            try {
                const newSession = await request.json() as Session;
                if (newSession.userId !== userId) {
                    return new Response('Error: userId in body does not match userId in query.', { status: 400 });
                }

                let sessions: Session[] = [];
                try {
                    const { blobs } = await list({ prefix: blobPath, limit: 1 });
                    const existingBlob = blobs.find(b => b.pathname === blobPath);
                    if (existingBlob) {
                        const response = await fetch(existingBlob.url);
                        if (response.ok) {
                            sessions = await response.json();
                        }
                    }
                } catch (error: any) {
                    // Log the error but continue with an empty session array, allowing overwrite.
                    console.error('Could not retrieve existing sessions, a new history file will be created:', error);
                }

                newSession.id = new Date().toISOString() + '-' + Math.random().toString(36).substring(2, 9);
                sessions.push(newSession);
                sessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
                
                await put(blobPath, JSON.stringify(sessions, null, 2), {
                    access: 'public',
                    contentType: 'application/json'
                });

                return new Response(JSON.stringify(newSession), {
                    status: 201,
                    headers: { 'Content-Type': 'application/json' },
                });
            } catch (error: any) {
                console.error('Vercel Blob POST Error:', error);
                return new Response(JSON.stringify({ message: 'Internal Server Error while saving session.' }), { status: 500 });
            }
            
        case 'DELETE':
             try {
                const { blobs } = await list({ prefix: blobPath, limit: 1 });
                const blobToDelete = blobs.find(b => b.pathname === blobPath);

                if (blobToDelete) {
                    await del(blobToDelete.url);
                }

                return new Response(JSON.stringify({ message: 'Session history successfully cleared.' }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            } catch (error: any) {
                console.error('Vercel Blob DELETE Error:', error);
                return new Response(JSON.stringify({ message: 'Internal Server Error while clearing history.' }), { status: 500 });
            }

        default:
            return new Response(`Method ${method} Not Allowed`, {
                status: 405,
                headers: {
                    Allow: 'GET, POST, DELETE',
                },
            });
    }
}
