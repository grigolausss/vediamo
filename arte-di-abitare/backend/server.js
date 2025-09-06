const dotenv = require('dotenv');
// Configure dotenv at the very top to ensure all env variables are loaded before any other module.
dotenv.config({ debug: true });

const express = require('express');
const connectDB = require('./config/db');
const path = require('path');

// Connect to Database
connectDB();

const app = express();

app.use(express.json());

// FIX: Serve static files from the 'public/uploads' directory under the '/uploads' virtual path
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// API routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/properties', require('./routes/propertyRoutes'));
app.use('/api/leads', require('./routes/leadRoutes'));
app.use('/api/employees',require('./routes/employeeRoutes'));
app.use('/api/logs', require('./routes/activityLogRoutes'));

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
