const mongoose = require("mongoose");

let cached = global._mongooseCache;
if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) return cached.conn;

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI não configurado.");
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGO_URI, { bufferCommands: false })
      .then((mongooseInstance) => {
        console.log("MongoDB conectado com sucesso.");
        return mongooseInstance;
      })
      .catch((error) => {
        cached.promise = null;
        console.error("Erro ao conectar no MongoDB:", error.message);
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;
