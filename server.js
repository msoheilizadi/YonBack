const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path'); // <-- Add this
const { sequelize, connectDB } = require('./config/db');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Database & Routes...
connectDB();
app.use('/api/auth', require('./routes/auth'));
app.use('/api/songs', require('./routes/songs'));

sequelize.sync({ alter: true }).then(() => {
  console.log('Tables created/updated successfully.');
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});