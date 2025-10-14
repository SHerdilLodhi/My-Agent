const { UserToken } = require("../models");
const { refreshAccessToken } = require("../config/googleOAuth");
const mongoose = require("mongoose");

/**
 * Get user OAuth tokens from MongoDB with automatic refresh
 * @param {string} userId - The user ID (can be UUID string or ObjectId string)
 * @param {string} provider - The OAuth provider (e.g., 'google_calendar')
 * @returns {Object|null} - Token object with access_token and refresh_token, or null if not found
 */
async function getUserTokens(userId, provider = 'google_calendar') {
  try {
    console.log(`[AUTH DEBUG] Getting tokens for user: ${userId}, provider: ${provider}`);
    
    // Try to convert to ObjectId if it's a valid ObjectId string
    let userIdQuery = userId;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      userIdQuery = new mongoose.Types.ObjectId(userId);
      console.log(`[AUTH DEBUG] Converted userId to ObjectId for query`);
    } else {
      console.log(`[AUTH DEBUG] Using userId as string (UUID format)`);
    }
    
    // Find the latest token for this user and provider
    const latestToken = await UserToken.findOne({
      user_id: userIdQuery,
      provider: provider
    }).sort({ createdAt: -1 });

    console.log(`[AUTH DEBUG] Query result:`, latestToken ? 'Found token' : 'No token found');

    if (!latestToken) {
      console.log(`[AUTH DEBUG] No tokens found for user ${userId} with provider ${provider}`);
      return null;
    }

    console.log(`[AUTH DEBUG] Found token:`, {
      hasAccessToken: !!latestToken.access_token,
      hasRefreshToken: !!latestToken.refresh_token,
      expiresAt: latestToken.expires_at,
      provider: latestToken.provider
    });

    const now = new Date();
    const expiresAt = latestToken.expires_at ? new Date(latestToken.expires_at) : null;

    // Check if token is expired
    if (expiresAt && expiresAt <= now) {
      console.log(`[AUTH DEBUG] Token expired, refreshing...`);
      try {
        const newTokens = await refreshAccessToken(latestToken.refresh_token);
        
        // Update the token in MongoDB
        await UserToken.findByIdAndUpdate(latestToken._id, {
          access_token: newTokens.access_token,
          expires_at: newTokens.expiry_date ? new Date(newTokens.expiry_date) : null
        });

        console.log(`[AUTH DEBUG] Token refreshed successfully`);
        return {
          access_token: newTokens.access_token,
          refresh_token: latestToken.refresh_token
        };
      } catch (refreshError) {
        console.error(`[AUTH DEBUG] Failed to refresh token for ${provider}:`, refreshError);
        return null;
      }
    }

    console.log(`[AUTH DEBUG] Using existing token for ${provider}`);
    return {
      access_token: latestToken.access_token,
      refresh_token: latestToken.refresh_token
    };
  } catch (error) {
    console.error(`[AUTH DEBUG] Error getting user tokens for ${provider}:`, error);
    return null;
  }
}

module.exports = {
  getUserTokens,
}; 