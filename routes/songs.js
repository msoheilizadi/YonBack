const express = require('express');
const router = express.Router();
const Song = require('../models/Song');
const { protect } = require('../middleware/authMiddleware');

// POST: ساخت آهنگ جدید (مثلاً از طریق پنل ادمین یا Postman)
// چون فایل‌ها روی لیارا آپلود می‌شوند، ما فقط لینک آن‌ها را از بادی (req.body) می‌گیریم
router.post('/', protect, async (req, res) => {
  try {
    // گرفتن اطلاعات و لینک‌های لیارا از درخواست
    const { title, subtitle, description, imageUrl, audioUrl, category, duration } = req.body;
    
    // اعتبارسنجی ساده
    if (!audioUrl || !imageUrl) {
      return res.status(400).json({ message: 'آدرس فایل صوتی یا تصویر ارسال نشده است.' });
    }

    // ذخیره مستقیم در دیتابیس
    const song = await Song.create({
      title,
      subtitle,
      description,
      imageUrl,  // مثلا: https://yon-assets.storage.iran.liara.space/Cover.jpg
      audioUrl,  // مثلا: https://yon-assets.storage.iran.liara.space/fyrsta.mp3
      category,
      duration
    });

    res.status(201).json(song);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET: دریافت لیست تمام آهنگ‌ها (برای نمایش در اپلیکیشن)
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const whereClause = category ? { category } : {};
    
    // خواندن آهنگ‌ها از دیتابیس
    const songs = await Song.findAll({ where: whereClause });
    res.json(songs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;