"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EnhancedWeatherDashboard from "@/components/weather/EnhancedWeatherDashboard";
import {
  PageHeader,
  FarmCard,
  FarmCardHeader,
  FarmCardContent,
  FarmButton,
  LoadingState,
  EmptyState,
} from "@/components/ui/farm-theme";
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

    setLocations([...locations, newLocation]);
    setNewLocationData({ name: "", latitude: "", longitude: "" });
    setShowLocationForm(false);
  };

  const handleSetDefault = (location: LocationSettings) => {
    setLocations(
      locations.map((loc) => ({
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
    return <LoadingState message="Loading weather dashboard..." />;
  }

  if (!user) {
    return (
      <div className="page-container">
        <div className="content-container padding-responsive-lg mobile-header-spacing content-spacing">
          <PageHeader
            title="Weather & Insights"
            description="Monitor weather conditions and get farming insights"
            icon={<Cloud className="w-6 h-6" />}
          />
          <div className="farm-card border-warning/20 bg-warning/5">
            <div className="flex-center gap-content padding-responsive">
              <div className="flex-center w-10 h-10 bg-warning/10 rounded-full">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1">
                <span className="text-warning font-medium">
                  Authentication Required
                </span>
                <p className="text-sm mt-1 text-muted-foreground">
                  Please sign in to access weather data and insights.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="content-container padding-responsive-lg mobile-header-spacing content-spacing">
        <PageHeader
          title="Weather & Insights"
          description="Monitor weather conditions and get farming insights"
          icon={<Cloud className="w-6 h-6" />}
          actions={
            <div className="flex items-center gap-3">
              {/* Location Selector */}
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <select
                  value={currentLocation.name}
                  onChange={(e) => {
                    const selected = locations.find(
                      (loc) => loc.name === e.target.value
                    );
                    if (selected) setCurrentLocation(selected);
                  }}
                  className="farm-input min-w-[150px]"
                >
                  {locations.map((location) => (
                    <option key={location.name} value={location.name}>
                      {location.name} {location.isDefault ? "(Default)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <FarmButton
                variant="outline"
                onClick={() => setShowLocationForm(true)}
              >
                <Plus className="w-4 h-4" />
                Add Location
              </FarmButton>
            </div>
          }
        />

        {/* Add Location Form */}
        {showLocationForm && (
          <FarmCard>
            <FarmCardHeader
              title="Add New Location"
              description="Add a new farm location for weather monitoring"
            />
            <FarmCardContent>
              <div className="farm-form">
                <div className="farm-grid grid-cols-1 md:grid-cols-2">
                  <div>
                    <label className="farm-label">Location Name *</label>
                    <input
                      type="text"
                      required
                      value={newLocationData.name}
                      onChange={(e) =>
                        setNewLocationData({
                          ...newLocationData,
                          name: e.target.value,
                        })
                      }
                      placeholder="e.g., North Field"
                      className="farm-input"
                    />
                  </div>
                  <div>
                    <label className="farm-label">Latitude *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newLocationData.latitude}
                      onChange={(e) =>
                        setNewLocationData({
                          ...newLocationData,
                          latitude: e.target.value,
                        })
                      }
                      placeholder="e.g., 40.7128"
                      className="farm-input"
                    />
                  </div>
                  <div>
                    <label className="farm-label">Longitude *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newLocationData.longitude}
                      onChange={(e) =>
                        setNewLocationData({
                          ...newLocationData,
                          longitude: e.target.value,
                        })
                      }
                      placeholder="e.g., -74.0060"
                      className="farm-input"
                    />
                  </div>
                </div>

                <div className="action-buttons">
                  <FarmButton onClick={getCurrentPosition} variant="outline">
                    <MapPin className="w-4 h-4" />
                    Use My Location
                  </FarmButton>
                  <div className="flex-1" />
                  <FarmButton
                    onClick={() => setShowLocationForm(false)}
                    variant="outline"
                  >
                    Cancel
                  </FarmButton>
                  <FarmButton onClick={handleAddLocation} variant="success">
                    Add Location
                  </FarmButton>
                </div>
              </div>
            </FarmCardContent>
          </FarmCard>
        )}

        {/* Saved Locations */}
        <FarmCard>
          <FarmCardHeader
            title="Saved Locations"
            description="Manage your farm locations for weather monitoring"
          />
          <FarmCardContent>
            <div className="farm-grid-auto">
              {locations.map((location) => (
                <div
                  key={location.name}
                  className="farm-card-section border rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{location.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {location.latitude.toFixed(4)},{" "}
                        {location.longitude.toFixed(4)}
                      </p>
                    </div>
                    {location.isDefault && (
                      <span className="text-xs bg-success/10 text-success px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="action-buttons-sm">
                    {!location.isDefault && (
                      <FarmButton
                        onClick={() => handleSetDefault(location)}
                        variant="outline"
                        size="sm"
                      >
                        Set Default
                      </FarmButton>
                    )}
                    <FarmButton
                      onClick={() => setCurrentLocation(location)}
                      variant="outline"
                      size="sm"
                    >
                      View Weather
                    </FarmButton>
                    {locations.length > 1 && (
                      <FarmButton
                        onClick={() => handleDeleteLocation(location.name)}
                        variant="destructive"
                        size="sm"
                      >
                        Delete
                      </FarmButton>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </FarmCardContent>
        </FarmCard>

        {/* Weather Dashboard */}
        <FarmCard>
          <FarmCardHeader
            title={`Weather for ${currentLocation.name}`}
            description="Current conditions and forecast for your selected location"
          />
          <FarmCardContent>
            <EnhancedWeatherDashboard
              latitude={currentLocation.latitude}
              longitude={currentLocation.longitude}
            />
          </FarmCardContent>
        </FarmCard>
      </div>
    </div>
  );
}
