const httpClient = require("../../config/axios");
const { createSheetsService } = require("../../config/googleOAuth");
const { getUserTokens } = require("../../utils/supabaseAuth");

const googleSheetsTool = {
  name: "googleSheets",
  description: "Manage Google Sheets with full CRUD operations. Use this to create, read, update, delete, and manage spreadsheets and data.",
  instructions: `Use this tool to manage Google Sheets. Always:
1. Provide clear sheet details including title, data, and range
2. Handle cell ranges properly (e.g., 'A1:C10')
3. Include proper data formatting when provided
4. Validate range formats before operations
5. Provide helpful error messages for failed operations

Google Sheets best practices:
- Use proper range notation (A1:C10)
- Include headers in data when appropriate
- Handle large datasets efficiently
- Validate data types before inserting`,

  schema: {
    type: "object",
    properties: {
      operation: {
        type: "string",
        enum: ["create", "read", "update", "append", "clear", "list"],
        description: "The CRUD operation to perform: 'create' for new spreadsheets, 'read' for getting data, 'update' for modifying data, 'append' for adding data, 'clear' for removing data, 'list' for getting spreadsheet info"
      },
      userId: {
        type: "string",
        description: "The user ID to get OAuth tokens for (required for all operations)"
      },
      spreadsheetId: {
        type: "string",
        description: "Spreadsheet ID (required for read, update, append, clear operations)"
      },
      range: {
        type: "string",
        description: "Cell range (e.g., 'A1:C10', 'Sheet1!A1:B5') - required for read, update, clear operations"
      },
      data: {
        type: "array",
        description: "Data to insert/update (array of arrays) - required for create, update, append operations",
        items: {
          type: "array",
          items: {
            type: "string"
          }
        }
      },
      title: {
        type: "string",
        description: "Spreadsheet title (required for create operation)"
      },
      sheetName: {
        type: "string",
        description: "Sheet name within spreadsheet (optional, defaults to 'Sheet1')"
      },
      valueInputOption: {
        type: "string",
        enum: ["RAW", "USER_ENTERED"],
        description: "How to interpret input data (default: USER_ENTERED)",
        default: "USER_ENTERED"
      }
    },
    required: ["operation", "userId"]
  },

  async execute(parameters) {
    try {
      const { operation, userId, spreadsheetId, range, data, title, sheetName = "Sheet1", valueInputOption = "USER_ENTERED" } = parameters;

      // Get user's OAuth tokens using centralized auth utility
      const tokens = await getUserTokens(userId, 'google_calendar');
      if (!tokens) {
        throw new Error("No valid OAuth tokens found. Please authenticate with Google first.");
      }

      // Create Sheets service
      const sheets = createSheetsService(tokens.access_token);

      // Execute the requested operation
      switch (operation) {
        case "create":
          return await this.createSpreadsheet(sheets, title, data, sheetName);
        case "read":
          return await this.readData(sheets, spreadsheetId, range);
        case "update":
          return await this.updateData(sheets, spreadsheetId, range, data, valueInputOption);
        case "append":
          return await this.appendData(sheets, spreadsheetId, range, data, valueInputOption);
        case "clear":
          return await this.clearData(sheets, spreadsheetId, range);
        case "list":
          return await this.listSpreadsheets(sheets);
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }
    } catch (error) {
      console.error("Google Sheets tool error:", error);
      throw new Error(`Failed to execute Sheets operation: ${error.message}`);
    }
  },
};

module.exports = googleSheetsTool; 