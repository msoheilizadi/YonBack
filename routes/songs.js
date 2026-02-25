const express = require("express");
const router = express.Router();
const Song = require("../models/Song");
const { protect } = require("../middleware/authMiddleware");

// POST: ساخت آهنگ جدید
router.post("/", protect, async (req, res) => {
  try {
    const {
      title,
      subtitle,
      description,
      imageUrl,
      audioUrl,
      category,
      album, // 👈 اضافه شد (برای دریافت نام آلبوم از Postman)
      duration,
    } = req.body;

    if (!audioUrl || !imageUrl) {
      return res
        .status(400)
        .json({ message: "آدرس فایل صوتی یا تصویر ارسال نشده است." });
    }

    const song = await Song.create({
      title,
      subtitle,
      description,
      imageUrl,
      audioUrl,
      category,
      album, // 👈 اضافه شد (برای ذخیره در دیتابیس)
      duration,
    });

    res.status(201).json(song);
  } catch (error) {
    res.status(500).json({ message: "خطا در ایجاد فایل صوتی جدید" });
  }
});

// GET: دریافت لیست آهنگ‌ها (با قابلیت فیلتر آلبوم)
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { category, album } = req.query; 
    
    const whereClause = {};
    if (category) whereClause.category = category;
    if (album) whereClause.album = album;

    const { count, rows } = await Song.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]],
    });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      songs: rows,
    });
  } catch (error) {
    res.status(500).json({ message: "خطا در دریافت لیست فایل‌ها" });
  }
});

module.exports = router;