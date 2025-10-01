const toolRegistry = require("./toolRegistry");

class InstructionManager {
  constructor() {
    this.baseInstructions = `You are Alira, an intelligent AI assistant that can help with various tasks. You have access to multiple tools and can assist with:

1. General Information and Utilities
2. Social Media Content Creation
3. Professional Tasks and Planning
4. Creative Content Generation

Your core principles:
- Always be helpful, accurate, and professional
- Use the most appropriate tool for each task
- Provide clear explanations for your actions
- Ask for clarification when needed
- Respect user privacy and data security
- Be engaging and conversational in your responses`;
  }

  // Get all tool instructions combined
  getAllInstructions() {
    const toolInstructions = toolRegistry
      .getAllTools()
      .map((tool) => tool.instructions)
      .filter((instruction) => instruction) // Filter out undefined instructions
      .join("\n\n");

    return `${this.baseInstructions}\n\n${toolInstructions}`;
  }

  // Get instructions for specific tools
  getInstructionsForTools(toolNames) {
    const tools = toolNames
      .map((name) => toolRegistry.getTool(name))
      .filter(Boolean);
    const toolInstructions = tools
      .map((tool) => tool.instructions)
      .filter((instruction) => instruction)
      .join("\n\n");

    return `${this.baseInstructions}\n\n${toolInstructions}`;
  }

  // Get base instructions only
  getBaseInstructions() {
    return this.baseInstructions;
  }

  // Add custom instructions
  addCustomInstructions(customInstructions) {
    return `${this.baseInstructions}\n\n${customInstructions}`;
  }

  // Get tool-specific instructions
  getToolInstructions(toolName) {
    const tool = toolRegistry.getTool(toolName);
    if (!tool || !tool.instructions) {
      return null;
    }
    return tool.instructions;
  }

  // Get summary of available tools
  getToolsSummary() {
    const tools = toolRegistry.getAllTools();
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      category: this.getToolCategory(tool.name),
    }));
  }

  // Categorize tools
  getToolCategory(toolName) {
    if (toolName.includes("weather") || toolName.includes("calendar")) {
      return "General Utilities";
    } else if (
      toolName.includes("instagram") ||
      toolName.includes("facebook") ||
      toolName.includes("twitter")
    ) {
      return "Social Media";
    } else if (toolName.includes("sheets") || toolName.includes("email")) {
      return "Productivity";
    } else {
      return "Other";
    }
  }

  // Get instructions template for new tools
  getInstructionTemplate() {
    return `Use this tool to [TOOL PURPOSE]. Always:
1. [FIRST REQUIREMENT]
2. [SECOND REQUIREMENT]
3. [THIRD REQUIREMENT]
4. [FOURTH REQUIREMENT]
5. [FIFTH REQUIREMENT]

[TOOL NAME] best practices:
- [BEST PRACTICE 1]
- [BEST PRACTICE 2]
- [BEST PRACTICE 3]
- [BEST PRACTICE 4]`;
  }
}

module.exports = new InstructionManager();
