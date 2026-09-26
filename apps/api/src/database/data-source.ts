import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { validateEnv } from '../config/env.validation';
import { buildDataSourceOptions } from './database-options';

loadEnv();
const env = validateEnv(process.env);

/** Entry point for the TypeORM CLI (schema:sync, migration:run, ...). */
export default new DataSource(
  buildDataSourceOptions({
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    ssl: env.DB_SSL,
  }),
);
