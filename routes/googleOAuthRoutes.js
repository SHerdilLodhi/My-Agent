const express = require("express");
const router = express.Router();
const { generateAuthUrl, getTokensFromCode } = require("../config/googleOAuth");
const { User, UserToken } = require("../models");

// Google OAuth login endpoint
router.get("/google-auth", async (req, res) => {
  try {
    const { user_id } = req.query;
    
    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: "User ID required",
        message: "Please provide user_id parameter to check for existing tokens"
      });
    }

    console.log("Checking for existing tokens for user ID:", user_id);

    // Check for existing valid tokens in MongoDB
    const existingTokens = await UserToken.find({ 
      user_id: user_id,
      provider: 'google_calendar'
    }).sort({ createdAt: -1 });

    // Check if tokens exist and are not expired
    if (existingTokens && existingTokens.length > 0) {
      const latestToken = existingTokens[0];
      const now = new Date();
      const expiresAt = latestToken.expires_at ? new Date(latestToken.expires_at) : null;
      
      // If token doesn't expire or hasn't expired yet, return existing tokens
      if (!expiresAt || expiresAt > now) {
        console.log("Valid existing tokens found, returning them");
        return res.json({
          success: true,
          message: "Valid existing tokens found",
          hasValidTokens: true,
          data: {
            user_id: user_id,
            access_token: latestToken.access_token,
            refresh_token: latestToken.refresh_token,
            expires_at: latestToken.expires_at,
            created_at: latestToken.createdAt,
            token_id: latestToken._id
          }
        });
      } else {
        console.log("Existing tokens expired, generating new auth URL");
      }
    } else {
      console.log("No existing tokens found, generating new auth URL");
    }

    // Generate new auth URL if no valid tokens exist
    const authUrl = generateAuthUrl();
    res.json({
      success: true,
      authUrl: authUrl,
      message: "No valid tokens found - Google OAuth URL generated",
      hasValidTokens: false
    });
  } catch (error) {
    console.error("Error in Google auth endpoint:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process Google OAuth request",
      message: error.message,
    });
  }
});

// Google OAuth callback endpoint
router.get("/google-callback", async (req, res) => {
  try {
    const { code, error } = req.query;

    if (error) {
      return res.status(400).json({
        success: false,
        error: "OAuth error",
        message: error,
      });
    }

    if (!code) {
      return res.status(400).json({
        success: false,
        error: "Authorization code missing",
        message: "No authorization code received from Google",
      });
    }

    console.log("Received OAuth code, exchanging for tokens...");

    const tokens = await getTokensFromCode(code);
    console.log("Tokens received, getting user info...");

    const { oauth2Client } = require("../config/googleOAuth");
    oauth2Client.setCredentials({ access_token: tokens.access_token });
    
    const { google } = require("googleapis");
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    
    const userInfo = await oauth2.userinfo.get();
    const userEmail = userInfo.data.email;

    // Find user in MongoDB
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      console.error("User not found in database:", userEmail);
      return res.status(404).json({
        success: false,
        error: "User not found",
        message: `No user found with email: ${userEmail}`,
        suggestion: "Please create a user account first or check if the email is correct"
      });
    }

    const userId = user._id;
    console.log("Found user ID:", userId);

    // Check if user already has tokens for this provider
    const existingTokens = await UserToken.find({
      user_id: userId,
      provider: 'google_calendar'
    });

    const tokenData = {
      user_id: userId,
      provider: 'google_calendar',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expiry_date ? new Date(tokens.expiry_date) : null
    };

    let storedToken = null;
    let operation = '';

    if (existingTokens && existingTokens.length > 0) {
      // Update existing token record
      const existingTokenId = existingTokens[0]._id;
      console.log("Updating existing token record for user:", userId);
      
      storedToken = await UserToken.findByIdAndUpdate(
        existingTokenId,
        tokenData,
        { new: true }
      );

      operation = 'updated';
      console.log("Tokens updated successfully in database");
    } else {
      // Create new token record
      console.log("Creating new token record for user:", userId);
      
      storedToken = await UserToken.create(tokenData);

      operation = 'created';
      console.log("Tokens created successfully in database");
    }

    // Build response data
    const responseData = {
      user_id: userId,
      user_email: userEmail,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      scope: tokens.scope,
      token_type: tokens.token_type,
      expiry_date: tokens.expiry_date,
      stored_at: new Date().toISOString(),
      operation: operation
    };

    // Only add database_id if we have a valid storedToken
    if (storedToken && storedToken._id) {
      responseData.database_id = storedToken._id;
    }

    res.json({
      success: true,
      message: `Google OAuth successful - tokens ${operation} in database`,
      data: responseData
    });
  } catch (error) {
    console.error("Error in Google callback:", error);
    res.status(500).json({
      success: false,
      error: "OAuth callback failed",
      message: error.message,
    });
  }
});

// Get current OAuth status
router.get("/google-status", (req, res) => {
  // In a real app, you'd check if user has valid tokens
  res.json({
    success: true,
    message: "OAuth status endpoint",
    data: {
      authenticated: false,
      scopes: [
        "calendar",
        "calendar.events",
        "userinfo.email",
        "userinfo.profile",
      ],
    },
  });
});

// Create new user in MongoDB
router.post("/users", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        message: "Email is required to create a user"
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "User already exists",
        message: "A user with this email already exists"
      });
    }

    // Create new user
    const newUser = await User.create({ email });

    console.log("User created successfully:", newUser._id);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        id: newUser._id,
        email: newUser.email,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt
      }
    });
  } catch (error) {
    console.error("User creation error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to create user",
      message: error.message
    });
  }
});

// Get stored OAuth tokens for a user
router.get("/user-tokens/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("Fetching tokens for user:", userId);
    
    const tokens = await UserToken.find({ user_id: userId })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      message: "Tokens retrieved successfully",
      data: tokens,
      count: tokens.length
    });
  } catch (error) {
    console.error("Error fetching user tokens:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user tokens",
      message: error.message
    });
  }
});

// Get all stored OAuth tokens
router.get("/user-tokens", async (req, res) => {
  try {
    console.log("Fetching all stored OAuth tokens...");
    
    const tokens = await UserToken.find()
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      message: "All tokens retrieved successfully",
      data: tokens,
      count: tokens.length
    });
  } catch (error) {
    console.error("Error fetching all tokens:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch all tokens",
      message: error.message
    });
  }
});

module.exports = router;
