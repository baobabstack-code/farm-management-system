import {
  GoogleGenerativeAI,
  GenerativeModel,
  ChatSession,
} from "@google/generative-ai";

export interface GoogleAIConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
}

export interface GoogleAIResponse {
  success: boolean;
  content: string;
  model: string;
  usage?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
  error?: string;
}

export interface FarmContext {
  userId: string;
  crops: any[];
  activities: any[];
  weather?: any;
  location?: string;
}

/**
 * Google AI Service for Farm Management
 * Integrates with Google's Gemini API for intelligent farming assistance
 */
export class GoogleAIService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private config: GoogleAIConfig;

  constructor(config: GoogleAIConfig) {
    this.config = config;
    this.genAI = new GoogleGenerativeAI(config.apiKey);

    // Configure the model with farming-specific settings
    this.model = this.genAI.getGenerativeModel({
      model: config.model || "gemini-1.5-flash",
      generationConfig: {
        temperature: config.temperature || 0.7,
        topK: config.topK || 40,
        topP: config.topP || 0.95,
        maxOutputTokens: config.maxOutputTokens || 1024,
      },
      systemInstruction: this.getFarmingSystemInstruction(),
    });
  }

  /**
   * Generate a chat response with farm context
   */
  async generateChatResponse(
    message: string,
    context: FarmContext,
    conversationHistory: Array<{ role: "user" | "model"; parts: string[] }> = []
  ): Promise<GoogleAIResponse> {
    try {
      // Build context-aware prompt
      const contextualPrompt = this.buildContextualPrompt(message, context);

      // Start chat session with history
      const chat = this.model.startChat({
        history: conversationHistory.map((msg) => ({
          role: msg.role,
          parts: [{ text: msg.parts.join(" ") }],
        })),
      });

      // Generate response
      const result = await chat.sendMessage(contextualPrompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        content: text,
        model: this.config.model || "gemini-1.5-flash",
        usage: {
          promptTokenCount: result.response.usageMetadata?.promptTokenCount,
          candidatesTokenCount:
            result.response.usageMetadata?.candidatesTokenCount,
          totalTokenCount: result.response.usageMetadata?.totalTokenCount,
        },
      };
    } catch (error: any) {
      console.error("Google AI API Error:", error);

      // Handle specific error types
      if (error?.message?.includes("API_KEY")) {
        return {
          success: false,
          content: "",
          model: this.config.model || "gemini-1.5-flash",
          error: "Invalid or missing Google AI API key",
        };
      }

      if (error?.message?.includes("RATE_LIMIT")) {
        return {
          success: false,
          content: "",
          model: this.config.model || "gemini-1.5-flash",
          error: "Rate limit exceeded. Please try again later.",
        };
      }

      return {
        success: false,
        content: "",
        model: this.config.model || "gemini-1.5-flash",
        error: error?.message || "Unknown Google AI API error",
      };
    }
  }

  /**
   * Generate insights for analytics
   */
  async generateInsights(
    context: FarmContext,
    analysisType: "crop" | "financial" | "weather" | "general"
  ): Promise<GoogleAIResponse> {
    try {
      const prompt = this.buildInsightsPrompt(context, analysisType);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        content: text,
        model: this.config.model || "gemini-1.5-flash",
        usage: {
          promptTokenCount: result.response.usageMetadata?.promptTokenCount,
          candidatesTokenCount:
            result.response.usageMetadata?.candidatesTokenCount,
          totalTokenCount: result.response.usageMetadata?.totalTokenCount,
        },
      };
    } catch (error: any) {
      console.error("Google AI Insights Error:", error);
      return {
        success: false,
        content: "",
        model: this.config.model || "gemini-1.5-flash",
        error: error?.message || "Failed to generate insights",
      };
    }
  }

  /**
   * Build contextual prompt for chat responses
   */
  private buildContextualPrompt(message: string, context: FarmContext): string {
    const { crops, activities, weather, location } = context;

    const contextParts = [];

    // Add crop information
    if (crops && crops.length > 0) {
      const cropSummary = this.summarizeCrops(crops);
      contextParts.push(`CURRENT CROPS:\n${cropSummary}`);
    }

    // Add recent activities
    if (activities && activities.length > 0) {
      const activitySummary = this.summarizeActivities(activities);
      contextParts.push(`RECENT ACTIVITIES:\n${activitySummary}`);
    }

    // Add weather information
    if (weather) {
      const weatherSummary = this.summarizeWeather(weather);
      contextParts.push(`WEATHER CONTEXT:\n${weatherSummary}`);
    }

    // Add location if available
    if (location) {
      contextParts.push(`LOCATION: ${location}`);
    }

    const contextSection =
      contextParts.length > 0
        ? `FARM CONTEXT:\n${contextParts.join("\n\n")}\n\n`
        : "";

    return `${contextSection}FARMER QUESTION: ${message}

Please provide a helpful, specific, and actionable response based on the farm context above. If you need more information to give a complete answer, ask specific follow-up questions.`;
  }

  /**
   * Build prompt for generating insights
   */
  private buildInsightsPrompt(
    context: FarmContext,
    analysisType: string
  ): string {
    const { crops, activities, weather, location } = context;

    let analysisInstructions = "";
    switch (analysisType) {
      case "crop":
        analysisInstructions =
          "Analyze the crop data and provide insights about plant health, growth stages, harvest timing, and care recommendations.";
        break;
      case "financial":
        analysisInstructions =
          "Analyze the financial activities and provide insights about costs, revenue trends, ROI, and optimization opportunities.";
        break;
      case "weather":
        analysisInstructions =
          "Analyze the weather data in relation to farming activities and provide insights about optimal timing for farming tasks.";
        break;
      default:
        analysisInstructions =
          "Provide general farming insights and recommendations based on all available data.";
    }

    return `As an expert farming AI assistant, ${analysisInstructions}

FARM DATA:
Crops: ${JSON.stringify(crops, null, 2)}
Activities: ${JSON.stringify(activities, null, 2)}
Weather: ${JSON.stringify(weather, null, 2)}
Location: ${location || "Not specified"}

Please provide specific, actionable insights in a structured format with:
1. Key observations
2. Recommendations
3. Potential issues to watch for
4. Next steps

Keep the response concise but informative.`;
  }

  /**
   * Get system instruction for farming context
   */
  private getFarmingSystemInstruction(): string {
    return `You are an expert AI farming assistant with deep knowledge of:
- Crop cultivation, plant biology, and agricultural best practices
- Sustainable farming techniques and organic methods
- Pest and disease management
- Irrigation and water management
- Soil health and fertilization
- Weather patterns and seasonal planning
- Farm economics and cost optimization
- Harvest timing and post-harvest handling

Always provide:
- Practical, actionable advice
- Safety considerations when relevant
- Environmentally sustainable recommendations
- Cost-effective solutions
- Clear explanations suitable for farmers of all experience levels

When uncertain, ask clarifying questions rather than guessing.
Focus on solutions that improve crop yield, reduce costs, and promote sustainable farming practices.`;
  }

  /**
   * Summarize crop data for context
   */
  private summarizeCrops(crops: any[]): string {
    if (!crops || crops.length === 0) return "No crops currently tracked.";

    const summary = crops
      .map((crop) => {
        const plantingDate = new Date(crop.plantingDate);
        const harvestDate = new Date(crop.expectedHarvestDate);
        const daysToHarvest = Math.ceil(
          (harvestDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        return `- ${crop.name} (${crop.variety || "standard variety"}): planted ${plantingDate.toLocaleDateString()}, harvest ${daysToHarvest > 0 ? `in ${daysToHarvest} days` : `overdue by ${Math.abs(daysToHarvest)} days`}, status: ${crop.status}`;
      })
      .join("\n");

    return `Total crops: ${crops.length}\n${summary}`;
  }

  /**
   * Summarize recent activities
   */
  private summarizeActivities(activities: any[]): string {
    if (!activities || activities.length === 0)
      return "No recent activities logged.";

    const recent = activities
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 10);

    const summary = recent
      .map((activity) => {
        const date = new Date(activity.createdAt).toLocaleDateString();
        const cost = activity.cost ? ` ($${activity.cost})` : "";
        const yield_ = activity.yield ? ` (${activity.yield} kg)` : "";

        return `- ${date}: ${activity.type}${cost}${yield_}${activity.notes ? ` - ${activity.notes}` : ""}`;
      })
      .join("\n");

    return `Recent activities (last 10):\n${summary}`;
  }

  /**
   * Summarize weather information
   */
  private summarizeWeather(weather: any): string {
    if (!weather) return "No weather data available.";

    return `Temperature: ${weather.temperature}°C, Humidity: ${weather.humidity}%, Conditions: ${weather.description}, Wind: ${weather.windSpeed} km/h`;
  }
}

/**
 * Factory function to create Google AI service instance
 */
export function createGoogleAIService(): GoogleAIService | null {
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    console.warn("Google AI API key not configured");
    return null;
  }

  return new GoogleAIService({
    apiKey,
    model: process.env.GOOGLE_AI_MODEL || "gemini-1.5-flash",
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 1024,
  });
}
