"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { MapPin, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [locationMethod, setLocationMethod] = useState<
    "auto" | "manual" | null
  >(null);

  // Manual location input
  const [manualAddress, setManualAddress] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Selected location
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    null
  );

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push("/sign-in");
    }
  }, [user, isLoaded, router]);

  // Auto-detect location using browser geolocation
  const handleAutoDetect = async () => {
    setLoading(true);
    setLocationMethod("auto");

    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Please enter your location manually",
        variant: "destructive",
      });
      setLoading(false);
      setLocationMethod("manual");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Reverse geocode to get address
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();

          const location: LocationData = {
            latitude,
            longitude,
            address: data.display_name || `${latitude}, ${longitude}`,
            city:
              data.address?.city || data.address?.town || data.address?.village,
            country: data.address?.country,
          };

          setSelectedLocation(location);
          setStep(2);
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          toast({
            title: "Error",
            description:
              "Could not determine your address. Please enter manually.",
            variant: "destructive",
          });
          setLocationMethod("manual");
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast({
          title: "Location access denied",
          description: "Please enter your location manually",
          variant: "destructive",
        });
        setLoading(false);
        setLocationMethod("manual");
      }
    );
  };

  // Search for location manually
  const handleSearchLocation = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Location search error:", error);
      toast({
        title: "Search failed",
        description: "Could not search for locations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  // Select a location from search results
  const handleSelectLocation = (result: any) => {
    const location: LocationData = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      address: result.display_name,
      city: result.address?.city || result.address?.town,
      country: result.address?.country,
    };

    setSelectedLocation(location);
    setSearchResults([]);
    setStep(2);
  };

  // Save location and complete onboarding
  const handleCompleteOnboarding = async () => {
    if (!selectedLocation || !user) return;

    setLoading(true);
    try {
      // Create a field with the user's location
      const response = await fetch("/api/fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Main Farm",
          address: selectedLocation.address,
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          area: 0, // User can update later
          soilType: "LOAMY", // Default
          isActive: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save location");
      }

      toast({
        title: "Welcome to FarmerFlow! 🌱",
        description: "Your farm location has been set up successfully.",
      });

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Onboarding error:", error);
      toast({
        title: "Error",
        description: "Could not complete setup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <span className="text-3xl">🌱</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to FarmerFlow AI!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Let's set up your farm to get personalized weather and insights
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= 1
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              1
            </div>
            <div
              className={`w-24 h-1 ${step >= 2 ? "bg-primary" : "bg-gray-200"}`}
            />
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= 2
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              2
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Set Your Farm Location
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  This helps us provide accurate weather forecasts and farming
                  insights
                </p>
              </div>

              {locationMethod === null && (
                <div className="space-y-4">
                  <button
                    onClick={handleAutoDetect}
                    disabled={loading}
                    className="w-full farm-btn farm-btn-primary farm-btn-lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Detecting location...
                      </>
                    ) : (
                      <>
                        <MapPin className="w-5 h-5" />
                        Auto-detect my location
                      </>
                    )}
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white dark:bg-gray-800 text-gray-500">
                        or
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setLocationMethod("manual")}
                    className="w-full farm-btn farm-btn-outline farm-btn-lg"
                  >
                    Enter location manually
                  </button>
                </div>
              )}

              {locationMethod === "manual" && (
                <div className="space-y-4">
                  <div>
                    <label className="farm-form-label">
                      Search for your farm location
                    </label>
                    <input
                      type="text"
                      value={manualAddress}
                      onChange={(e) => {
                        setManualAddress(e.target.value);
                        handleSearchLocation(e.target.value);
                      }}
                      placeholder="Enter city, address, or coordinates..."
                      className="farm-form-input"
                    />
                  </div>

                  {searching && (
                    <div className="text-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                    </div>
                  )}

                  {searchResults.length > 0 && (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700 max-h-64 overflow-y-auto">
                      {searchResults.map((result, index) => (
                        <button
                          key={index}
                          onClick={() => handleSelectLocation(result)}
                          className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate">
                                {result.display_name}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {result.lat}, {result.lon}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => setLocationMethod(null)}
                    className="w-full farm-btn farm-btn-ghost"
                  >
                    ← Back to options
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 2 && selectedLocation && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Confirm Your Location
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Is this your farm location?
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white mb-2">
                      {selectedLocation.address}
                    </p>
                    <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      {selectedLocation.city && (
                        <p>City: {selectedLocation.city}</p>
                      )}
                      {selectedLocation.country && (
                        <p>Country: {selectedLocation.country}</p>
                      )}
                      <p>
                        Coordinates: {selectedLocation.latitude.toFixed(4)},{" "}
                        {selectedLocation.longitude.toFixed(4)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleCompleteOnboarding}
                  disabled={loading}
                  className="w-full farm-btn farm-btn-primary farm-btn-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Setting up your farm...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Confirm and Continue
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setStep(1);
                    setSelectedLocation(null);
                    setLocationMethod(null);
                  }}
                  disabled={loading}
                  className="w-full farm-btn farm-btn-ghost"
                >
                  ← Choose a different location
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          You can always update your farm location later in settings
        </p>
      </div>
    </div>
  );
}
