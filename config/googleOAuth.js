const { google } = require("googleapis");

// Google OAuth 2.0 configuration
const googleOAuthConfig = {
  clientId:
    process.env.GOOGLE_CLIENT_ID ||
    "1036274503467-jrsrm58grea66rqvqis1ql4u4j8v5lmi.apps.googleusercontent.com",
  clientSecret:
    process.env.GOOGLE_CLIENT_SECRET || "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",
  redirectUri:
    process.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:3000/api/google-callback",
  scopes: [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ],
};

// Create OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  googleOAuthConfig.clientId,
  googleOAuthConfig.clientSecret,
  googleOAuthConfig.redirectUri
);

// Generate authorization URL
function generateAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: googleOAuthConfig.scopes,
    prompt: "consent", // Force consent to get refresh token
  });
}

// Exchange authorization code for tokens
async function getTokensFromCode(code) {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  } catch (error) {
    console.error("Error getting tokens:", error);
    throw error;
  }
}

// Refresh access token
async function refreshAccessToken(refreshToken) {
  try {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials;
  } catch (error) {
    console.error("Error refreshing token:", error);
    throw error;
  }
}

// Create calendar service
function createCalendarService(accessToken) {
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.calendar({ version: "v3", auth: oauth2Client });
}

// Create Gmail service
function createGmailService(accessToken) {
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth: oauth2Client });
}

// Create Google Sheets service
function createSheetsService(accessToken) {
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.sheets({ version: "v4", auth: oauth2Client });
}

module.exports = {
  googleOAuthConfig,
  oauth2Client,
  generateAuthUrl,
  getTokensFromCode,
  refreshAccessToken,
  createCalendarService,
  createGmailService,
  createSheetsService,
};
 