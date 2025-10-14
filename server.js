require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

// Mongo
const { connectDB } = require("./config/mongo");

// Routes
const messageRoutes = require("./routes/messageRoutes");
const googleOAuthRoutes = require("./routes/googleOAuthRoutes");

function createApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, "public")));

  // API Routes
  app.use("/api", messageRoutes);
  app.use("/api", googleOAuthRoutes);

  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });

  app.get("/health", (req, res) => {
    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  return app;
}

// Server startup
async function startServer() {
  // Connect to MongoDB
  connectDB().catch(console.error);

  const app = createApp();
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`🩺 Health check: http://localhost:${PORT}/health`);
  });
}

startServer();
