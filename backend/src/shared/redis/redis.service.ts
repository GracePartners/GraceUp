import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createClient } from 'redis';

@Injectable()
export class RedisService implements OnModuleDestroy {

  private client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  constructor() {
    this.client.connect();
  }

  async get(key: string) {
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: any, ttl = 60) {
    await this.client.set(
      key,
      JSON.stringify(value),
      { EX: ttl }
    );
  }

  async del(key: string) {
    await this.client.del(key);
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}