"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EnhancedWeatherDashboard from "@/components/weather/EnhancedWeatherDashboard";
import { MapPin, Settings, Plus, Cloud, AlertTriangle } from "lucide-react";

interface LocationSettings {
  name: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export default function WeatherPage() {
  const { user, isLoaded } = useUser();
  const [locations, setLocations] = useState<LocationSettings[]>([
    {
      name: "Main Farm",
      latitude: 40.7128,
      longitude: -74.006,
      isDefault: true,
    },
  ]);
  const [currentLocation, setCurrentLocation] = useState<LocationSettings>(
    locations[0]
  );
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [newLocationData, setNewLocationData] = useState({
    name: "",
    latitude: "",
    longitude: "",
  });

  useEffect(() => {
    if (isLoaded && user) {
      // In a real app, you'd fetch user's saved locations from the database
      // For now, we'll use the default location
    }
  }, [isLoaded, user]);

  const handleAddLocation = () => {
    if (
      !newLocationData.name ||
      !newLocationData.latitude ||
      !newLocationData.longitude
    ) {
      alert("Please fill in all fields");
      return;
    }

    const newLocation: LocationSettings = {
      name: newLocationData.name,
      latitude: parseFloat(newLocationData.latitude),
      longitude: parseFloat(newLocationData.longitude),
      isDefault: false,
    };

    setLocations((prev) => [...prev, newLocation]);
    setNewLocationData({ name: "", latitude: "", longitude: "" });
    setShowLocationForm(false);
  };

  const handleSetDefault = (location: LocationSettings) => {
    setLocations((prev) =>
      prev.map((loc) => ({
        ...loc,
        isDefault: loc.name === location.name,
      }))
    );
    setCurrentLocation(location);
  };

  const handleDeleteLocation = (locationName: string) => {
    if (locations.length <= 1) {
      alert("You must have at least one location");
      return;
    }

    setLocations((prev) => {
      const updated = prev.filter((loc) => loc.name !== locationName);
      if (currentLocation.name === locationName) {
        const newDefault = updated.find((loc) => loc.isDefault) || updated[0];
        setCurrentLocation(newDefault);
      }
      return updated;
    });
  };

  const getCurrentPosition = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setNewLocationData({
            ...newLocationData,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          alert(
            "Unable to get your location. Please enter coordinates manually."
          );
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Cloud className="w-8 h-8 text-gray-400 animate-pulse mx-auto mb-4" />
            <p className="text-gray-600">Loading weather dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                Please sign in to access weather data and insights.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-gray-800 overflow-auto">
      <div className="content-container py-4 sm:py-6 lg:py-8 mobile-header-spacing">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Cloud className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Weather & Insights
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Location Selector */}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <select
                value={currentLocation.name}
                onChange={(e) => {
                  const selected = locations.find(
                    (loc) => loc.name === e.target.value
                  );
                  if (selected) setCurrentLocation(selected);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {locations.map((location) => (
                  <option key={location.name} value={location.name}>
                    {location.name} {location.isDefault ? "(Default)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowLocationForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Location
            </Button>
          </div>
        </div>

        {/* Location Management Form */}
        {showLocationForm && (
          <Card className="mb-6">
            <CardHeader>
              <h3 className="text-lg font-semibold">Add New Location</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location Name
                  </label>
                  <input
                    type="text"
                    value={newLocationData.name}
                    onChange={(e) =>
                      setNewLocationData({
                        ...newLocationData,
                        name: e.target.value,
                      })
                    }
                    placeholder="e.g., North Field"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newLocationData.latitude}
                    onChange={(e) =>
                      setNewLocationData({
                        ...newLocationData,
                        latitude: e.target.value,
                      })
                    }
                    placeholder="e.g., 40.7128"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newLocationData.longitude}
                    onChange={(e) =>
                      setNewLocationData({
                        ...newLocationData,
                        longitude: e.target.value,
                      })
                    }
                    placeholder="e.g., -74.0060"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={getCurrentPosition}
                  variant="outline"
                  size="sm"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Use My Location
                </Button>

                <div className="flex-1" />

                <Button
                  onClick={() => setShowLocationForm(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddLocation}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Add Location
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Location Management */}
        {locations.length > 1 && (
          <Card className="mb-6">
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Manage Locations
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {locations.map((location) => (
                  <div
                    key={location.name}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {location.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {location.latitude.toFixed(4)},{" "}
                          {location.longitude.toFixed(4)}
                        </p>
                      </div>
                      {location.isDefault && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          Default
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!location.isDefault && (
                        <Button
                          onClick={() => handleSetDefault(location)}
                          variant="outline"
                          size="sm"
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        onClick={() => setCurrentLocation(location)}
                        variant="outline"
                        size="sm"
                        className="bg-green-50 text-green-700 hover:bg-green-100"
                      >
                        View Weather
                      </Button>
                      {locations.length > 1 && (
                        <Button
                          onClick={() => handleDeleteLocation(location.name)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Weather Dashboard */}
        <EnhancedWeatherDashboard
          latitude={currentLocation.latitude}
          longitude={currentLocation.longitude}
          location={currentLocation.name}
        />
      </div>
    </div>
  );
}
