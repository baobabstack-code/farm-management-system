"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Forecast {
  id: string;
  status: string;
  createdAt: string;
  outputJson: any;
}

export default function ForecastCard({
  groupId,
  latestForecast,
}: {
  groupId: string;
  latestForecast?: Forecast;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRunForecast = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/animals/forecast/${groupId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "egg_production",
          horizonDays: 30,
        }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to start forecast");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="farm-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>AI Forecast</CardTitle>
        <Button
          onClick={handleRunForecast}
          disabled={
            loading ||
            latestForecast?.status === "pending" ||
            latestForecast?.status === "running"
          }
          size="sm"
          variant="secondary"
          className="farm-btn-secondary"
        >
          {loading && <Loader2 className="w-3 h-3 animate-spin mr-2" />}
          Run New Forecast
        </Button>
      </CardHeader>
      <CardContent>
        {latestForecast ? (
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <Badge
                variant={
                  latestForecast.status === "completed" ? "default" : "outline"
                }
                className={
                  latestForecast.status === "completed"
                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                    : latestForecast.status === "failed"
                      ? "bg-red-100 text-red-800 hover:bg-red-100"
                      : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                }
              >
                {latestForecast.status}
              </Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last Run:</span>
              <span>
                {new Date(latestForecast.createdAt).toLocaleDateString()}
              </span>
            </div>

            {latestForecast.status === "completed" &&
              latestForecast.outputJson?.summary && (
                <div className="mt-4 p-3 bg-accent/50 rounded-md text-sm">
                  <p className="font-medium mb-1">
                    Prediction Summary (Next 30 Days)
                  </p>
                  <div className="flex justify-between">
                    <span>Avg Daily Eggs:</span>
                    <span className="font-bold">
                      {latestForecast.outputJson.summary.avgNext7Days}
                    </span>
                  </div>
                </div>
              )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No forecasts run yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
