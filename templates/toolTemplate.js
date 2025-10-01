/**
 * Tool Template - Use this as a starting point for creating new tools
 *
 * Steps to create a new tool:
 * 1. Copy this template to the appropriate tools directory
 * 2. Rename the file and tool object
 * 3. Update the name, description, and instructions
 * 4. Define the schema parameters
 * 5. Implement the execute method
 * 6. Add the tool to config/toolRegistry.js
 */

const toolTemplate = {
  // Unique name for the tool (used in function calls)
  name: "template_tool",

  // Brief description of what the tool does
  description: "Template tool for creating new tools",

  // Detailed instructions for the AI on how to use this tool
  instructions: `Use this tool to [DESCRIBE PURPOSE]. Always:
1. [FIRST REQUIREMENT]
2. [SECOND REQUIREMENT]
3. [THIRD REQUIREMENT]
4. [FOURTH REQUIREMENT]
5. [FIFTH REQUIREMENT]

[TOOL NAME] best practices:
- [BEST PRACTICE 1]
- [BEST PRACTICE 2]
- [BEST PRACTICE 3]
- [BEST PRACTICE 4]`,

  // OpenAI function schema definition
  schema: {
    type: "function",
    function: {
      name: "template_tool",
      description: "Template tool for creating new tools",
      parameters: {
        type: "object",
        properties: {
          // Define your parameters here
          example_param: {
            type: "string",
            description: "Description of the parameter",
          },
          // Add more parameters as needed
        },
        required: ["example_param"], // List required parameters
      },
    },
  },

  // Main execution method - implement your tool logic here
  async execute(parameters) {
    try {
      // Extract parameters
      const { example_param } = parameters;

      // Implement your tool logic here
      const result = {
        success: true,
        message: `Tool executed with parameter: ${example_param}`,
        data: {
          // Your result data here
          processed_param: example_param,
          timestamp: new Date().toISOString(),
        },
      };

      return result;
    } catch (error) {
      console.error("Tool execution error:", error);
      throw new Error(`Failed to execute tool: ${error.message}`);
    }
  },

  // Optional: Add helper methods specific to your tool
  helperMethod() {
    // Add helper methods as needed
    return "Helper method result";
  },
};

module.exports = toolTemplate;
