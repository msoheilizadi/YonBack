const express = require("express");
const router = express.Router();
const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");
const path = require("path");
const { protect, admin } = require("../middleware/adminMiddleware");
const Song = require("../models/Song");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// تنظیمات S3 (لیارا) – مشابه auth.js
const s3 = new S3Client({
  region: "default",
  endpoint: process.env.LIARA_ENDPOINT,
  credentials: {
    accessKeyId: process.env.LIARA_ACCESS_KEY,
    secretAccessKey: process.env.LIARA_SECRET_KEY,
  },
});

// آپلود فایل‌ها در دو فیلد مجزا
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.LIARA_BUCKET_NAME,
    acl: "public-read",
    key: function (req, file, cb) {
      const folder = file.fieldname === "image" ? "songs-images" : "songs-audios";
      const ext = path.extname(file.originalname);
      cb(null, `${folder}/song-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "image") {
      const allowed = /jpeg|jpg|png/;
      const isValid = allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype);
      return isValid ? cb(null, true) : cb(new Error("فرمت تصویر باید jpeg، jpg یا png باشد"));
    } else if (file.fieldname === "audio") {
      const allowed = /mp3|mpeg|wav/;
      const isValid = allowed.test(path.extname(file.originalname).toLowerCase()) && /audio/.test(file.mimetype);
      return isValid ? cb(null, true) : cb(new Error("فرمت صوتی باید mp3 یا wav باشد"));
    }
    cb(new Error("فیلد نامعتبر"));
  },
}).fields([
  { name: "image", maxCount: 1 },
  { name: "audio", maxCount: 1 },
]);

// ------------------- ایجاد آهنگ جدید با آپلود فایل -------------------
router.post("/songs", protect, admin, (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      const { title, subtitle, description, category, album, duration } = req.body;

      if (!req.files?.image || !req.files?.audio) {
        return res.status(400).json({ message: "تصویر و فایل صوتی الزامی است" });
      }

      const imageUrl = req.files.image[0].location;
      const audioUrl = req.files.audio[0].location;

      const song = await Song.create({
        title,
        subtitle,
        description,
        imageUrl,
        audioUrl,
        category,
        album,
        duration: parseInt(duration) || 0,
      });

      res.status(201).json({ message: "آهنگ با موفقیت اضافه شد", song });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "خطا در ایجاد آهنگ" });
    }
  });
});

// ------------------- ویرایش آهنگ (بدون آپلود اجباری) -------------------
router.put("/songs/:id", protect, admin, async (req, res) => {
  try {
    const song = await Song.findByPk(req.params.id);
    if (!song) return res.status(404).json({ message: "آهنگ یافت نشد" });

    const { title, subtitle, description, category, album, duration } = req.body;
    song.title = title || song.title;
    song.subtitle = subtitle || song.subtitle;
    song.description = description || song.description;
    song.category = category || song.category;
    song.album = album || song.album;
    song.duration = duration || song.duration;

    await song.save();
    res.json({ message: "آهنگ بروز شد", song });
  } catch (error) {
    res.status(500).json({ message: "خطا در بروزرسانی" });
  }
});

// ------------------- حذف آهنگ -------------------
router.delete("/songs/:id", protect, admin, async (req, res) => {
  try {
    const song = await Song.findByPk(req.params.id);
    if (!song) return res.status(404).json({ message: "آهنگ یافت نشد" });
    await song.destroy();
    res.json({ message: "آهنگ حذف شد" });
  } catch (error) {
    res.status(500).json({ message: "خطا در حذف" });
  }
});

// ------------------- لیست تمام آهنگ‌ها (برای ادمین) -------------------
router.get("/songs", protect, admin, async (req, res) => {
  try {
    const songs = await Song.findAll({ order: [["createdAt", "DESC"]] });
    res.json(songs);
  } catch (error) {
    res.status(500).json({ message: "خطا در دریافت لیست" });
  }
});
// ======================== مدیریت کاربران ========================

// GET: دریافت لیست همه کاربران (فقط ادمین)
router.get("/users", protect, admin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password', 'activeToken'] },
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "خطا در دریافت لیست کاربران" });
  }
});

// DELETE: حذف یک کاربر
router.delete("/users/:id", protect, admin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "کاربر یافت نشد" });
    // جلوگیری از حذف خود ادمین (اختیاری)
    if (user.id === req.user.id) {
      return res.status(400).json({ message: "نمی‌توانید خودتان را حذف کنید" });
    }
    await user.destroy();
    res.json({ message: "کاربر با موفقیت حذف شد" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "خطا در حذف کاربر" });
  }
});

// PUT: تغییر نقش کاربر (admin/user)
router.put("/users/:id/role", protect, admin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: "نقش نامعتبر است" });
    }
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "کاربر یافت نشد" });
    user.role = role;
    await user.save();
    res.json({ message: "نقش کاربر با موفقیت به‌روز شد", user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "خطا در تغییر نقش" });
  }
});

// POST: ایجاد کاربر جدید توسط ادمین (می‌تواند ادمین یا معمولی باشد)
router.post("/users", protect, admin, async (req, res) => {
  const { name, email, password, role = 'user' } = req.body;
  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: "نام، ایمیل و رمز عبور الزامی است" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "رمز عبور باید حداقل ۶ کاراکتر باشد" });
    }
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: "این ایمیل قبلاً ثبت شده است" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'user'
    });
    // حذف فیلدهای حساس از خروجی
    const { password: _, activeToken: __, ...userWithoutSensitive } = newUser.toJSON();
    res.status(201).json(userWithoutSensitive);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "خطا در ایجاد کاربر" });
  }
});

// PUT: ویرایش اطلاعات کاربر (نام، ایمیل، موبایل، زبان، زمان یادآوری)
router.put("/users/:id", protect, admin, async (req, res) => {
  try {
    const { name, email, mobile, language, notificationTime } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "کاربر یافت نشد" });

    // بررسی یکتایی ایمیل (در صورت تغییر ایمیل)
    if (email && email !== user.email) {
      const existing = await User.findOne({ where: { email } });
      if (existing) {
        return res.status(400).json({ message: "این ایمیل قبلاً توسط کاربر دیگری استفاده شده است" });
      }
    }

    // به‌روزرسانی فیلدها (فقط فیلدهایی که ارسال شده‌اند)
    if (name) user.name = name;
    if (email) user.email = email;
    if (mobile !== undefined) user.mobile = mobile;
    if (language) user.language = language;
    if (notificationTime !== undefined) user.notificationTime = notificationTime;

    await user.save();

    // حذف فیلدهای حساس از خروجی
    const { password, activeToken, ...userData } = user.toJSON();
    res.json({ message: "اطلاعات کاربر با موفقیت به‌روز شد", user: userData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "خطا در به‌روزرسانی کاربر" });
  }
});

module.exports = router;