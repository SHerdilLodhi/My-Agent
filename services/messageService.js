const { getAvailableTools } = require("../config/toolRegistry");

function prepareTools() {
  const availableTools = getAvailableTools();
  
  console.log("Available tools count:", availableTools.length);
  console.log("Available tools:", availableTools.map(tool => tool.name));

  // Validate and prepare function definitions for OpenAI
  const tools = [];
  for (const tool of availableTools) {
    try {
      // Validate tool schema
      if (!tool.schema || typeof tool.schema !== 'object' || tool.schema.type !== 'object') {
        console.error(`Tool ${tool.name} has invalid schema, skipping`);
        continue;
      }

      const functionDef = {
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.schema
        }
      };

      // Validate the function definition
      if (!functionDef.function.name || !functionDef.function.description || !functionDef.function.parameters) {
        console.error(`Tool ${tool.name} is missing required fields, skipping`);
        continue;
      }

      tools.push(functionDef);
      console.log(`Tool ${tool.name} validated successfully`);
    } catch (error) {
      console.error(`Error validating tool ${tool.name}:`, error);
    }
  }

  return { tools, availableTools };
}

async function executeBasicLLM(message, model, openai) {
  const completion = await openai.chat.completions.create({
    model: model,
    messages: [
      {
        role: "system",
        content: "You are a helpful AI assistant. Provide clear, accurate, and helpful responses.",
      },
      {
        role: "user",
        content: message,
      },
    ],
    max_tokens: 1000,
    temperature: 0.7,
  });

  return completion.choices[0].message.content;
}

async function executeFunctionCalls(assistantMessage, availableTools, userId) {
  const input = [];
  
  for (const toolCall of assistantMessage.tool_calls) {
    const functionName = toolCall.function.name;
    const functionArgs = JSON.parse(toolCall.function.arguments);
    
    console.log(`Executing function: ${functionName}`);
    console.log(`Function arguments:`, functionArgs);

    try {
      // Get the tool from registry
      const tool = availableTools.find(t => t.name === functionName);
      
      if (tool) {

        // Add User ID (req.body.id) to Args (Mandatory)
        const toolsRequiringUserId = ["googleCalendar", "gmail", "googleSheets"];
        if (toolsRequiringUserId.includes(functionName) && userId) {
          functionArgs.userId = userId;
        }

        // Execute the function
        const result = await tool.execute(functionArgs);
        
        console.log(`Function ${functionName} result:`, result);

        // Add function result to input
        input.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result)
        });
      } else {
        console.error(`Tool ${functionName} not found`);
        input.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({
            error: `Tool ${functionName} not found`
          })
        });
      }
    } catch (functionError) {
      console.error(`Error executing function ${functionName}:`, functionError);
      input.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify({
          error: `Error executing ${functionName}: ${functionError.message}`
        })
      });
    }
  }
  
  return input;
}

async function processMessage(message, model, userId, openai) {
  try {
    // Prepare tools
    const { tools, availableTools } = prepareTools();
    console.log("Valid tools count:", tools.length);

    // If no valid tools, fall back to basic LLM response
    if (tools.length === 0) {
      console.log("No valid tools available, using basic LLM response");
      
      const response = await executeBasicLLM(message, model, openai);

      return {
        success: true,
        data: {
          response: response,
          model: model,
          functionCalls: 0,
          timestamp: new Date().toISOString(),
        }
      };
    }

    // Create the conversation input
    let input = [
      { role: "user", content: message }
    ];

    // First API call to get function calls
    let response = await openai.chat.completions.create({
      model: model,
      messages: input,
      tools: tools,
      tool_choice: "auto"
    });

    const assistantMessage = response.choices[0].message;
    input.push(assistantMessage);

    // Check if the model wants to call functions
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log("Function calls detected:", assistantMessage.tool_calls.length);
      
      // Execute function calls
      const functionResults = await executeFunctionCalls(assistantMessage, availableTools, userId);
      input.push(...functionResults);

      // Second API call to get the final response with function results
      const finalResponse = await openai.chat.completions.create({
        model: model,
        messages: input,
        tools: tools,
        tool_choice: "none" // Don't allow more function calls
      });

      const finalMessage = finalResponse.choices[0].message;
      input.push(finalMessage);

      return {
        success: true,
        data: {
          response: finalMessage.content,
          model: model,
          usage: finalResponse.usage,
          functionCalls: assistantMessage.tool_calls?.length || 0,
          conversation: input,
          timestamp: new Date().toISOString(),
        }
      };
    } else {
      // No function calls, just return the response
      return {
        success: true,
        data: {
          response: assistantMessage.content,
          model: model,
          usage: response.usage,
          functionCalls: 0,
          conversation: input,
          timestamp: new Date().toISOString(),
        }
      };
    }
  } catch (error) {
    console.error("Error processing message:", error);
    return {
      success: false,
      error: {
        message: "An error occurred while processing the message",
        details: error.message
      }
    };
  }
}

module.exports = {
  processMessage
}; 