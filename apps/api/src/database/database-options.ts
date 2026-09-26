import { join } from 'path';
import { DataSourceOptions } from 'typeorm';
import { ENTITIES } from './entities';

export interface DatabaseSettings {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
}

/**
 * Single source of truth for TypeORM options, used by both the Nest runtime and the CLI.
 * `synchronize` is deliberately off: the schema changes through `schema:sync` (dev only)
 * and migrations, never implicitly at app startup.
 */
export function buildDataSourceOptions(settings: DatabaseSettings): DataSourceOptions {
  return {
    type: 'postgres',
    host: settings.host,
    port: settings.port,
    database: settings.database,
    username: settings.username,
    password: settings.password,
    ssl: settings.ssl ? { rejectUnauthorized: false } : false,
    entities: ENTITIES,
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
    synchronize: false,
  };
}
