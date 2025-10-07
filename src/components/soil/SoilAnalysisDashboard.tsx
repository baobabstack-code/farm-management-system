"use client";

import React from "react";
import { SoilAnalysis, SoilRecommendation } from "@/lib/services/soil-service";
import { SoilTest } from "@/types";

interface SoilAnalysisDashboardProps {
  soilTest: SoilTest;
  analysis: SoilAnalysis;
  recommendations: SoilRecommendation;
}

export default function SoilAnalysisDashboard({
  soilTest,
  analysis,
  recommendations,
}: SoilAnalysisDashboardProps) {
  const getRatingColor = (rating: string) => {
    switch (rating.toLowerCase()) {
      case "excellent":
        return "text-green-700 bg-green-100";
      case "very good":
      case "good":
        return "text-green-700 bg-green-100";
      case "optimal":
        return "text-blue-700 bg-blue-100";
      case "moderate":
        return "text-yellow-700 bg-yellow-100";
      case "fair":
        return "text-orange-700 bg-orange-100";
      case "low":
      case "very low":
      case "poor":
        return "text-red-700 bg-red-100";
      case "high":
      case "very high":
        return "text-purple-700 bg-purple-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 85) return "text-green-700";
    if (score >= 70) return "text-blue-700";
    if (score >= 50) return "text-yellow-700";
    return "text-red-700";
  };

  const getSuitabilityColor = (suitability: string) => {
    switch (suitability.toLowerCase()) {
      case "excellent":
        return "text-green-700 bg-green-100";
      case "good":
        return "text-blue-700 bg-blue-100";
      case "fair":
        return "text-yellow-700 bg-yellow-100";
      case "poor":
        return "text-red-700 bg-red-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Soil Analysis Report
            </h1>
            <p className="text-gray-600 mt-1">
              Test Date: {new Date(soilTest.sampleDate).toLocaleDateString()} |
              Lab: {soilTest.labName} | Type:{" "}
              {soilTest.testType.replace("_", " ")}
            </p>
          </div>
          <div className="text-right">
            <div
              className={`text-2xl font-bold ${getHealthScoreColor(analysis.overallHealth.score)}`}
            >
              {analysis.overallHealth.score}/100
            </div>
            <div className="text-sm text-gray-600">Overall Health Score</div>
          </div>
        </div>
      </div>

      {/* Overall Health Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Overall Soil Health
          </h2>
          <span
            className={`ml-3 px-3 py-1 rounded-full text-sm font-medium ${getRatingColor(analysis.overallHealth.rating)}`}
          >
            {analysis.overallHealth.rating}
          </span>
        </div>

        {analysis.overallHealth.primaryIssues.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Primary Issues:
            </h3>
            <div className="flex flex-wrap gap-2">
              {analysis.overallHealth.primaryIssues.map((issue, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-red-100 text-red-700 text-sm rounded"
                >
                  {issue}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Soil Properties Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Soil Properties
          </h2>

          {/* pH Analysis */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-700">pH Level</h3>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold">
                  {analysis.pH.value}
                </span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getRatingColor(analysis.pH.rating)}`}
                >
                  {analysis.pH.rating}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              {analysis.pH.recommendation}
            </p>
          </div>

          {/* Organic Matter */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-700">
                Organic Matter
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold">
                  {analysis.organicMatter.value}%
                </span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getRatingColor(analysis.organicMatter.rating)}`}
                >
                  {analysis.organicMatter.rating}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              {analysis.organicMatter.recommendation}
            </p>
          </div>

          {/* Soil Texture */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-700">
                Soil Texture
              </h3>
              <span className="text-lg font-semibold">
                {soilTest.soilTexture}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Nutrient Levels
          </h2>

          {/* Nitrogen */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-700">
                Nitrogen (N)
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold">
                  {analysis.nutrients.nitrogen.value} ppm
                </span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getRatingColor(analysis.nutrients.nitrogen.rating)}`}
                >
                  {analysis.nutrients.nitrogen.rating}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              {analysis.nutrients.nitrogen.recommendation}
            </p>
          </div>

          {/* Phosphorus */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-700">
                Phosphorus (P)
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold">
                  {analysis.nutrients.phosphorus.value} ppm
                </span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getRatingColor(analysis.nutrients.phosphorus.rating)}`}
                >
                  {analysis.nutrients.phosphorus.rating}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              {analysis.nutrients.phosphorus.recommendation}
            </p>
          </div>

          {/* Potassium */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-700">
                Potassium (K)
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold">
                  {analysis.nutrients.potassium.value} ppm
                </span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getRatingColor(analysis.nutrients.potassium.rating)}`}
                >
                  {analysis.nutrients.potassium.rating}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              {analysis.nutrients.potassium.recommendation}
            </p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Amendment Recommendations */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Amendment Recommendations
          </h2>

          {recommendations.amendments.length > 0 ? (
            <div className="space-y-4">
              {recommendations.amendments.map((amendment, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">
                      {amendment.type}
                    </h3>
                    <span className="text-sm font-semibold text-blue-600">
                      {amendment.rate} {amendment.unit}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {amendment.purpose}
                  </p>
                  <p className="text-xs text-gray-500">
                    Timing: {amendment.timing}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">
              No specific amendments recommended at this time.
            </p>
          )}
        </div>

        {/* Management Practices */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Management Practices
          </h2>

          <div className="space-y-4">
            {recommendations.practices.map((practice, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4"
              >
                <h3 className="font-medium text-gray-900 mb-2">
                  {practice.practice}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {practice.description}
                </p>
                <p className="text-xs text-gray-500">
                  Timeline: {practice.timeline}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Crop Suitability */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Crop Suitability Assessment
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations.cropSuitability.map((crop, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-gray-900">{crop.cropType}</h3>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getSuitabilityColor(crop.suitability)}`}
                >
                  {crop.suitability}
                </span>
              </div>
              <p className="text-sm text-gray-600">{crop.notes}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Additional Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">
              Secondary Nutrients
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Calcium:</span>
                <span className="font-medium">{soilTest.calcium} ppm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Magnesium:</span>
                <span className="font-medium">{soilTest.magnesium} ppm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sulfur:</span>
                <span className="font-medium">{soilTest.sulfur} ppm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">CEC:</span>
                <span className="font-medium">
                  {soilTest.cationExchangeCapacity}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-2">Test Information</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Cost:</span>
                <span className="font-medium">${soilTest.cost}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Lab:</span>
                <span className="font-medium">{soilTest.labName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sample Date:</span>
                <span className="font-medium">
                  {new Date(soilTest.sampleDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            {soilTest.notes && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-1">Notes:</h4>
                <p className="text-sm text-gray-600">{soilTest.notes}</p>
              </div>
            )}
          </div>
        </div>

        {soilTest.recommendations && (
          <div className="mt-6">
            <h3 className="font-medium text-gray-900 mb-2">
              Laboratory Recommendations
            </h3>
            <p className="text-sm text-gray-600">{soilTest.recommendations}</p>
          </div>
        )}
      </div>
    </div>
  );
}
