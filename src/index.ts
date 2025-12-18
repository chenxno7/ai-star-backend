import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config';
import { AppDataSource } from './data-source';
import routes from './routes';

const app = express();

// Middleware
app.use(cors());
app.use(morgan('tiny'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/', (req, res) => {
  res.send('AI StarClass Backend Service is Running');
});

// Routes
app.use('/api', routes);

// Database Connection
AppDataSource.initialize()
  .then(() => {
    console.log('Connected to PostgreSQL via TypeORM');
    // Start Server
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  })
  .catch((err) => {
    console.error('TypeORM initialization error:', err);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // close server & exit process
});
