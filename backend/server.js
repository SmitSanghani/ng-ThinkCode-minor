const app = require('./src/app');
const connectDB = require('./src/config/db');
const env = require('./src/config/env');
const seedAdmin = require('./src/config/seeder');

// Connect to Database
connectDB().then(async () => {
    // Seed default admin
    await seedAdmin();
});

const PORT = env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running in ${env.NODE_ENV} mode on port ${PORT}`);
});

// Handle server errors
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use.`);
        process.exit(1);
    } else {
        console.error('Server error:', err);
    }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    // server.close(() => process.exit(1));
});
