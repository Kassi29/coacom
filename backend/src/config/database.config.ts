import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs('database', (): TypeOrmModuleOptions => {
  const databaseUrl = process.env['DATABASE_URL'];

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not defined');
  }

  const url = new URL(databaseUrl);

  return {
    type: 'postgres',
    host: url.hostname,
    port: parseInt(url.port, 10) || 5432,
    username: url.username,
    password: url.password,
    database: url.pathname.replace('/', ''),
    autoLoadEntities: true,
    synchronize: true, //process.env['NODE_ENV'] !== 'production'
    ssl: {
      rejectUnauthorized: false,
    },
    logging: process.env['NODE_ENV'] !== 'production',
  };
});
