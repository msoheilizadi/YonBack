const express = require('express');
const router = express.Router();
const UserPreference = require('../models/UserPreference');
const { protect } = require('../middleware/authMiddleware');

// GET: بررسی اینکه آیا کاربر قبلاً پرسشنامه را پر کرده است یا خیر
router.get('/check', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const preference = await UserPreference.findOne({ where: { userId } });

    if (preference) {
      // اگر دیتا داشت یعنی قبلا پر کرده
      res.status(200).json({ hasFilled: true });
    } else {
      // اگر دیتا نداشت یعنی مجاز است فرم را ببیند
      res.status(200).json({ hasFilled: false });
    }
  } catch (error) {
    console.error("Check Preference Error:", error);
    res.status(500).json({ message: error.message });
  }
});
// POST: دریافت و ذخیره پاسخ‌های کاربر
router.post('/', protect, async (req, res) => {
  try {
    const { q1_impact, experience, best_time, duration } = req.body;
    const userId = req.user.id;

    // بررسی می‌کنیم آیا کاربر قبلاً پرسشنامه را پر کرده است یا خیر
    let preference = await UserPreference.findOne({ where: { userId } });

    if (preference) {
      // 👈 محدودیت جدید: اجازه ثبت دوباره نمی‌دهیم
      return res.status(400).json({ 
        message: "شما قبلاً یک مراقبه اختصاصی دریافت کرده‌اید. در نسخه فعلی تنها امکان ساخت یک فایل برای هر کاربر وجود دارد." 
      });
    }

    // اگر اولین بار است، یک رکورد جدید می‌سازیم
    preference = await UserPreference.create({
      userId,
      impact: q1_impact,
      experience,
      best_time,
      duration
    });

    res.status(200).json({ message: "تنظیمات با موفقیت ذخیره شد", data: preference });
  } catch (error) {
    console.error("Preference Save Error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;