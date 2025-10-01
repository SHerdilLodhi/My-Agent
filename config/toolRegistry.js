const fs = require('fs');
const path = require('path');

// Function-based tool registry
const tools = new Map();

function registerTool(tool) {
  const validations = [
    { condition: !tool?.name, message: "Tool must have a name" },
    { condition: !tool?.description, message: "Tool must have a description" },
    { condition: !tool?.schema, message: "Tool must have a schema" },
    { condition: !tool?.execute, message: "Tool must have an execute function" },
    { condition: typeof tool?.schema !== 'object' || !tool?.schema?.type, message: `Tool ${tool?.name || 'unknown'} has invalid schema structure` }
  ];

  for (const { condition, message } of validations) {
    if (condition) throw new Error(message);
  }
  
  tools.set(tool.name, tool);
  console.log(`Tool registered: ${tool.name}`);
}

function getAvailableTools() {
  return Array.from(tools.values());
}

function loadToolsFromDirectory(dirPath) {
  try {
    const files = fs.readdirSync(dirPath);
    const jsFiles = files.filter(file => file.endsWith('.js'));
    
    jsFiles.forEach(file => {
      try {
        const toolPath = path.join(dirPath, file);
        const tool = require(toolPath);
        registerTool(tool);
      } catch (error) {
        console.warn(`Failed to load tool from ${file}:`, error.message);
      }
    });
  } catch (error) {
    console.warn(`Failed to read directory ${dirPath}:`, error.message);
  }
}

function discoverToolDirectories() {
  const toolsBasePath = path.join(__dirname, '../tools');
  
  try {
    const items = fs.readdirSync(toolsBasePath, { withFileTypes: true });
    const directories = items
      .filter(item => item.isDirectory())
      .map(item => path.join(toolsBasePath, item.name));
    
    console.log(`Discovered tool directories: ${directories.map(dir => path.basename(dir)).join(', ')}`);
    return directories;
  } catch (error) {
    console.warn(`Failed to read tools directory:`, error.message);
    return [];
  }
}

function initializeTools() {
  try {
    // Automatically discover all tool directories (folders)
    const toolDirectories = discoverToolDirectories();

    // Load tools from all discovered directories
    toolDirectories.forEach(dir => {
      console.log(`Loading tools from: ${path.basename(dir)}`);
      loadToolsFromDirectory(dir);
    });
    
    console.log(`Total tools registered: ${tools.size}`);
    
    // Debug: Log tool structure
    tools.forEach((tool, name) => {
      console.log(`Tool ${name} structure:`, {
        hasName: !!tool.name,
        hasDescription: !!tool.description,
        hasSchema: !!tool.schema,
        hasExecute: !!tool.execute,
        schemaType: typeof tool.schema,
        schemaValid: tool.schema && tool.schema.type === 'object'
      });
    });
  } catch (error) {
    console.error("Error initializing tools:", error);
  }
}

// Initialize tools immediately
initializeTools();

module.exports = {
  registerTool,
  getAvailableTools,
  initializeTools
};
