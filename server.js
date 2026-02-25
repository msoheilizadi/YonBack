const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const { sequelize, connectDB } = require("./config/db");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Database & Routes...
connectDB();
app.use("/api/auth", require("./routes/auth"));
app.use("/api/songs", require("./routes/songs"));
app.use("/api/zarat", require("./routes/zarat"));
app.use("/api/preferences", require("./routes/preferences"));

require("./models/User");
require("./models/Song");
require("./models/Zarat");
require("./models/UserPreference");

app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack);
  res.status(500).json({ message: "خطای سرور. لطفاً دوباره تلاش کنید." });
});

const isDevelopment = process.env.NODE_ENV === "development";

sequelize.sync({ alter: isDevelopment }).then(() => {
  console.log(`Tables synced. (Alter: ${isDevelopment})`);
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} and listening on 0.0.0.0`);
  });
});
