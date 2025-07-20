
export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
    return new Response('API endpoint is temporarily disabled.', { 
        status: 404,
        headers: { 'Content-Type': 'application/json' },
    });
}
