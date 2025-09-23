"""
Simple Analytics Agent - First AI agent for the farming app
This agent provides read-only analytics without disrupting existing functionality
"""

from google.ai.adk import Agent, Tool
import requests
import json
from typing import Dict, Any

class FarmDataTool(Tool):
    """Tool to access existing farm data via bridge API"""
    
    def __init__(self, api_base_url: str, api_key: str):
        self.api_base_url = api_base_url
        self.api_key = api_key
    
    def get_crop_summary(self, user_id: str) -> Dict[str, Any]:
        """Get crop data summary from existing system"""
        try:
            response = requests.get(
                f"{self.api_base_url}/api/ai-bridge/crops",
                headers={"Authorization": f"Bearer {self.api_key}"},
                params={"userId": user_id}
            )
            return response.json()
        except Exception as e:
            return {"error": str(e), "success": False}
    
    def get_financial_summary(self, user_id: str) -> Dict[str, Any]:
        """Get financial data summary from existing system"""
        try:
            response = requests.get(
                f"{self.api_base_url}/api/ai-bridge/financial",
                headers={"Authorization": f"Bearer {self.api_key}"},
                params={"userId": user_id}
            )
            return response.json()
        except Exception as e:
            return {"error": str(e), "success": False}

class SimpleAnalyticsAgent(Agent):
    """
    A simple analytics agent that provides insights without modifying data
    """
    
    def __init__(self):
        super().__init__(
            name="FarmAnalyticsAgent",
            description="Provides analytical insights about farm performance and trends"
        )
        
        # Initialize tools
        self.farm_data_tool = FarmDataTool(
            api_base_url="https://your-app-url.vercel.app",
            api_key="your-api-key"  # In production, use secure key management
        )
    
    async def process_request(self, user_input: str, user_id: str) -> str:
        """
        Process user requests for farm analytics
        """
        
        # Get data from existing system (read-only)
        crop_data = self.farm_data_tool.get_crop_summary(user_id)
        financial_data = self.farm_data_tool.get_financial_summary(user_id)
        
        if not crop_data.get("success") or not financial_data.get("success"):
            return "I'm having trouble accessing your farm data right now. Please try again later."
        
        # Simple analysis using the data
        crops = crop_data.get("data", [])
        activities = financial_data.get("data", [])
        
        # Generate insights
        insights = self._generate_insights(crops, activities)
        
        return self._format_response(insights)
    
    def _generate_insights(self, crops, activities):
        """Generate simple insights from the data"""
        insights = {
            "total_crops": len(crops),
            "active_crops": len([c for c in crops if c.get("status") == "GROWING"]),
            "total_activities": len(activities),
            "recent_costs": sum([a.get("cost", 0) for a in activities[-10:]]),  # Last 10 activities
        }
        
        # Add trend analysis
        if activities:
            monthly_costs = {}
            for activity in activities:
                month = activity.get("createdAt", "")[:7]  # YYYY-MM format
                monthly_costs[month] = monthly_costs.get(month, 0) + activity.get("cost", 0)
            
            insights["monthly_trends"] = monthly_costs
        
        return insights
    
    def _format_response(self, insights):
        """Format insights into a user-friendly response"""
        response = f"""
📊 **Farm Analytics Summary**

🌱 **Crops Overview:**
- Total crops: {insights['total_crops']}
- Currently growing: {insights['active_crops']}

💰 **Financial Insights:**
- Total activities recorded: {insights['total_activities']}
- Recent costs (last 10 activities): ${insights['recent_costs']:.2f}

📈 **Trends:**
"""
        
        if "monthly_trends" in insights:
            for month, cost in list(insights["monthly_trends"].items())[-3:]:  # Last 3 months
                response += f"- {month}: ${cost:.2f}\n"
        
        response += "\n💡 This is an AI-generated summary based on your current farm data."
        
        return response

# Example usage
if __name__ == "__main__":
    agent = SimpleAnalyticsAgent()
    # This would be called from your web app
    # result = await agent.process_request("Show me my farm summary", "user123")
    # print(result)