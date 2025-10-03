import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { AIDataBridge } from "@/lib/ai-bridge/data-access";
import { weatherService } from "@/lib/services/weather";
import { getChatResponseFromADK } from "@/lib/ai/agents";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

/**
 * AI Chat Assistant API
 * Processes natural language queries with farm context
 */
export async function POST(request: NextRequest) {
  try {
    // Check if AI chat is enabled
    if (!isFeatureEnabled("aiChatAssistant") && !true) {
      // Enable for development
      return NextResponse.json(
        { error: "AI chat feature is not enabled" },
        { status: 403 }
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, conversationHistory } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Get farm context data
    const [cropData, financialData] = await Promise.all([
      AIDataBridge.getCropData(userId),
      AIDataBridge.getFinancialSummary(userId),
    ]);

    const context = {
      crops: (cropData.success ? cropData.data : []) || [],
      activities: (financialData.success ? financialData.data : []) || [],
      conversationHistory: conversationHistory || [],
    };

    let response: string;

    // If ADK chat is enabled, prefer the ADK agent
    if (
      isFeatureEnabled("aiAdkChat") ||
      process.env.AI_ADK_ENABLED === "true"
    ) {
      const adkResult = await getChatResponseFromADK({
        userId,
        message,
        conversationHistory: (context.conversationHistory || []).map(
          (m: any) => ({ role: m.role, content: m.content })
        ),
        crops: context.crops || [],
        activities: context.activities || [],
      });

      if (adkResult.success) {
        response = adkResult.content;
        return NextResponse.json({
          success: true,
          response,
          timestamp: new Date().toISOString(),
          source: "ai-chat-assistant-adk",
          model: adkResult.model,
        });
      }
      // If ADK fails, fall back to the rule-based responder below
      console.warn("ADK chat fallback:", adkResult.error);
    }

    // Fallback: Generate response based on the message content using built-in heuristics
    response = await generateChatResponse(message, context);

    return NextResponse.json({
      success: true,
      response,
      timestamp: new Date().toISOString(),
      source: "ai-chat-assistant",
    });
  } catch (error) {
    console.error("AI Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}

interface FarmContext {
  crops: any[];
  activities: any[];
  conversationHistory: ChatMessage[];
}

async function generateChatResponse(
  message: string,
  context: FarmContext
): Promise<string> {
  const { crops, activities } = context;
  const messageLC = message.toLowerCase();

  // Weather-related queries
  if (messageLC.includes("weather")) {
    return handleWeatherQuery(messageLC);
  }

  // Crop-related queries
  if (
    messageLC.includes("crop") ||
    messageLC.includes("plant") ||
    messageLC.includes("grow")
  ) {
    return handleCropQuery(messageLC, crops);
  }

  // Harvest-related queries
  if (messageLC.includes("harvest") || messageLC.includes("ready")) {
    return handleHarvestQuery(crops);
  }

  // Watering/irrigation queries
  if (messageLC.includes("water") || messageLC.includes("irrigat")) {
    return handleWateringQuery(messageLC, crops, activities);
  }

  // Cost/financial queries
  if (
    messageLC.includes("cost") ||
    messageLC.includes("money") ||
    messageLC.includes("expense") ||
    messageLC.includes("budget")
  ) {
    return handleFinancialQuery(activities);
  }

  // Pest/disease queries
  if (
    messageLC.includes("pest") ||
    messageLC.includes("disease") ||
    messageLC.includes("bug") ||
    messageLC.includes("sick")
  ) {
    return handlePestDiseaseQuery(crops);
  }

  // Best practices queries
  if (
    messageLC.includes("best practice") ||
    messageLC.includes("tip") ||
    messageLC.includes("advice") ||
    messageLC.includes("recommend")
  ) {
    return handleBestPracticesQuery(crops);
  }

  // General/greeting queries
  if (
    messageLC.includes("hello") ||
    messageLC.includes("hi") ||
    messageLC.includes("help")
  ) {
    return handleGreetingQuery(crops.length);
  }

  // Task/activity queries
  if (
    messageLC.includes("task") ||
    messageLC.includes("todo") ||
    messageLC.includes("should do")
  ) {
    return handleTaskQuery(crops);
  }

  // Default response with farm overview
  return generateFarmOverviewResponse(crops, activities);
}

function handleWeatherQuery(query: string): string {
  // Use mock weather data for now - can be enhanced with real weather API
  const responses = [
    "🌤️ Today's weather looks good for most farming activities. Temperature is mild with moderate humidity - perfect for outdoor work!\n\nRecommendations:\n• Good day for planting or transplanting\n• Ideal conditions for applying treatments\n• Consider watering early morning or evening",

    "🌧️ There's a chance of rain today, which means:\n\n• Skip irrigation - let nature do the work!\n• Great time for indoor planning tasks\n• Prepare drainage if heavy rain expected\n• Check that tall plants are properly staked",

    "☀️ Sunny and warm conditions today!\n\n• Perfect for photosynthesis and growth\n• Ensure adequate watering, especially for young plants\n• Consider shade protection for sensitive crops\n• Great day for harvesting",
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

function handleCropQuery(query: string, crops: any[]): string {
  if (crops.length === 0) {
    return "🌱 I see you haven't added any crops yet! Here's how to get started:\n\n1. Click 'Manage Crops' on your dashboard\n2. Add your first crop with planting details\n3. I'll then be able to provide specific advice for your plants\n\n**Popular starter crops:** Tomatoes, lettuce, herbs, peppers - these are great for beginners!";
  }

  const totalCrops = crops.length;
  const cropTypes = [...new Set(crops.map((crop) => crop.name))];
  const recentCrops = crops.filter((crop) => {
    const plantingDate = new Date(crop.plantingDate);
    const daysSincePlanting = Math.floor(
      (Date.now() - plantingDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSincePlanting <= 30;
  });

  return `🌾 **Your Crop Overview:**\n\n• **Total crops:** ${totalCrops}\n• **Varieties:** ${cropTypes.join(", ")}\n• **Recently planted:** ${recentCrops.length} crop(s)\n\n**Growing Tips:**\n• Monitor your ${cropTypes[0]} for optimal growth conditions\n• Consider succession planting for continuous harvest\n• Rotate crop locations to maintain soil health\n\nWhat specific aspect would you like help with?`;
}

function handleHarvestQuery(crops: any[]): string {
  if (crops.length === 0) {
    return "🌾 You don't have any crops tracked yet. Add some crops first, and I'll help you plan your harvests!";
  }

  const now = new Date();
  const harvestReady = crops.filter((crop) => {
    const harvestDate = new Date(crop.expectedHarvestDate);
    const daysUntil = Math.ceil(
      (harvestDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntil <= 7 && daysUntil >= 0 && crop.status !== "HARVESTED";
  });

  const overdue = crops.filter((crop) => {
    const harvestDate = new Date(crop.expectedHarvestDate);
    return harvestDate < now && crop.status !== "HARVESTED";
  });

  if (harvestReady.length > 0 || overdue.length > 0) {
    let response = "🌾 **Harvest Status Update:**\n\n";

    if (overdue.length > 0) {
      response += `**⚠️ Overdue for harvest:**\n${overdue.map((crop) => `• ${crop.name} - harvest ASAP for best quality`).join("\n")}\n\n`;
    }

    if (harvestReady.length > 0) {
      response += `**✅ Ready within 7 days:**\n${harvestReady
        .map((crop) => {
          const daysUntil = Math.ceil(
            (new Date(crop.expectedHarvestDate).getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24)
          );
          return `• ${crop.name} - in ${daysUntil} day(s)`;
        })
        .join("\n")}\n\n`;
    }

    response +=
      "**Harvest Tips:**\n• Harvest in early morning when plants are hydrated\n• Use clean, sharp tools to prevent damage\n• Handle produce gently to avoid bruising";

    return response;
  }

  return (
    "🌾 **Harvest Status:** No crops are ready for immediate harvest.\n\n**Upcoming harvests:**\n" +
    crops
      .map((crop) => {
        const daysUntil = Math.ceil(
          (new Date(crop.expectedHarvestDate).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        return `• ${crop.name}: ${daysUntil > 0 ? `in ${daysUntil} days` : "overdue"}`;
      })
      .join("\n")
  );
}

function handleWateringQuery(
  query: string,
  crops: any[],
  activities: any[]
): string {
  const recentIrrigation = activities.filter(
    (activity) =>
      activity.type === "IRRIGATION" &&
      new Date(activity.createdAt) >
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );

  const response = "💧 **Watering Guidelines:**\n\n";

  if (recentIrrigation.length === 0) {
    return (
      response +
      "**⚠️ No recent irrigation recorded**\n\n" +
      "**General watering tips:**\n" +
      "• Water early morning (6-8 AM) or evening (6-8 PM)\n" +
      "• Check soil moisture 2-3 inches deep\n" +
      "• Deep, infrequent watering is usually better than frequent shallow watering\n" +
      "• Different crops have different water needs\n\n" +
      "💡 **Pro tip:** Start logging your irrigation activities to get personalized watering schedules!"
    );
  }

  return (
    response +
    `**Recent irrigation:** ${recentIrrigation.length} session(s) this week\n\n` +
    "**Today's watering advice:**\n" +
    "• Check soil moisture before watering\n" +
    "• Focus on newly planted crops and containers\n" +
    "• Adjust based on weather conditions\n" +
    "• Consider mulching to retain moisture"
  );
}

function handleFinancialQuery(activities: any[]): string {
  if (activities.length === 0) {
    return (
      "💰 **Financial Tracking:** No activities recorded yet.\n\n" +
      "Start tracking your farm expenses and activities to get insights on:\n" +
      "• Cost per crop analysis\n" +
      "• Monthly spending trends\n" +
      "• ROI calculations\n" +
      "• Budget optimization suggestions"
    );
  }

  const totalCost = activities.reduce(
    (sum, activity) => sum + (activity.cost || 0),
    0
  );
  const monthlyAvg = totalCost / Math.max(1, Math.ceil(activities.length / 10)); // Rough monthly estimate

  const costByType = activities.reduce((acc: any, activity) => {
    acc[activity.type] = (acc[activity.type] || 0) + (activity.cost || 0);
    return acc;
  }, {});

  const highestCost = Object.entries(costByType).sort(
    ([, a]: any, [, b]: any) => b - a
  )[0];

  return (
    `💰 **Financial Overview:**\n\n` +
    `• **Total tracked costs:** $${totalCost.toFixed(2)}\n` +
    `• **Average monthly:** $${monthlyAvg.toFixed(2)}\n` +
    `• **Highest category:** ${highestCost ? `${highestCost[0]} ($${(highestCost[1] as number).toFixed(2)})` : "N/A"}\n\n` +
    `**Cost Optimization Tips:**\n` +
    `• Consider bulk purchasing for frequently used items\n` +
    `• Track ROI by comparing costs to harvest yields\n` +
    `• Look for seasonal discounts on supplies`
  );
}

function handlePestDiseaseQuery(crops: any[]): string {
  return (
    "🐛 **Pest & Disease Management:**\n\n" +
    "**Prevention is key:**\n" +
    "• Regular crop inspection (check undersides of leaves)\n" +
    "• Maintain proper spacing for air circulation\n" +
    "• Remove dead or diseased plant material promptly\n" +
    "• Encourage beneficial insects with diverse plantings\n\n" +
    "**Common signs to watch for:**\n" +
    "• Holes in leaves (caterpillars, beetles)\n" +
    "• Yellowing or wilting (root problems, diseases)\n" +
    "• White powdery coating (powdery mildew)\n" +
    "• Sticky honeydew (aphids)\n\n" +
    "💡 **Organic solutions:** Neem oil, insecticidal soap, companion planting, and beneficial insect habitats are effective first lines of defense."
  );
}

function handleBestPracticesQuery(crops: any[]): string {
  const season = getCurrentSeason();

  return (
    `🌟 **Best Practices for ${season}:**\n\n` +
    "**Daily habits:**\n" +
    "• Morning crop inspection walk\n" +
    "• Check soil moisture regularly\n" +
    "• Document observations and activities\n\n" +
    "**Weekly tasks:**\n" +
    "• Deep watering session\n" +
    "• Weed management\n" +
    "• Harvest ready produce\n\n" +
    "**Monthly planning:**\n" +
    "• Review crop performance\n" +
    "• Plan succession plantings\n" +
    "• Soil health assessment\n\n" +
    `**${season}-specific tips:**\n` +
    getSeasonalTips(season)
  );
}

function handleGreetingQuery(cropCount: number): string {
  const greetings = [
    "👋 Hello! I'm here to help with all your farming questions.",
    "🌱 Hi there! Ready to grow something amazing today?",
    "🚜 Hey! Let's make your farm thrive together.",
  ];

  const greeting = greetings[Math.floor(Math.random() * greetings.length)];

  return (
    `${greeting}\n\n` +
    `I can help you with:\n` +
    `• Weather and growing conditions\n` +
    `• Crop management and care tips\n` +
    `• Harvest timing and techniques\n` +
    `• Pest and disease prevention\n` +
    `• Cost tracking and optimization\n` +
    `• Best practices and planning\n\n` +
    (cropCount > 0
      ? `You have ${cropCount} crop(s) being tracked. What would you like to know about them?`
      : `Start by adding your first crop, and I'll provide personalized advice!`)
  );
}

function handleTaskQuery(crops: any[]): string {
  const tasks = [];
  const now = new Date();

  // Check for overdue harvests
  const overdueHarvests = crops.filter((crop) => {
    const harvestDate = new Date(crop.expectedHarvestDate);
    return harvestDate < now && crop.status !== "HARVESTED";
  });

  if (overdueHarvests.length > 0) {
    tasks.push(
      `🌾 **Urgent:** Harvest ${overdueHarvests.map((c) => c.name).join(", ")} - overdue!`
    );
  }

  // Add general daily tasks
  tasks.push("🔍 **Daily:** Morning crop inspection");
  tasks.push("💧 **Daily:** Check soil moisture levels");
  tasks.push("📝 **Daily:** Log any observations or activities");

  if (getCurrentSeason() === "spring" || getCurrentSeason() === "summer") {
    tasks.push("🌿 **Weekly:** Weed management");
    tasks.push("✂️ **Weekly:** Pruning and deadheading");
  }

  return (
    `📋 **Recommended Tasks:**\n\n${tasks.join("\n")}\n\n` +
    `💡 Use the "View Tasks" button on your dashboard to create and track specific tasks!`
  );
}

function generateFarmOverviewResponse(crops: any[], activities: any[]): string {
  return (
    `🚜 **Farm Overview:**\n\n` +
    `• **Crops tracked:** ${crops.length}\n` +
    `• **Activities logged:** ${activities.length}\n` +
    `• **Season:** ${getCurrentSeason()}\n\n` +
    `I'm here to help with specific questions about:\n` +
    `• Crop care and management\n` +
    `• Weather and growing conditions\n` +
    `• Harvest planning\n` +
    `• Cost analysis\n` +
    `• Best practices\n\n` +
    `What would you like to know more about?`
  );
}

function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "Spring";
  if (month >= 5 && month <= 7) return "Summer";
  if (month >= 8 && month <= 10) return "Fall";
  return "Winter";
}

function getSeasonalTips(season: string): string {
  const tips: Record<string, string> = {
    Spring:
      "• Start warm-season crops indoors\n• Prepare beds with compost\n• Begin pest monitoring",
    Summer:
      "• Consistent watering schedule\n• Harvest regularly to encourage production\n• Provide shade for sensitive crops",
    Fall: "• Plant cool-season crops\n• Collect and save seeds\n• Prepare for winter storage",
    Winter:
      "• Plan next year's garden\n• Maintain tools and equipment\n• Study seed catalogs",
  };
  return tips[season] || "• Adapt practices to current conditions";
}
