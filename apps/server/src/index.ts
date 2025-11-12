import { createContext } from '@ciaran/api/context';
import { appRouter } from '@ciaran/api/routers/index';
import { auth } from '@ciaran/auth';
import { cors } from '@elysiajs/cors';
import { node } from '@elysiajs/node';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import 'dotenv/config';
import { Elysia } from 'elysia';

new Elysia({ adapter: node() })
  .use(
    cors({
      origin: process.env.CORS_ORIGIN || '',
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
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
  .listen(3001, () => {
    console.log('Server is running on http://localhost:3001');
  });
