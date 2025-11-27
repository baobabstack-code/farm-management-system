"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { MapPin, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import dynamic from "next/dynamic";

// Dynamically import the map component to avoid SSR issues
const MapSelector = dynamic(() => import("@/components/map/MapSelector"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-muted rounded-lg flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  ),
});

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
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    null
  );

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push("/sign-in");
    }
  }, [user, isLoaded, router]);

  // Handle location selection from map
  const handleLocationSelect = (location: LocationData) => {
    setSelectedLocation(location);
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
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <span className="text-3xl">🌱</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to FarmerFlow AI!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Let's set up your farm location to get personalized weather and
            insights
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
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Click on the map to drop a pin at your farm location, or use
                  the search bar to find your address
                </p>
              </div>

              {/* Map Component */}
              <MapSelector onLocationSelect={handleLocationSelect} />

              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                <p>
                  💡 Tip: You can zoom in/out and drag the map to find your
                  exact location
                </p>
              </div>
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
