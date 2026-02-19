const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { protect } = require('../middleware/authMiddleware');

// ثبت‌نام
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ where: { email } });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      token: generateToken(user.id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// لاگین
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
}

// --- روت آپدیت پروفایل ---
router.put("/update-profile", protect, async (req, res) => {
  try {
    const user = req.user; // کاربری که از طریق protect پیدا شد

    if (user) {
      user.name = req.body.name || user.name;
      user.mobile = req.body.mobile || user.mobile;
      user.language = req.body.language || user.language;
      user.notificationTime =
        req.body.notificationTime || user.notificationTime;

      // نکته: برای آپلود عکس واقعی نیاز به کتابخانه multer دارید.
      // فعلا فرض میکنیم عکس به صورت رشته (Base64 یا لینک) ارسال میشود.
      if (req.body.profileImage) {
        user.profileImage = req.body.profileImage;
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
        token: generateToken(updatedUser.id), // ارسال توکن جدید (اختیاری)
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// دریافت اطلاعات پروفایل کاربر لاگین شده
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
        // نکته: توکن را اینجا نمی‌فرستیم چون کاربر توکن دارد
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
