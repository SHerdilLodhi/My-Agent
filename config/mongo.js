// mongo.js
const { MongoClient, ServerApiVersion } = require("mongodb");

const uri =
  "mongodb+srv://lodhisherdil1_db_user:7Gm2K6bzgUsTDF7L@cluster0.jgcgg79.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
// Create a MongoClient instance
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Connect function (reusable)
async function connectDB() {
  try {
    if (!client.topology || !client.topology.isConnected()) {
      await client.connect();
      console.log("✅ Connected to MongoDB Atlas");
    }
    return client;
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

// Helper to get DB
function getDB(dbName) {
  return client.db(dbName);
}

// Export functions
module.exports = {
  connectDB,
  getDB,
};
