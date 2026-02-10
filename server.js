const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { sequelize, connectDB } = require('./config/db');

// فراخوانی مدل‌ها برای ساخته شدن جداول
const User = require('./models/User');
const Song = require('./models/Song');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// اتصال به دیتابیس
connectDB();

// روت‌ها
app.use('/api/auth', require('./routes/auth'));
app.use('/api/songs', require('./routes/songs'));

// همگام‌سازی دیتابیس (ساخت جداول)
// نکته: در محیط پروداکشن force: true را بردارید چون داده‌ها را پاک می‌کند!
sequelize.sync({ alter: true }).then(() => {
  console.log('Tables created/updated successfully.');
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.log('Error syncing database:', err);
});