/**
 * Weather Icon Component
 * Displays weather icons using emojis based on weather codes
 */

interface WeatherIconProps {
  icon: string;
  description: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export default function WeatherIcon({
  icon,
  description,
  size = "md",
  className = "",
}: WeatherIconProps) {
  // Map icon codes to emojis
  const getWeatherEmoji = (iconCode: string): string => {
    const iconMap: Record<string, string> = {
      "01d": "☀️", // Clear sky day
      "01n": "🌙", // Clear sky night
      "02d": "🌤️", // Few clouds day
      "02n": "☁️", // Few clouds night
      "03d": "☁️", // Scattered clouds
      "03n": "☁️", // Scattered clouds
      "04d": "☁️", // Broken clouds
      "04n": "☁️", // Broken clouds
      "09d": "🌧️", // Shower rain
      "09n": "🌧️", // Shower rain
      "10d": "🌦️", // Rain day
      "10n": "🌧️", // Rain night
      "11d": "⛈️", // Thunderstorm
      "11n": "⛈️", // Thunderstorm
      "13d": "❄️", // Snow
      "13n": "❄️", // Snow
      "50d": "🌫️", // Mist
      "50n": "🌫️", // Mist
    };

    return iconMap[iconCode] || "🌤️";
  };

  const sizeClasses = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-6xl",
    xl: "text-8xl",
  };

  return (
    <div
      className={`flex items-center justify-center ${sizeClasses[size]} ${className}`}
      role="img"
      aria-label={description}
      title={description}
    >
      {getWeatherEmoji(icon)}
    </div>
  );
}
