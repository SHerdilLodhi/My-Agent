# Function Calling Issue - Fixed ✅

## Problem
The AI assistant was not calling tools/functions even when tools were available. Instead, it was responding with text asking for more information.

### Symptoms:
- `assistantMessage.tool_calls` was `undefined`
- No function calls were being made
- Model was asking for information instead of using tools

## Root Cause
**Missing System Prompt**: The OpenAI API calls were not including a system message that instructs the model to use tools proactively.

Without clear instructions, the model defaults to conservative behavior - asking questions instead of taking action.

## Solution Applied

### 1. Added System Prompt with Clear Instructions
Added a comprehensive system prompt that:
- Instructs the model to USE TOOLS immediately when users request actions
- Tells the model NOT to ask for information that can be inferred
- Provides the userId in context for automatic use
- Encourages use of sensible defaults
- Lists available tools explicitly
- Gives specific guidance for calendar events

**Location**: `services/messageService.js` lines 146-170

```javascript
{
  role: "system",
  content: `You are a helpful AI assistant with access to various tools and APIs.

IMPORTANT INSTRUCTIONS:
1. When a user asks you to perform an action, USE THE AVAILABLE TOOLS immediately
2. DO NOT ask for information that you can reasonably infer or use defaults for
3. If userId is available in the context, use it automatically
4. For missing optional parameters, use sensible defaults
5. Only ask for clarification if absolutely critical information is missing
6. Be proactive and action-oriented - prefer doing over asking

Available tools: ${tools.map(t => t.function.name).join(', ')}
User ID for this session: ${userId || 'not provided'}
...`
}
```

### 2. Added Debug Logging
Added logging to help identify when tool_calls are missing:
```javascript
console.log("Has tool_calls:", !!assistantMessage.tool_calls);
console.log("Tool calls length:", assistantMessage.tool_calls?.length || 0);
```

### 3. Fixed MongoDB Deprecation Warning
Removed deprecated options from mongoose.connect():
```javascript
// Before
await mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// After
await mongoose.connect(uri);
```

## Testing
After this fix, when a user says "Create an event on September 18, 2025 at 10:00 AM", the model should:
1. ✅ Call the `googleCalendar` tool with `operation: "create"`
2. ✅ Use the userId automatically from context
3. ✅ Fill in reasonable defaults (1-hour duration, timezone, etc.)
4. ✅ Actually create the event instead of asking questions

## Key Takeaways
1. **System prompts are crucial** for function calling behavior
2. **Be explicit** about when and how to use tools
3. **Provide context** (like userId) in the system prompt
4. **Encourage action** over asking questions for better UX

## Files Modified
- ✅ `services/messageService.js` - Added system prompt and debug logging
- ✅ `config/mongo.js` - Removed deprecated mongoose options

## Expected Behavior Now
- Model should proactively call tools when user requests actions
- Model should use userId from context automatically
- Model should use sensible defaults instead of asking
- Function calling should work reliably

---
**Note**: If the model still doesn't call functions, check:
1. Is userId being passed to `processMessage()`?
2. Are the tool schemas valid?
3. Is the OpenAI model capable of function calling? (gpt-3.5-turbo or gpt-4 required)

