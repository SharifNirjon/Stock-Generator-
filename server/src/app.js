const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const collectionsRoutes = require('./routes/collections.routes');
const reportsRoutes = require('./routes/reports.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');

const app = express();

const clientUrl = process.env.CLIENT_URL?.trim().replace(/\/$/, '');

app.use(helmet());
app.use(cors({ origin: clientUrl || true, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
