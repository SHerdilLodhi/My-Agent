const httpClient = require("../config/axios");
const { refreshAccessToken } = require("../config/googleOAuth");

/**
 * Get user OAuth tokens from Supabase with automatic refresh
 * @param {string} userId - The user ID
 * @param {string} provider - The OAuth provider (e.g., 'google_calendar')
 * @returns {Object|null} - Token object with access_token and refresh_token, or null if not found
 */
async function getUserTokens(userId, provider = 'google_calendar') {
  try {
    console.log(`[AUTH DEBUG] Getting tokens for user: ${userId}, provider: ${provider}`);
    
    const response = await httpClient.supabase.get('/rest/v1/user_tokens', {
      user_id: `eq.${userId}`,
      provider: `eq.${provider}`,
      select: '*',
      order: 'created_at.desc'
    });

    console.log(`[AUTH DEBUG] Supabase response:`, response);

    if (response.error || !response.data || response.data.length === 0) {
      console.log(`[AUTH DEBUG] No tokens found for user ${userId} with provider ${provider}`);
      return null;
    }

    const latestToken = response.data[0];
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
        
        // Update the token in database
        await httpClient.supabase.patch(`/rest/v1/user_tokens?id=eq.${latestToken.id}`, {
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