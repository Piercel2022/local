import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Organization } from '../organizations/organization.entity.js';

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const port = Number(getRequiredEnv('DB_PORT'));

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('DB_PORT must be a valid TCP port');
}

const dataSource = new DataSource({
  type: 'postgres',
  host: getRequiredEnv('DB_HOST'),
  port,
  username: getRequiredEnv('DB_USERNAME'),
  password: getRequiredEnv('DB_PASSWORD'),
  database: getRequiredEnv('DB_DATABASE'),
  entities: [Organization],
  migrations: ['dist/database/migrations/*.js'],
  synchronize: false,
  migrationsRun: false,
});

export default dataSource;
