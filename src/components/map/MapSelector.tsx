"use client";

import { useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Icon, LatLng } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, Loader2 } from "lucide-react";

interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}

interface MapSelectorProps {
  onLocationSelect: (location: LocationData) => void;
}

// Fix for default marker icon in Leaflet with Next.js
const createCustomIcon = () => {
  return new Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
};

// Component to handle map clicks
function LocationMarker({
  position,
  setPosition,
}: {
  position: LatLng | null;
  setPosition: (pos: LatLng) => void;
}) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={createCustomIcon()} />
  );
}

export default function MapSelector({ onLocationSelect }: MapSelectorProps) {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Default center (can be changed based on user's approximate location)
  const defaultCenter: [number, number] = [40.7128, -74.006]; // New York

  // Handle search
  const handleSearch = async () => {
    if (searchQuery.length < 3) return;

    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  };

  // Handle selecting a search result
  const handleSelectSearchResult = async (result: any) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    const newPosition = new LatLng(lat, lon);
    setPosition(newPosition);
    setSearchResults([]);
    setSearchQuery("");

    // Reverse geocode to get detailed address
    await reverseGeocode(lat, lon);
  };

  // Reverse geocode to get address from coordinates
  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
      );
      const data = await response.json();

      const location: LocationData = {
        latitude: lat,
        longitude: lon,
        address: data.display_name || `${lat}, ${lon}`,
        city: data.address?.city || data.address?.town || data.address?.village,
        country: data.address?.country,
      };

      onLocationSelect(location);
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      // Fallback to coordinates only
      onLocationSelect({
        latitude: lat,
        longitude: lon,
        address: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      });
    }
  };

  // Handle position change from map click
  const handlePositionChange = useCallback(
    (newPosition: LatLng) => {
      setPosition(newPosition);
      reverseGeocode(newPosition.lat, newPosition.lng);
    },
    [onLocationSelect]
  );

  // Auto-detect user location
  const handleAutoDetect = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newPosition = new LatLng(latitude, longitude);
        setPosition(newPosition);
        reverseGeocode(latitude, longitude);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert(
          "Unable to retrieve your location. Please select manually on the map."
        );
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search for your farm location..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching || searchQuery.length < 3}
            className="farm-btn farm-btn-primary px-6"
          >
            {searching ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Search"
            )}
          </button>
          <button
            onClick={handleAutoDetect}
            className="farm-btn farm-btn-outline px-6 whitespace-nowrap"
          >
            📍 Auto-detect
          </button>
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => handleSelectSearchResult(result)}
                className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
              >
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                  {result.display_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {result.lat}, {result.lon}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="w-full h-[400px] rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 shadow-lg">
        <MapContainer
          center={position ? [position.lat, position.lng] : defaultCenter}
          zoom={position ? 13 : 4}
          style={{ height: "100%", width: "100%" }}
          key={position ? `${position.lat}-${position.lng}` : "default"}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker
            position={position}
            setPosition={handlePositionChange}
          />
        </MapContainer>
      </div>

      {position && (
        <div className="text-sm text-gray-600 dark:text-gray-300 text-center">
          Selected coordinates: {position.lat.toFixed(4)},{" "}
          {position.lng.toFixed(4)}
        </div>
      )}
    </div>
  );
}
