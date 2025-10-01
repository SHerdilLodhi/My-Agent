const httpClient = require("../../config/axios");
const { createCalendarService } = require("../../config/googleOAuth");
const { getUserTokens } = require("../../utils/supabaseAuth");

const googleCalendarTool = {
  name: "googleCalendar",
  description: "Manage Google Calendar events with full CRUD operations. Use this to create, read, update, delete, or list calendar events.",
  instructions: `Use this tool to manage Google Calendar events. Always:
1. Provide clear event details including title, start time, and end time
2. Handle timezone information properly
3. Include location and description when provided
4. Validate date/time formats before creating events
5. Provide helpful error messages for failed operations

Google Calendar best practices:
- Use ISO 8601 format for dates and times
- Always specify timezone for events
- Include meaningful event descriptions
- Handle recurring events appropriately
- Validate user permissions before operations`,

  // Simplified schema that matches OpenAI function calling format
  schema: {
    type: "object",
    properties: {
      operation: {
        type: "string",
        enum: ["create", "read", "update", "delete", "list"],
        description: "The CRUD operation to perform: 'create' for new events, 'read' for getting a specific event, 'update' for modifying events, 'delete' for removing events, 'list' for getting multiple events"
      },
      userId: {
        type: "string",
        description: "The user ID to get OAuth tokens for (required for all operations)"
      },
      eventId: {
        type: "string",
        description: "Event ID (required for read, update, and delete operations)"
      },
      event: {
        type: "object",
        description: "Event data (required for create and update operations)",
        properties: {
          summary: {
            type: "string",
            description: "Event title/summary (required)"
          },
          description: {
            type: "string",
            description: "Event description"
          },
          location: {
            type: "string",
            description: "Event location"
          },
          start: {
            type: "object",
            description: "Event start time (required)",
            properties: {
              dateTime: {
                type: "string",
                description: "Start date and time in ISO 8601 format (e.g., '2024-01-15T10:00:00')"
              },
              timeZone: {
                type: "string",
                description: "Timezone (e.g., 'America/New_York', 'Europe/London', 'Asia/Tokyo')"
              }
            },
            required: ["dateTime", "timeZone"]
          },
          end: {
            type: "object",
            description: "Event end time (required)",
            properties: {
              dateTime: {
                type: "string",
                description: "End date and time in ISO 8601 format (e.g., '2024-01-15T11:00:00')"
              },
              timeZone: {
                type: "string",
                description: "Timezone (e.g., 'America/New_York', 'Europe/London', 'Asia/Tokyo')"
              }
            },
            required: ["dateTime", "timeZone"]
          },
          attendees: {
            type: "array",
            description: "List of attendees",
            items: {
              type: "object",
              properties: {
                email: {
                  type: "string",
                  description: "Attendee email address"
                },
                displayName: {
                  type: "string",
                  description: "Attendee display name"
                }
              }
            }
          }
        },
        required: ["summary", "start", "end"]
      },
      calendarId: {
        type: "string",
        description: "Calendar ID (defaults to 'primary' for user's main calendar)",
        default: "primary"
      },
      maxResults: {
        type: "number",
        description: "Maximum number of events to return (for list operation, default: 10)",
        default: 10
      },
      timeMin: {
        type: "string",
        description: "Lower bound for event start times (ISO 8601 format, e.g., '2024-01-01T00:00:00Z')"
      },
      timeMax: {
        type: "string",
        description: "Upper bound for event start times (ISO 8601 format, e.g., '2024-12-31T23:59:59Z')"
      }
    },
    required: ["operation", "userId"]
  },

  async execute(parameters) {
    try {
      const { operation, userId, eventId, event, calendarId = "primary", maxResults = 10, timeMin, timeMax } = parameters;

      // Get user's OAuth tokens using centralized auth utility
      const tokens = await getUserTokens(userId, 'google_calendar');
      if (!tokens) {
        throw new Error("No valid OAuth tokens found. Please authenticate with Google first.");
      }

      // Create calendar service
      const calendar = createCalendarService(tokens.access_token);

      // Execute the requested operation
      switch (operation) {
        case "create":
          return await this.createEvent(calendar, calendarId, event);
        case "read":
          return await this.getEvent(calendar, calendarId, eventId);
        case "update":
          return await this.updateEvent(calendar, calendarId, eventId, event);
        case "delete":
          return await this.deleteEvent(calendar, calendarId, eventId);
        case "list":
          return await this.listEvents(calendar, calendarId, maxResults, timeMin, timeMax);
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }
    } catch (error) {
      console.error("Google Calendar tool error:", error);
      throw new Error(`Failed to execute calendar operation: ${error.message}`);
    }
  },

  async createEvent(calendar, calendarId, eventData) {
    try {
      const event = {
        summary: eventData.summary,
        description: eventData.description || "",
        location: eventData.location || "",
        start: eventData.start,
        end: eventData.end,
        attendees: eventData.attendees || []
      };

      const response = await calendar.events.insert({
        calendarId: calendarId,
        resource: event
      });

      return {
        success: true,
        operation: "create",
        event: response.data,
        message: "Event created successfully"
      };
    } catch (error) {
      throw new Error(`Failed to create event: ${error.message}`);
    }
  },

  async getEvent(calendar, calendarId, eventId) {
    try {
      if (!eventId) {
        throw new Error("Event ID is required for read operation");
      }

      const response = await calendar.events.get({
        calendarId: calendarId,
        eventId: eventId
      });

      return {
        success: true,
        operation: "read",
        event: response.data,
        message: "Event retrieved successfully"
      };
    } catch (error) {
      throw new Error(`Failed to get event: ${error.message}`);
    }
  },

  async updateEvent(calendar, calendarId, eventId, eventData) {
    try {
      if (!eventId) {
        throw new Error("Event ID is required for update operation");
      }

      // First get the existing event
      const existingEvent = await calendar.events.get({
        calendarId: calendarId,
        eventId: eventId
      });

      // Merge with new data
      const updatedEvent = {
        ...existingEvent.data,
        summary: eventData.summary || existingEvent.data.summary,
        description: eventData.description !== undefined ? eventData.description : existingEvent.data.description,
        location: eventData.location !== undefined ? eventData.location : existingEvent.data.location,
        start: eventData.start || existingEvent.data.start,
        end: eventData.end || existingEvent.data.end,
        attendees: eventData.attendees || existingEvent.data.attendees || []
      };

      const response = await calendar.events.update({
        calendarId: calendarId,
        eventId: eventId,
        resource: updatedEvent
      });

      return {
        success: true,
        operation: "update",
        event: response.data,
        message: "Event updated successfully"
      };
    } catch (error) {
      throw new Error(`Failed to update event: ${error.message}`);
    }
  },

  async deleteEvent(calendar, calendarId, eventId) {
    try {
      if (!eventId) {
        throw new Error("Event ID is required for delete operation");
      }

      await calendar.events.delete({
        calendarId: calendarId,
        eventId: eventId
      });

      return {
        success: true,
        operation: "delete",
        eventId: eventId,
        message: "Event deleted successfully"
      };
    } catch (error) {
      throw new Error(`Failed to delete event: ${error.message}`);
    }
  },

  async listEvents(calendar, calendarId, maxResults, timeMin, timeMax) {
    try {
      const params = {
        calendarId: calendarId,
        maxResults: maxResults,
        singleEvents: true,
        orderBy: 'startTime'
      };

      if (timeMin) params.timeMin = timeMin;
      if (timeMax) params.timeMax = timeMax;

      const response = await calendar.events.list(params);

      return {
        success: true,
        operation: "list",
        events: response.data.items || [],
        total: response.data.items ? response.data.items.length : 0,
        message: "Events retrieved successfully"
      };
    } catch (error) {
      throw new Error(`Failed to list events: ${error.message}`);
    }
  }
};

module.exports = googleCalendarTool; 