require("dotenv").config();
const connectDB = require("../src/config/db");
const app = require("../src/app");

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (error) {
    return res.status(500).json({ message: "Falha ao conectar no banco de dados." });
  }
  return app(req, res);
};
