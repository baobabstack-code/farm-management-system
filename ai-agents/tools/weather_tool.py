"""
Weather Data Tool for Farm Management AI Agents
Provides current and forecast weather data for agricultural decision making
"""

import requests
import json
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import os

class WeatherTool:
    """Tool to access weather data for farming decisions"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('OPENWEATHER_API_KEY')
        self.base_url = "https://api.openweathermap.org/data/2.5"
        
    async def get_current_weather(self, location: str) -> Dict[str, Any]:
        """Get current weather conditions for a location"""
        try:
            url = f"{self.base_url}/weather"
            params = {
                'q': location,
                'appid': self.api_key,
                'units': 'metric'
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            return {
                'success': True,
                'data': {
                    'temperature': data['main']['temp'],
                    'humidity': data['main']['humidity'],
                    'pressure': data['main']['pressure'],
                    'wind_speed': data['wind']['speed'],
                    'wind_direction': data['wind'].get('deg', 0),
                    'precipitation': data.get('rain', {}).get('1h', 0),
                    'weather_condition': data['weather'][0]['main'],
                    'description': data['weather'][0]['description'],
                    'visibility': data.get('visibility', 10000),
                    'uv_index': None,  # Requires separate API call
                    'timestamp': datetime.now().isoformat()
                }
            }
        except Exception as e:
            return {
                'success': False,
                'error': f"Failed to fetch weather data: {str(e)}",
                'timestamp': datetime.now().isoformat()
            }
    
    async def get_weather_forecast(self, location: str, days: int = 5) -> Dict[str, Any]:
        """Get weather forecast for the next few days"""
        try:
            url = f"{self.base_url}/forecast"
            params = {
                'q': location,
                'appid': self.api_key,
                'units': 'metric',
                'cnt': days * 8  # 8 forecasts per day (3-hour intervals)
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            # Process forecast data into daily summaries
            daily_forecasts = []
            current_date = None
            daily_data = []
            
            for forecast in data['list']:
                forecast_date = datetime.fromtimestamp(forecast['dt']).date()
                
                if current_date != forecast_date:
                    if daily_data:
                        daily_forecasts.append(self._process_daily_forecast(daily_data))
                    current_date = forecast_date
                    daily_data = []
                
                daily_data.append(forecast)
            
            # Process the last day
            if daily_data:
                daily_forecasts.append(self._process_daily_forecast(daily_data))
            
            return {
                'success': True,
                'data': {
                    'location': data['city']['name'],
                    'country': data['city']['country'],
                    'forecasts': daily_forecasts[:days]
                },
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f"Failed to fetch forecast data: {str(e)}",
                'timestamp': datetime.now().isoformat()
            }
    
    def _process_daily_forecast(self, forecasts: list) -> Dict[str, Any]:
        """Process 3-hour forecasts into daily summary"""
        temps = [f['main']['temp'] for f in forecasts]
        humidity = [f['main']['humidity'] for f in forecasts]
        precipitation = sum([f.get('rain', {}).get('3h', 0) for f in forecasts])
        
        return {
            'date': datetime.fromtimestamp(forecasts[0]['dt']).date().isoformat(),
            'temp_min': min(temps),
            'temp_max': max(temps),
            'temp_avg': sum(temps) / len(temps),
            'humidity_avg': sum(humidity) / len(humidity),
            'precipitation_total': precipitation,
            'weather_condition': forecasts[len(forecasts)//2]['weather'][0]['main'],
            'description': forecasts[len(forecasts)//2]['weather'][0]['description'],
            'wind_speed': forecasts[len(forecasts)//2]['wind']['speed']
        }
    
    async def get_agricultural_conditions(self, location: str) -> Dict[str, Any]:
        """Get weather conditions specifically relevant for agriculture"""
        try:
            current = await self.get_current_weather(location)
            forecast = await self.get_weather_forecast(location, 7)
            
            if not current['success'] or not forecast['success']:
                return {
                    'success': False,
                    'error': 'Failed to fetch complete weather data'
                }
            
            # Analyze agricultural conditions
            conditions = self._analyze_agricultural_conditions(
                current['data'], 
                forecast['data']['forecasts']
            )
            
            return {
                'success': True,
                'data': conditions,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f"Failed to analyze agricultural conditions: {str(e)}",
                'timestamp': datetime.now().isoformat()
            }
    
    def _analyze_agricultural_conditions(self, current: Dict, forecasts: list) -> Dict[str, Any]:
        """Analyze weather data for agricultural insights"""
        
        # Calculate growing degree days (base 10°C for most crops)
        gdd_total = 0
        for forecast in forecasts:
            avg_temp = forecast['temp_avg']
            if avg_temp > 10:
                gdd_total += avg_temp - 10
        
        # Analyze precipitation patterns
        total_precipitation = sum([f['precipitation_total'] for f in forecasts])
        dry_days = len([f for f in forecasts if f['precipitation_total'] < 1])
        
        # Frost risk analysis
        frost_risk = any([f['temp_min'] < 2 for f in forecasts[:3]])  # Next 3 days
        
        # Wind conditions
        high_wind_days = len([f for f in forecasts if f['wind_speed'] > 10])
        
        return {
            'current_conditions': {
                'temperature': current['temperature'],
                'humidity': current['humidity'],
                'suitable_for_fieldwork': (
                    current['temperature'] > 5 and 
                    current['precipitation'] == 0 and 
                    current['wind_speed'] < 15
                )
            },
            'weekly_outlook': {
                'growing_degree_days': round(gdd_total, 1),
                'total_precipitation_mm': round(total_precipitation, 1),
                'dry_days': dry_days,
                'frost_risk': frost_risk,
                'high_wind_days': high_wind_days
            },
            'agricultural_recommendations': self._generate_weather_recommendations(
                current, forecasts, frost_risk, total_precipitation, dry_days
            )
        }
    
    def _generate_weather_recommendations(self, current: Dict, forecasts: list, 
                                        frost_risk: bool, total_precip: float, 
                                        dry_days: int) -> list:
        """Generate agricultural recommendations based on weather analysis"""
        recommendations = []
        
        if frost_risk:
            recommendations.append({
                'type': 'frost_warning',
                'priority': 'high',
                'message': 'Frost risk in next 3 days. Protect sensitive crops and delay planting.',
                'confidence': 0.9
            })
        
        if total_precip < 10 and dry_days > 5:
            recommendations.append({
                'type': 'irrigation',
                'priority': 'medium',
                'message': 'Low precipitation expected. Consider irrigation for water-sensitive crops.',
                'confidence': 0.8
            })
        
        if total_precip > 50:
            recommendations.append({
                'type': 'drainage',
                'priority': 'medium',
                'message': 'Heavy rainfall expected. Ensure proper field drainage and delay fieldwork.',
                'confidence': 0.8
            })
        
        if current['wind_speed'] > 15:
            recommendations.append({
                'type': 'wind_warning',
                'priority': 'medium',
                'message': 'High winds present. Avoid spraying operations and secure equipment.',
                'confidence': 0.9
            })
        
        # Optimal conditions
        if (current['temperature'] > 15 and current['temperature'] < 25 and 
            current['humidity'] < 80 and current['precipitation'] == 0):
            recommendations.append({
                'type': 'optimal_conditions',
                'priority': 'low',
                'message': 'Excellent conditions for fieldwork and crop management activities.',
                'confidence': 0.8
            })
        
        return recommendations

# Example usage and testing
if __name__ == "__main__":
    import asyncio
    
    async def test_weather_tool():
        # Note: You'll need to set OPENWEATHER_API_KEY environment variable
        weather = WeatherTool()
        
        # Test current weather
        current = await weather.get_current_weather("New York, NY")
        print("Current Weather:", json.dumps(current, indent=2))
        
        # Test agricultural conditions
        conditions = await weather.get_agricultural_conditions("New York, NY")
        print("Agricultural Conditions:", json.dumps(conditions, indent=2))
    
    # Uncomment to test (requires API key)
    # asyncio.run(test_weather_tool())