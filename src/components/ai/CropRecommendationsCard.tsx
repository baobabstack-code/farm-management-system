"use client";

import { useState, useEffect } from "react";
import { useFeatureFlag } from "@/lib/feature-flags";
import { Button } from "@/components/ui/button";
import type {
  CropRecommendation,
  RecommendationFactors,
} from "@/lib/services/crop-recommendations";

interface FormOptions {
  seasons: string[];
  soilTypes: string[];
  experienceLevels: string[];
  spaceOptions: string[];
  budgetOptions: string[];
  currentSeason: string;
}

export default function CropRecommendationsCard() {
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<CropRecommendation[]>(
    []
  );
  const [showForm, setShowForm] = useState(false);
  const [options, setOptions] = useState<FormOptions | null>(null);
  const [factors, setFactors] = useState<RecommendationFactors>({
    currentSeason: "",
    experience: "beginner",
    spaceAvailable: "medium",
    budget: "medium",
  });
  const [error, setError] = useState("");

  const cropRecommendationsEnabled = useFeatureFlag("aiCropRecommendations");

  useEffect(() => {
    if (cropRecommendationsEnabled) {
      fetchOptions();
      // Auto-fetch initial recommendations
      fetchRecommendationsWithDefaults();
    }
  }, [cropRecommendationsEnabled]);

  const fetchOptions = async () => {
    try {
      const response = await fetch("/api/ai/crop-recommendations");
      const data = await response.json();

      if (data.success) {
        setOptions(data.options);
        setFactors((prev) => ({
          ...prev,
          currentSeason: data.options.currentSeason,
        }));
      }
    } catch {
      console.error("Failed to fetch options");
    }
  };

  const fetchRecommendationsWithDefaults = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/ai/crop-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Use smart defaults for initial load
          experience: "beginner",
          spaceAvailable: "medium",
          budget: "medium",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setRecommendations(data.recommendations);
      } else {
        setError(data.error || "Failed to fetch recommendations");
      }
    } catch {
      setError("Error fetching recommendations");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/ai/crop-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(factors),
      });

      const data = await response.json();

      if (data.success) {
        setRecommendations(data.recommendations);
        setShowForm(false);
      } else {
        setError(data.error || "Failed to fetch recommendations");
      }
    } catch {
      setError("Error fetching recommendations");
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return "text-success dark:text-green-400";
    if (confidence >= 70) return "text-warning dark:text-amber-400";
    return "text-destructive dark:text-red-400";
  };

  const getDifficultyColor = (difficulty: string) => {
    // Accept 'low', 'medium', 'high' values from recommendations
    if (difficulty === "low")
      return "bg-success/10 text-success border border-success/20 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30";
    if (difficulty === "medium")
      return "bg-warning/10 text-warning border border-warning/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30";
    if (difficulty === "high")
      return "bg-destructive/10 text-destructive border border-destructive/20 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30";
    // Fallback for unexpected values
    return "bg-muted text-muted-foreground border border-border dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600/50";
  };

  const getMarketColor = (market: string) => {
    // Accept 'high', 'medium', 'low' values from recommendations
    if (market === "high")
      return "bg-success/10 text-success border border-success/20 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30";
    if (market === "medium")
      return "bg-warning/10 text-warning border border-warning/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30";
    if (market === "low")
      return "bg-muted text-muted-foreground border border-border dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600/50";
    return "bg-muted text-muted-foreground border border-border dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600/50";
  };

  if (!cropRecommendationsEnabled) {
    return null;
  }

  return (
    <div className="farm-card">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="farm-heading-card flex items-center">
            🌱 Crop Recommendations
          </h2>
          <p className="farm-text-muted mt-1">
            AI-powered suggestions for your next planting
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => setShowForm(!showForm)}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            {showForm ? "Cancel" : "Customize"}
          </Button>
          {!showForm && (
            <Button
              onClick={fetchRecommendationsWithDefaults}
              disabled={isLoading}
              size="sm"
              className="text-xs"
            >
              {isLoading ? "Loading..." : "Refresh"}
            </Button>
          )}
        </div>
      </div>

      {/* Customization Form */}
      {showForm && options && (
        <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
          <h3 className="farm-text-body font-medium mb-3">
            Customize Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block farm-text-muted font-medium mb-1">
                Season
              </label>
              <select
                value={factors.currentSeason}
                onChange={(e) =>
                  setFactors({ ...factors, currentSeason: e.target.value })
                }
                className="farm-form-select"
              >
                {options.seasons.map((season) => (
                  <option key={season} value={season}>
                    {season.charAt(0).toUpperCase() + season.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block farm-text-muted font-medium mb-1">
                Experience Level
              </label>
              <select
                value={factors.experience}
                onChange={(e) =>
                  setFactors({
                    ...factors,
                    experience: e.target.value as
                      | "beginner"
                      | "intermediate"
                      | "advanced",
                  })
                }
                className="farm-form-select"
              >
                {options.experienceLevels.map((level) => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block farm-text-muted font-medium mb-1">
                Space Available
              </label>
              <select
                value={factors.spaceAvailable}
                onChange={(e) =>
                  setFactors({
                    ...factors,
                    spaceAvailable: e.target.value as
                      | "small"
                      | "medium"
                      | "large",
                  })
                }
                className="farm-form-select"
              >
                {options.spaceOptions.map((space) => (
                  <option key={space} value={space}>
                    {space.charAt(0).toUpperCase() + space.slice(1)} (
                    {space === "small"
                      ? "Container/Small plot"
                      : space === "medium"
                        ? "Garden bed"
                        : "Large area"}
                    )
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block farm-text-muted font-medium mb-1">
                Budget
              </label>
              <select
                value={factors.budget}
                onChange={(e) =>
                  setFactors({
                    ...factors,
                    budget: e.target.value as any,
                  })
                }
                className="farm-form-select"
              >
                {options.budgetOptions.map((budget) => (
                  <option key={budget} value={budget}>
                    {budget.charAt(0).toUpperCase() + budget.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block farm-text-muted font-medium mb-1">
                Soil Type (Optional)
              </label>
              <select
                value={factors.soilType || ""}
                onChange={(e) =>
                  setFactors({
                    ...factors,
                    soilType: (e.target.value as any) || undefined,
                  })
                }
                className="farm-form-select"
              >
                <option value="">Not sure</option>
                {options.soilTypes.map((soil) => (
                  <option key={soil} value={soil}>
                    {soil.charAt(0).toUpperCase() + soil.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            onClick={fetchRecommendations}
            disabled={isLoading}
            className="mt-4"
            size="sm"
          >
            {isLoading ? "Getting Recommendations..." : "Get Recommendations"}
          </Button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded farm-text-caption">
          {error}
        </div>
      )}

      {/* Recommendations Display */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      ) : recommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.slice(0, 6).map((recommendation, index) => (
            <div
              key={index}
              className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow bg-card"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="farm-text-body font-semibold">
                  {recommendation.cropName}
                  {recommendation.variety && (
                    <span className="farm-text-muted font-normal ml-1">
                      ({recommendation.variety})
                    </span>
                  )}
                </h3>
                <span
                  className={`text-xs font-bold ${getConfidenceColor(recommendation.confidence)}`}
                >
                  {recommendation.confidence}%
                </span>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(recommendation.difficulty)}`}
                >
                  {recommendation.difficulty}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${getMarketColor(recommendation.marketPotential)}`}
                >
                  {recommendation.marketPotential} Market
                </span>
                {recommendation.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-1 bg-info/10 text-info border border-info/20 rounded-full dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="farm-text-caption mb-2">
                <p>
                  <strong>Yield:</strong> {recommendation.expectedYield}
                </p>
                <p>
                  <strong>Time:</strong> {recommendation.growingTime}
                </p>
              </div>

              <div className="farm-text-caption">
                <strong>Why this crop:</strong>
                <ul className="mt-1 space-y-0.5">
                  {recommendation.reasoning.slice(0, 2).map((reason, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-success mr-1">•</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 farm-text-muted">
          <p className="farm-text-body">
            No recommendations available at the moment.
          </p>
          <p className="farm-text-caption mt-2">
            Try customizing your preferences or refresh to get suggestions.
          </p>
        </div>
      )}

      {recommendations.length > 6 && (
        <div className="mt-4 text-center">
          <p className="farm-text-caption">
            Showing top 6 recommendations. Customize settings to see more
            options.
          </p>
        </div>
      )}
    </div>
  );
}
