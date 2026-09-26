const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error.middleware');

// Load env vars
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

// Route files
const authRoutes = require('./routes/auth.routes');
const warehouseRoutes = require('./routes/warehouse.routes');
const productRoutes = require('./routes/product.routes');
const operationRoutes = require('./routes/operation.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/products', productRoutes);
app.use('/api/operations', operationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Base health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', app: 'StockSense IMS Backend', timestamp: new Date() });
});

// Centralized Error Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[StockSense Server Running]: http://localhost:${PORT}`);
});

process.on('unhandledRejection', (err, promise) => {
  console.error(`[Unhandled Rejection]: ${err.message}`);
});
