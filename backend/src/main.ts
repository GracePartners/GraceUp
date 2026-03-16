import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: "http://localhost:3000",
    credentials: true
  });

  // Redis clients
  const pubClient = createClient({
    url: process.env.REDIS_URL ?? 'redis://localhost:6379'
  });

  const subClient = pubClient.duplicate();

  await pubClient.connect();
  await subClient.connect();

  // Attach Redis adapter to Socket.io
  const httpAdapter = app.getHttpAdapter();
  const server: any = httpAdapter.getInstance();

  if (server?.io) {
    server.io.adapter(createAdapter(pubClient, subClient));
  }

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);

  console.log('Redis adapter connected');
}

void bootstrap();
