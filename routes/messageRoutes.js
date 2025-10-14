const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const { processMessage } = require("../services/messageService");
const { validateMessage } = require("../middleware/validation");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/message-llm", validateMessage, async (req, res) => {
  try {
    const { message, model = "gpt-5-nano", userId } = req.validatedData;

    const result = await processMessage(message, model, userId, openai);

    if (!result.success) {
      const { status = 500, message: errMsg, details } = result.error || {};
      return res.status(status).json({
        error: "Processing Error",
        message: errMsg || "An error occurred while processing the message",
        details: details || null
      });
    }

    return res.json({
      success: true,
      message: "LLM response generated successfully",
      data: result.data
    });
  } catch (error) {
    console.error("Error in message route:", error);
    res.status(500).json({
      error: "Server Error",
      message: error.message || "An unexpected error occurred"
    });
  }
});

module.exports = router;
