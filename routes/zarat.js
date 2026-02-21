const express = require('express');
const router = express.Router();
const Zarat = require('../models/Zarat');
const { protect } = require('../middleware/authMiddleware');

// POST: ثبت یا آپدیت ذرات امروز
router.post('/', protect, async (req, res) => {
  try {
    const { mood, notes, date } = req.body;
    const userId = req.user.id; // استخراج آیدی کاربر از توکن

    // بررسی می‌کنیم آیا امروز قبلاً رکوردی برای این کاربر ثبت شده است؟
    let zarat = await Zarat.findOne({ where: { userId, date } });

    if (zarat) {
      // اگر وجود داشت، فقط مقادیر جدید را آپدیت می‌کنیم
      zarat.mood = mood !== null ? mood : zarat.mood;
      zarat.notes = notes !== undefined ? notes : zarat.notes;
      await zarat.save();
    } else {
      // اگر وجود نداشت، یک رکورد جدید برای امروز می‌سازیم
      zarat = await Zarat.create({
        userId,
        date,
        mood,
        notes
      });
    }

    res.status(200).json(zarat);
  } catch (error) {
    console.error("Zarat Save Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// GET: دریافت تاریخچه احساسات و تمرینات کاربر
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // گرفتن تمام رکوردهای کاربر از دیتابیس
    const zarats = await Zarat.findAll({
      where: { userId },
      order: [['createdAt', 'ASC']] // مرتب‌سازی از قدیمی به جدید
    });

    res.status(200).json(zarats);
  } catch (error) {
    console.error("Zarat Fetch Error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;