const weatherTool = {
  name: "getWeather",
  description: "Get current weather information for a specific location.",
  instructions: `Use this tool to get weather information for users based on their location.`,

  schema: {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: "The city or location to get weather for (e.g., 'New York', 'London', 'Tokyo')",
      },
      units: {
        type: "string",
        enum: ["celsius", "fahrenheit"],
        description: "Temperature units (default: celsius)",
        default: "celsius"
      }
    },
    required: ["location"]
  },

  async execute(parameters) {
    try {
      const { location, units = "celsius" } = parameters;
      
      // Mock weather data for testing
      const mockWeatherData = {
        location: location,
        temperature: units === "fahrenheit" ? "72°F" : "22°C",
        condition: "Partly cloudy",
        humidity: "65%",
        windSpeed: "10 mph",
        description: `The weather in ${location} is partly cloudy with a temperature of ${units === "fahrenheit" ? "72°F" : "22°C"}.`
      };

      return {
        success: true,
        operation: "getWeather",
        weather: mockWeatherData,
        location: location,
        units: units,
        message: "Weather information retrieved successfully"
      };
    } catch (error) {
      console.error("Weather tool error:", error);
      throw new Error(`Failed to get weather: ${error.message}`);
    }
  }
};

module.exports = weatherTool;
