const instagramTool = {
  name: "generateInstagramCaption",
  description: "Generate engaging Instagram captions for posts",
  instructions: `Use this tool to create Instagram captions. Always generate:
1. Engaging captions that match the platform's style (casual, visual, hashtag-heavy)
2. Relevant hashtags (5-15 hashtags)
3. Post timing recommendations
4. Visual content suggestions
5. Engagement strategies

Instagram best practices:
- Use emojis strategically
- Include call-to-actions
- Keep captions under 2200 characters
- Use line breaks for readability
- Include location tags when relevant
- Make content shareable and relatable`,

  schema: {
    type: "function",
    function: {
      name: "generateInstagramCaption",
      description: "Generate engaging Instagram captions for posts",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "The main topic or theme of the Instagram post",
          },
          tone: {
            type: "string",
            description:
              "The tone of the caption (e.g., casual, professional, funny, inspirational)",
            enum: [
              "casual",
              "professional",
              "funny",
              "inspirational",
              "romantic",
              "adventurous",
            ],
          },
          hashtags: {
            type: "boolean",
            description: "Whether to include relevant hashtags",
          },
        },
        required: ["topic"],
      },
    },
  },

  async execute(parameters) {
    try {
      const { topic, tone = "casual", hashtags = true } = parameters;

      const caption = this.generateCaption(topic, tone);
      const generatedHashtags = hashtags ? this.generateHashtags(topic) : [];
      const timing = this.getOptimalTiming();
      const visualSuggestions = this.getVisualSuggestions(topic);
      const engagementStrategies = this.getEngagementStrategies();

      return {
        success: true,
        caption: caption,
        hashtags: generatedHashtags,
        optimal_timing: timing,
        visual_suggestions: visualSuggestions,
        engagement_strategies: engagementStrategies,
        character_count: caption.length,
        hashtag_count: generatedHashtags.length,
      };
    } catch (error) {
      console.error("Instagram tool error:", error);
      throw new Error(`Failed to generate Instagram caption: ${error.message}`);
    }
  },

  generateCaption(topic, tone) {
    const toneStyles = {
      casual: [
        "Hey there!",
        "OMG!",
        "So excited to share",
        "You guys!",
        "Quick thought:",
      ],
      professional: [
        "Excited to announce",
        "Proud to share",
        "We're thrilled to",
        "Important update:",
      ],
      funny: [
        "Plot twist:",
        "Breaking news:",
        "Hot take:",
        "Unpopular opinion:",
        "Life hack:",
      ],
      inspirational: [
        "Remember:",
        "Here's what I learned",
        "Today's reminder:",
        "Moment of truth:",
      ],
      romantic: [
        "Love this moment",
        "Feeling grateful for",
        "Blessed to have",
        "Heart full of",
      ],
      adventurous: [
        "Adventure awaits!",
        "Exploring new horizons",
        "Stepping out of comfort zone",
        "New chapter begins!",
      ],
    };

    const ctas = [
      "Drop a ❤️ if you agree!",
      "What do you think? Comment below!",
      "Save this for later!",
      "Share with someone who needs this!",
      "Follow for more tips!",
      "Tag a friend who would love this!",
    ];

    const style = toneStyles[tone] || toneStyles.casual;
    const opener = style[Math.floor(Math.random() * style.length)];

    let caption = `${opener}\n\n`;
    caption += `Today we're talking about ${topic.toLowerCase()}!\n\n`;
    caption += `Whether you're just starting out or you're a pro, this is for you.\n\n`;
    caption += `${ctas[Math.floor(Math.random() * ctas.length)]}`;

    return caption;
  },

  generateHashtags(topic) {
    const baseHashtags = [
      "#instagram",
      "#socialmedia",
      "#contentcreator",
      "#digitalmarketing",
      "#lifestyle",
    ];

    const topicHashtags = [
      `#${topic.toLowerCase().replace(/\s+/g, "")}`,
      `#${topic.toLowerCase().replace(/\s+/g, "")}tips`,
      `#${topic.toLowerCase().replace(/\s+/g, "")}community`,
      `#${topic.toLowerCase().replace(/\s+/g, "")}life`,
    ];

    const trendingHashtags = [
      "#trending",
      "#viral",
      "#fyp",
      "#explore",
      "#discover",
    ];

    return [...baseHashtags, ...topicHashtags, ...trendingHashtags];
  },

  getOptimalTiming() {
    return {
      best_days: ["Tuesday", "Wednesday", "Thursday"],
      best_times: ["9:00 AM", "12:00 PM", "3:00 PM", "7:00 PM"],
      timezone: "EST",
      frequency: "1-2 posts per day",
    };
  },

  getVisualSuggestions(topic) {
    return [
      "High-quality image with good lighting",
      "Bright, vibrant colors that pop",
      "Clean composition with clear focal point",
      "Include people or relatable elements",
      "Use natural filters for authenticity",
    ];
  },

  getEngagementStrategies() {
    return [
      "Ask questions in your caption",
      "Use location tags when relevant",
      "Tag relevant accounts or brands",
      "Create shareable content",
      "Use trending audio for reels",
      "Post at optimal times for your audience",
    ];
  },
};

module.exports = instagramTool;
