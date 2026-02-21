const express = require('express');
const router = express.Router();
const Song = require('../models/Song');
const { protect } = require('../middleware/authMiddleware');

// POST: ساخت آهنگ جدید
router.post('/', protect, async (req, res) => {
  try {
    const { title, subtitle, description, imageUrl, audioUrl, category, duration } = req.body;
    
    if (!audioUrl || !imageUrl) {
      return res.status(400).json({ message: 'آدرس فایل صوتی یا تصویر ارسال نشده است.' });
    }

    const song = await Song.create({
      title,
      subtitle,
      description,
      imageUrl,  
      audioUrl,  
      category,
      duration
    });

    res.status(201).json(song);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET: دریافت لیست آهنگ‌ها (با قابلیت صفحه‌بندی)
router.get('/', async (req, res) => {
  try {
    // ۱. دریافت شماره صفحه و محدودیت از کوئری (با مقادیر پیش‌فرض صفحه ۱ و تعداد ۱۰)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // ۲. محاسبه نقطه شروع (Offset)
    const offset = (page - 1) * limit;

    const { category } = req.query;
    const whereClause = category ? { category } : {};
    
    // ۳. خواندن آهنگ‌ها از دیتابیس به صورت محدود شده
    const { count, rows } = await Song.findAndCountAll({ 
      where: whereClause,
      limit: limit,
      offset: offset,
      order: [['createdAt', 'DESC']] // مرتب‌سازی از جدیدترین به قدیمی‌ترین
    });

    // ۴. ارسال پاسخ استاندارد شامل اطلاعات صفحه‌بندی
    res.json({
      totalItems: count, // کل آهنگ‌های موجود در این دسته‌بندی
      totalPages: Math.ceil(count / limit), // تعداد کل صفحات
      currentPage: page, // صفحه‌ای که الان در آن هستیم
      songs: rows // لیست آهنگ‌های این صفحه
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;