// Simple script to check AI feature status
// Run with: node scripts/check-ai-status.js

console.log("🤖 AI Features Status Check");
console.log("============================");

const envVars = [
  "ENABLE_AI_ANALYTICS",
  "ENABLE_AI_CROP_RECOMMENDATIONS",
  "ENABLE_AI_FINANCIAL_INSIGHTS",
  "ENABLE_AI_PEST_DETECTION",
  "ENABLE_AI_IRRIGATION",
  "ENABLE_AI_CHAT_ASSISTANT",
  "WEATHER_API_KEY",
];

envVars.forEach((varName) => {
  const value = process.env[varName];
  const status =
    value === "true"
      ? "✅ ENABLED"
      : value === "false"
        ? "❌ DISABLED"
        : value
          ? `⚙️  SET: ${value}`
          : "⚪ NOT SET";
  console.log(`${varName}: ${status}`);
});

console.log("\n🌐 Expected URLs:");
console.log("- Dashboard: http://localhost:3001/dashboard");
console.log("- AI Analytics API: http://localhost:3001/api/ai/analytics");
console.log(
  "- Weather Insights API: http://localhost:3001/api/ai/weather-insights"
);
console.log("- AI Bridge Crops: http://localhost:3001/api/ai-bridge/crops");
console.log(
  "- AI Bridge Financial: http://localhost:3001/api/ai-bridge/financial"
);

console.log("\n💡 Tips:");
console.log(
  "1. Make sure you have crops and activities in your database for better AI insights"
);
console.log(
  "2. The Weather Insights will request location permission or use default location"
);
console.log("3. Refresh the dashboard page to see the AI components");
console.log("4. Check browser console for any errors");
