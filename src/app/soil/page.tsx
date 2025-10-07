"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import SoilTestForm from "@/components/soil/SoilTestForm";
import SoilAnalysisDashboard from "@/components/soil/SoilAnalysisDashboard";
import { SoilTest, SoilTestType } from "@/types";
import { SoilAnalysis, SoilRecommendation } from "@/lib/services/soil-service";

export default function SoilManagementPage() {
  const { user } = useUser();
  const [soilTests, setSoilTests] = useState<SoilTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<{
    soilTest: SoilTest;
    analysis: SoilAnalysis;
    recommendations: SoilRecommendation;
  } | null>(null);

  useEffect(() => {
    if (user) {
      fetchSoilTests();
    }
  }, [user]);

  const fetchSoilTests = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/soil/tests");

      if (!response.ok) {
        throw new Error("Failed to fetch soil tests");
      }

      const result = await response.json();
      setSoilTests(result.data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch soil tests"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSoilTest = async (formData: any) => {
    try {
      setFormLoading(true);
      const response = await fetch("/api/soil/tests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to create soil test");
      }

      const result = await response.json();
      setSoilTests((prev) => [result.data.soilTest, ...prev]);
      setShowForm(false);

      // Show analysis immediately for new test
      setSelectedAnalysis({
        soilTest: result.data.soilTest,
        analysis: result.data.analysis,
        recommendations: result.data.recommendations,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create soil test"
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleAnalyzeTest = async (testId: string) => {
    try {
      const response = await fetch(`/api/soil/tests/${testId}/analyze`);

      if (!response.ok) {
        throw new Error("Failed to analyze soil test");
      }

      const result = await response.json();
      setSelectedAnalysis({
        soilTest: result.data.soilTest,
        analysis: result.data.analysis,
        recommendations: result.data.recommendations,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to analyze soil test"
      );
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-blue-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  // Calculate health scores for display
  const testsWithScores = soilTests.map((test) => {
    // Quick health calculation for list display
    let score = 0;
    if (test.pH >= 6.0 && test.pH <= 7.0) score += 25;
    else if (test.pH >= 5.5 && test.pH <= 7.5) score += 20;
    else score += 10;

    if (test.organicMatter >= 4.0) score += 30;
    else if (test.organicMatter >= 3.0) score += 25;
    else if (test.organicMatter >= 2.0) score += 15;
    else score += 5;

    if (test.nitrogen >= 20 && test.nitrogen <= 60) score += 15;
    if (test.phosphorus >= 15 && test.phosphorus <= 50) score += 15;
    if (test.potassium >= 150 && test.potassium <= 500) score += 15;

    return { ...test, healthScore: score };
  });

  if (selectedAnalysis) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Button
              onClick={() => setSelectedAnalysis(null)}
              className="mb-4 text-blue-600 hover:text-blue-800"
            >
              ← Back to Soil Tests
            </Button>
            <SoilAnalysisDashboard
              soilTest={selectedAnalysis.soilTest}
              analysis={selectedAnalysis.analysis}
              recommendations={selectedAnalysis.recommendations}
            />
          </div>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <SoilTestForm
            onSubmit={handleCreateSoilTest}
            onCancel={() => setShowForm(false)}
            loading={formLoading}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Soil Management
              </h1>
              <p className="text-gray-600 mt-1">
                Monitor soil health, track tests, and get recommendations for
                optimal crop production
              </p>
            </div>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
            >
              + New Soil Test
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        {testsWithScores.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                    <span className="text-blue-600 text-sm">🧪</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Tests
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {testsWithScores.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                    <span className="text-green-600 text-sm">📊</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Avg Health Score
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {Math.round(
                      testsWithScores.reduce(
                        (sum, test) => sum + test.healthScore,
                        0
                      ) / testsWithScores.length
                    )}
                    /100
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                    <span className="text-yellow-600 text-sm">⚡</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg pH</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {(
                      testsWithScores.reduce((sum, test) => sum + test.pH, 0) /
                      testsWithScores.length
                    ).toFixed(1)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                    <span className="text-purple-600 text-sm">🌱</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Avg Organic Matter
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {(
                      testsWithScores.reduce(
                        (sum, test) => sum + test.organicMatter,
                        0
                      ) / testsWithScores.length
                    ).toFixed(1)}
                    %
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Soil Tests List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Soil Test History
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading soil tests...</p>
            </div>
          ) : testsWithScores.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">🧪</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No soil tests yet
              </h3>
              <p className="text-gray-600 mb-4">
                Get started by creating your first soil test to monitor soil
                health and get recommendations.
              </p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Create First Soil Test
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Test Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Health Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Key Metrics
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lab & Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {testsWithScores.map((test) => (
                    <tr key={test.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(test.sampleDate).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {test.testType.replace("_", " ")} Test
                          </div>
                          <div className="text-sm text-gray-500">
                            {test.soilTexture}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className={`text-lg font-semibold ${getHealthScoreColor(test.healthScore)}`}
                          >
                            {test.healthScore}/100
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>pH: {test.pH}</div>
                        <div>OM: {test.organicMatter}%</div>
                        <div>
                          NPK: {test.nitrogen}-{test.phosphorus}-
                          {test.potassium}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{test.labName}</div>
                        <div className="text-gray-500">${test.cost}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button
                          onClick={() => handleAnalyzeTest(test.id)}
                          className="text-blue-600 hover:text-blue-800 bg-transparent hover:bg-blue-50 px-3 py-1 text-sm"
                        >
                          View Analysis
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
