const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/error.middleware');
const authRoutes = require('./routes/auth.routes');
const questionRoutes = require('./routes/question.routes');
const submissionRoutes = require('./routes/submission.routes');
const adminRoutes = require('./routes/admin.routes');
const studentRoutes = require('./routes/student.routes');

const app = express();

// Security Middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Middlewares
app.use(cors({
    origin: 'http://localhost:4200',
    credentials: true
}));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/admin/questions', adminRoutes);
app.use('/api/student', studentRoutes);

app.get('/', (req, res) => {
    res.send('ThinkCode API is running...');
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
