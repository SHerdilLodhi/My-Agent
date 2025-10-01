const horoscopeTool = {
  name: "get_horoscope",
  description: "Get today's horoscope for an astrological sign.",
  instructions: `Use this tool to get horoscope predictions for users based on their astrological sign.`,

  schema: {
    type: "object",
    properties: {
      sign: {
        type: "string",
        description: "An astrological sign like Taurus or Aquarius",
      },
    },
    required: ["sign"],
  },

  async execute(parameters) {
    try {
      const { sign } = parameters;
      
      // Simple horoscope logic
      const horoscopes = {
        "aquarius": "Aquarius: Next Tuesday you will befriend a baby otter and discover a hidden talent for underwater basket weaving.",
        "pisces": "Pisces: Your intuition will guide you to a life-changing decision involving a mysterious stranger and a talking fish.",
        "aries": "Aries: Your bold nature will lead you to start a new adventure that involves fire, excitement, and possibly a dragon.",
        "taurus": "Taurus: Your practical approach will help you build something beautiful that will last for generations.",
        "gemini": "Gemini: Your dual nature will help you see both sides of an important decision that's coming your way.",
        "cancer": "Cancer: Your caring nature will be rewarded when someone you helped returns the favor in an unexpected way.",
        "leo": "Leo: Your natural leadership will shine when you're called upon to guide others through a challenging situation.",
        "virgo": "Virgo: Your attention to detail will help you solve a puzzle that has stumped everyone else.",
        "libra": "Libra: Your sense of balance will help you mediate a conflict and bring harmony to a difficult situation.",
        "scorpio": "Scorpio: Your intensity will help you uncover a secret that changes everything you thought you knew.",
        "sagittarius": "Sagittarius: Your adventurous spirit will lead you to a journey that expands your horizons beyond imagination.",
        "capricorn": "Capricorn: Your determination will help you achieve a goal that seemed impossible to others."
      };

      const signLower = sign.toLowerCase();
      const horoscope = horoscopes[signLower] || `${sign}: The stars are aligning in mysterious ways. Trust your instincts and be open to unexpected opportunities.`;

      return {
        success: true,
        operation: "get_horoscope",
        horoscope: horoscope,
        sign: sign,
        message: "Horoscope retrieved successfully"
      };
    } catch (error) {
      console.error("Horoscope tool error:", error);
      throw new Error(`Failed to get horoscope: ${error.message}`);
    }
  }
};

module.exports = horoscopeTool; 