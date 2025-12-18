import { DataSource } from 'typeorm';
import { config } from './config';
import { User } from './models/user';
import { Class } from './models/class';
import { Student } from './models/student';
import { BehaviorLog } from './models/BehaviorLog';
import { UserClassRelation } from './models/userClassRelation';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.dbHost,
  port: config.dbPort,
  username: config.dbUser,
  password: config.dbPassword,
  database: config.dbName,
  synchronize: true, // Auto-create tables in dev, be careful in prod
  logging: config.env === 'development',
  entities: [User, Class, Student, BehaviorLog, UserClassRelation],
  subscribers: [],
  migrations: [],
});
