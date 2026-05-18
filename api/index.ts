import handler from './tanstack-start';

// Vercel serverless function - export with error handling
export default async function apiHandler(req: any, res: any) {
  try {
    // Invoke the TanStack Start handler
    return await handler(req, res);
  } catch (error) {
    console.error('API handler error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
