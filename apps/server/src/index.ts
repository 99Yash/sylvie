import { cors } from '@elysiajs/cors';
import { node } from '@elysiajs/node';
import { createContext } from '@sylvie/api/context';
import { appRouter } from '@sylvie/api/routers/index';
import { auth } from '@sylvie/auth';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import 'dotenv/config';
import { Elysia } from 'elysia';

const PORT = process.env.PORT || 3001;
new Elysia({ adapter: node() })
  .use(
    cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST', 'OPTIONS', 'DELETE', 'PUT', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
      credentials: true,
    })
  )
  .all('/api/auth/*', async (context) => {
    const { request, status } = context;
    if (['POST', 'GET'].includes(request.method)) {
      return auth.handler(request);
    }
    return status(405);
  })
  .all('/trpc/*', async (context) => {
    const res = await fetchRequestHandler({
      endpoint: '/trpc',
      router: appRouter,
      req: context.request,
      createContext: () => createContext({ context }),
    });
    return res;
  })
  .get('/', () => 'OK')
  .listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
