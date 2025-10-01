const httpClient = require("../../config/axios");
const { createGmailService } = require("../../config/googleOAuth");
const { getUserTokens } = require("../../utils/supabaseAuth");

const gmailTool = {
  name: "gmail",
  description: "Manage Gmail emails with full CRUD operations. Use this to send, read, list, delete, and manage emails.",
  instructions: `Use this tool to manage Gmail emails. Always:
1. Provide clear email details including recipient, subject, and body
2. Handle email IDs properly for read, delete, and mark operations
3. Use appropriate queries for listing emails
4. Provide helpful error messages for failed operations

Gmail best practices:
- Use clear, descriptive email subjects
- Include proper email formatting
- Handle attachments appropriately
- Validate email addresses before sending`,

  schema: {
    type: "object",
    properties: {
      operation: {
        type: "string",
        enum: ["send", "list", "read", "delete", "mark_read", "mark_unread"],
        description: "The CRUD operation to perform: 'send' for sending emails, 'list' for getting emails, 'read' for getting a specific email, 'delete' for removing emails, 'mark_read' for marking emails as read, 'mark_unread' for marking emails as unread"
      },
      userId: {
        type: "string",
        description: "The user ID to get OAuth tokens for (required for all operations)"
      },
      messageId: {
        type: "string",
        description: "Email message ID (required for read, delete, mark_read, and mark_unread operations)"
      },
      emailData: {
        type: "object",
        description: "Email data (required for send operation)",
        properties: {
          to: {
            type: "string",
            description: "Recipient email address (required)"
          },
          subject: {
            type: "string",
            description: "Email subject (required)"
          },
          body: {
            type: "string",
            description: "Email body content (required)"
          },
          isHtml: {
            type: "boolean",
            description: "Whether the email body is HTML (default: false)"
          }
        },
        required: ["to", "subject", "body"]
      },
      query: {
        type: "string",
        description: "Gmail search query (for list operation, e.g., 'is:unread', 'from:example@gmail.com', 'subject:meeting')"
      },
      maxResults: {
        type: "number",
        description: "Maximum number of emails to return (for list operation, default: 10)",
        default: 10
      }
    },
    required: ["operation", "userId"]
  },

  async execute(parameters) {
    try {
      const { operation, userId, messageId, emailData, query = '', maxResults = 10 } = parameters;

      // Get user's OAuth tokens using centralized auth utility
      const tokens = await getUserTokens(userId, 'google_calendar');
      if (!tokens) {
        throw new Error("No valid OAuth tokens found. Please authenticate with Google first.");
      }

      // Create Gmail service
      const gmail = createGmailService(tokens.access_token);

      // Execute the requested operation
      switch (operation) {
        case "send":
          return await this.sendEmail(gmail, emailData);
        case "list":
          return await this.listEmails(gmail, query, maxResults);
        case "read":
          return await this.getEmailById(gmail, messageId);
        case "delete":
          return await this.deleteEmail(gmail, messageId);
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }
    } catch (error) {
      console.error("Gmail tool error:", error);
      throw new Error(`Failed to execute Gmail operation: ${error.message}`);
    }
  },

  async sendEmail(gmail, emailData) {
    try {
      const { to, subject, body, isHtml = false } = emailData;
      
      // Create email message
      const emailMessage = [
        `To: ${to}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        `Content-Type: ${isHtml ? 'text/html' : 'text/plain'}; charset=utf-8`,
        '',
        body
      ].join('\n');

      const encodedMessage = Buffer.from(emailMessage).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });

      return {
        success: true,
        operation: "send",
        messageId: response.data.id,
        message: "Email sent successfully"
      };
    } catch (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  },

  async listEmails(gmail, query, maxResults) {
    try {
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: maxResults
      });

      const messages = response.data.messages || [];
      const emailDetails = [];

      for (const message of messages) {
        const messageDetail = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'metadata',
          metadataHeaders: ['From', 'To', 'Subject', 'Date']
        });

        const headers = messageDetail.data.payload.headers;
        const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
        const from = headers.find(h => h.name === 'From')?.value || 'Unknown Sender';
        const to = headers.find(h => h.name === 'To')?.value || 'Unknown Recipient';
        const date = headers.find(h => h.name === 'Date')?.value || 'Unknown Date';

        emailDetails.push({
          id: message.id,
          subject: subject,
          from: from,
          to: to,
          date: date,
          snippet: messageDetail.data.snippet,
          threadId: messageDetail.data.threadId
        });
      }

      return {
        success: true,
        operation: "list",
        emails: emailDetails,
        total: emailDetails.length,
        query: query,
        message: "Emails retrieved successfully"
      };
    } catch (error) {
      throw new Error(`Failed to list emails: ${error.message}`);
    }
  },

  async getEmailById(gmail, messageId) {
    try {
      if (!messageId) {
        throw new Error("Message ID is required for read operation");
      }

      const response = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      const headers = response.data.payload.headers;
      const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
      const from = headers.find(h => h.name === 'From')?.value || 'Unknown Sender';
      const to = headers.find(h => h.name === 'To')?.value || 'Unknown Recipient';
      const date = headers.find(h => h.name === 'Date')?.value || 'Unknown Date';

      // Get email body
      let body = '';
      if (response.data.payload.body && response.data.payload.body.data) {
        body = Buffer.from(response.data.payload.body.data, 'base64').toString();
      } else if (response.data.payload.parts) {
        for (const part of response.data.payload.parts) {
          if (part.mimeType === 'text/plain' && part.body && part.body.data) {
            body = Buffer.from(part.body.data, 'base64').toString();
            break;
          }
        }
      }

      return {
        success: true,
        operation: "read",
        email: {
          id: messageId,
          subject: subject,
          from: from,
          to: to,
          date: date,
          body: body,
          snippet: response.data.snippet,
          threadId: response.data.threadId
        },
        message: "Email retrieved successfully"
      };
    } catch (error) {
      throw new Error(`Failed to get email: ${error.message}`);
    }
  },

  async deleteEmail(gmail, messageId) {
    try {
      if (!messageId) {
        throw new Error("Message ID is required for delete operation");
      }

      await gmail.users.messages.delete({
        userId: 'me',
        id: messageId
      });

      return {
        success: true,
        operation: "delete",
        messageId: messageId,
        message: "Email deleted successfully"
      };
    } catch (error) {
      throw new Error(`Failed to delete email: ${error.message}`);
    }
  },
};

module.exports = gmailTool; 