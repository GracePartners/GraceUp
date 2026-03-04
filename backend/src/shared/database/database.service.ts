import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';

type QueryResultRow = Record<string, unknown>;

type QueryResult<T extends QueryResultRow> = {
  rows: T[];
};

type DatabaseClient = {
  query<T extends QueryResultRow>(
    queryText: string,
    params?: readonly unknown[]
  ): Promise<QueryResult<T>>;
  release(): void;
};

type DatabasePool = {
  query<T extends QueryResultRow>(
    queryText: string,
    params?: readonly unknown[]
  ): Promise<QueryResult<T>>;
  connect(): Promise<DatabaseClient>;
  end(): Promise<void>;
};

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: DatabasePool;

  constructor() {
    const PgPool = Pool as unknown as new (config: {
      connectionString?: string;
    }) => DatabasePool;

    this.pool = new PgPool({
      connectionString: process.env.DATABASE_URL
    });
  }

  query<T extends QueryResultRow>(
    queryText: string,
    params: readonly unknown[] = []
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(queryText, params);
  }

  async withTransaction<T>(operation: (client: DatabaseClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const result = await operation(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
