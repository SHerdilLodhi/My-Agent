# Alira Server - Organized Architecture

A Node.js server with a single LLM endpoint and an organized, scalable tool system for agentic AI operations.

## 🏗️ Architecture Overview

The server is organized into a clean, modular structure that makes it easy to add new tools and maintain existing ones:

```
alira-server/
├── config/                     # Configuration and management
│   ├── toolRegistry.js        # Central tool registry
│   └── instructionManager.js  # Dynamic instruction management
├── tools/                      # Tool modules organized by category
│   ├── general-tools/         # General utility tools
│   │   └── weather.js         # Weather information tool
│   ├── social-media-tools/    # Social media tools
│   │   └── instagram.js       # Instagram caption generator
│   └── templates/             # Templates for creating new tools
│       └── toolTemplate.js    # Tool creation template
├── services/                   # Business logic
│   └── messageService.js      # Main LLM processing service
├── routes/                     # API routes
│   └── messageRoutes.js       # Single LLM endpoint
├── server.js                   # Main server file
└── package.json               # Dependencies
```

## 🚀 Single Endpoint

The server provides one main endpoint:

- **POST** `/api/message-llm` - Process messages with AI agent and tools

## 🛠️ Tool System

### Adding New Tools

1. **Create Tool File**: Use the template in `templates/toolTemplate.js`
2. **Define Tool Structure**:
   ```javascript
   const myTool = {
     name: "my_tool_name",
     description: "What the tool does",
     instructions: "Detailed AI instructions...",
     schema: {
       /* OpenAI function schema */
     },
     async execute(parameters) {
       /* Tool logic */
     },
   };
   ```
3. **Register Tool**: Add to `config/toolRegistry.js`
4. **Test**: The tool automatically becomes available to the AI

### Tool Categories

- **General Tools**: Utilities like weather, time, calculations
- **Social Media Tools**: Content creation for various platforms
- **Productivity Tools**: Calendar, email, document management
- **Custom Tools**: Any specialized functionality you need

## 📚 Instruction Management

The `instructionManager` automatically:

- Combines instructions from all available tools
- Provides dynamic instruction generation
- Maintains consistent AI behavior across tools
- Allows custom instruction overrides

## 🔧 Configuration

### Environment Variables

```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
NODE_ENV=development
```

### Tool Registry

```javascript
// config/toolRegistry.js
const myTool = require("../tools/category/myTool");

const toolRegistry = {
  myTool: myTool,
  // ... other tools
};
```

## 💡 Usage Examples

### Basic Message Processing

```javascript
const response = await fetch("/api/message-llm", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: "What's the weather like in San Francisco?",
  }),
});
```

### Using Tools

The AI automatically selects and uses appropriate tools:

- Weather queries → `getWeather` tool
- Instagram content → `generateInstagramCaption` tool
- Complex tasks → Multiple tools as needed

## 🚀 Benefits of This Architecture

1. **Scalable**: Easy to add new tools without modifying existing code
2. **Maintainable**: Each tool is self-contained with clear responsibilities
3. **Organized**: Tools are categorized and managed centrally
4. **Flexible**: Instructions are dynamically generated and can be customized
5. **Testable**: Each component can be tested independently

## 🔮 Adding New Tools

### Quick Start

1. Copy `templates/toolTemplate.js`
2. Implement your tool logic
3. Add to `toolRegistry.js`
4. Test with the message service

### Tool Requirements

- Must have `name`, `description`, `instructions`, `schema`, and `execute` method
- Follow the established pattern for consistency
- Include comprehensive instructions for the AI
- Handle errors gracefully

## 📊 Current Tools

- **Weather Tool**: Get weather information for any location
- **Instagram Tool**: Generate engaging social media captions

## 🎯 Next Steps

1. Add more social media tools (Facebook, Twitter, LinkedIn)
2. Implement productivity tools (Calendar, Email, Sheets)
3. Create specialized domain tools as needed
4. Add tool analytics and monitoring

---

**Built with scalability and maintainability in mind**
