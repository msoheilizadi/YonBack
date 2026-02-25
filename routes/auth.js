const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { protect } = require("../middleware/authMiddleware");

// --- تنظیمات آپلود روی لیارا (S3) ---
const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");
const path = require("path");

const s3 = new S3Client({
  region: "default",
  endpoint: process.env.LIARA_ENDPOINT,
  credentials: {
    accessKeyId: process.env.LIARA_ACCESS_KEY,
    secretAccessKey: process.env.LIARA_SECRET_KEY,
  },
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.LIARA_BUCKET_NAME,
    acl: "public-read",
    key: function (req, file, cb) {
      cb(
        null,
        `profiles/user-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`,
      );
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // محدودیت ۵ مگابایت
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("فقط تصاویر (jpeg, jpg, png) مجاز هستند!"));
    }
  },
});

// تابع تولید توکن با انقضای ۳۰ روز
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// ثبت‌نام
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: "لطفاً تمام فیلدها را پر کنید" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "رمز عبور باید حداقل ۶ کاراکتر باشد" });
    }

    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: "این ایمیل قبلاً ثبت شده است" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, password: hashedPassword });

    // 👈 بخش جدید: ساخت توکن و ذخیره آن در دیتابیس به عنوان توکن فعال
    const token = generateToken(user.id);
    user.activeToken = token;
    await user.save();

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      token: token,
    });
  } catch (error) {
    res.status(500).json({ message: "خطا در سرور هنگام ثبت‌نام" });
  }
});

// لاگین
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    
    if (user && (await bcrypt.compare(password, user.password))) {
      // 👈 بخش جدید: در هر بار ورود، یک توکن جدید می‌سازیم و توکن قبلی را باطل می‌کنیم
      const token = generateToken(user.id);
      user.activeToken = token;
      await user.save();

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        token: token,
      });
    } else {
      res.status(401).json({ message: "ایمیل یا رمز عبور اشتباه است" });
    }
  } catch (error) {
    res.status(500).json({ message: "خطا در سرور هنگام ورود" });
  }
});

// آپدیت پروفایل همراه با آپلود عکس
router.put(
  "/update-profile",
  protect,
  upload.single("profileImage"),
  async (req, res) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(404).json({ message: "کاربر یافت نشد" });
      }

      user.name = req.body.name || user.name;
      user.mobile = req.body.mobile || user.mobile;
      user.language = req.body.language || user.language;
      user.notificationTime =
        req.body.notificationTime || user.notificationTime;

      // دریافت لینک عکس از لیارا و ذخیره
      if (req.file && req.file.location) {
        user.profileImage = req.file.location;
      }

      const updatedUser = await user.save();

      res.json({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        mobile: updatedUser.mobile,
        language: updatedUser.language,
        notificationTime: updatedUser.notificationTime,
        profileImage: updatedUser.profileImage,
        // توجه: در آپدیت پروفایل نیازی به تغییر توکن فعال نیست
        token: generateToken(updatedUser.id),
      });
    } catch (error) {
      res.status(500).json({ message: "خطا در بروزرسانی پروفایل" });
    }
  },
);

// دریافت اطلاعات پروفایل
router.get("/profile", protect, async (req, res) => {
  try {
    const user = req.user;
    if (user) {
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        language: user.language,
        profileImage: user.profileImage,
        notificationTime: user.notificationTime,
      });
    } else {
      res.status(404).json({ message: "کاربر یافت نشد" });
    }
  } catch (error) {
    res.status(500).json({ message: "خطا در دریافت پروفایل" });
  }
});

module.exports = router;