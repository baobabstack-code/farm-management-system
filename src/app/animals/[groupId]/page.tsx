"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProductionForm from "@/components/animals/ProductionForm";
import ForecastCard from "@/components/animals/ForecastCard";
import LineChart from "@/components/animals/LineChart";

interface GroupDetails {
  id: string;
  name: string;
  species: { name: string };
  quantity: number;
  startDate: string;
  status: string;
  latestProduction?: {
    date: string;
    eggs: number;
  };
}

interface ProductionRecord {
  date: string;
  eggs: number;
}

interface Forecast {
  id: string;
  status: string;
  createdAt: string;
  outputJson: any;
}

export default function GroupDetailsPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const [groupId, setGroupId] = useState<string>("");
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [production, setProduction] = useState<ProductionRecord[]>([]);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then((resolvedParams) => {
      setGroupId(resolvedParams.groupId);
    });
  }, [params]);

  useEffect(() => {
    if (!groupId) return;

    const fetchData = async () => {
      try {
        // Fetch group details
        const groupRes = await fetch(`/api/animals/groups/${groupId}`);
        const groupData = await groupRes.json();
        if (groupData.success) setGroup(groupData.data);

        // Fetch production history
        const prodRes = await fetch(
          `/api/animals/production?groupId=${groupId}`
        );
        const prodData = await prodRes.json();
        if (prodData.success) setProduction(prodData.data);

        // Fetch forecasts
        const forecastRes = await fetch(`/api/animals/forecast/${groupId}`);
        const forecastData = await forecastRes.json();
        if (forecastData.success) setForecasts(forecastData.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [groupId]);

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (!group) return <div className="p-6 text-center">Group not found</div>;

  // Prepare chart data
  // Merge production and forecast
  const latestForecast = forecasts[0];
  const chartData: { date: string; actual?: number; forecast?: number }[] = [];

  // Add historical data (reverse to show oldest first if API returns desc)
  const sortedProduction = [...production].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  sortedProduction.forEach((p) => {
    chartData.push({
      date: new Date(p.date).toLocaleDateString(),
      actual: p.eggs,
    });
  });

  // Add forecast data if available
  if (
    latestForecast?.status === "completed" &&
    latestForecast.outputJson?.predictions
  ) {
    latestForecast.outputJson.predictions.forEach((p: any) => {
      chartData.push({
        date: new Date(p.date).toLocaleDateString(),
        forecast: p.predictedEggs,
      });
    });
  }

  return (
    <div className="container mx-auto p-6 space-y-6 page-container">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Link
            href="/animals"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Animals
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-3 farm-heading-page">
            {group.name}
            <Badge
              variant={group.status === "active" ? "default" : "secondary"}
              className={
                group.status === "active"
                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-100"
              }
            >
              {group.status}
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            {group.species.name} • {group.quantity} animals • Started{" "}
            {new Date(group.startDate).toLocaleDateString()}
          </p>
        </div>
        <Button variant="ghost" size="icon">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="farm-card">
            <CardHeader>
              <CardTitle>Production Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart data={chartData} />
            </CardContent>
          </Card>

          {/* Recent History Table */}
          <Card className="farm-card">
            <CardHeader>
              <CardTitle>Recent History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-2">Date</th>
                      <th className="p-2">Eggs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {production.slice(0, 5).map((p, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="p-2">
                          {new Date(p.date).toLocaleDateString()}
                        </td>
                        <td className="p-2 font-medium">{p.eggs}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          <ProductionForm groupId={group.id} />
          <ForecastCard groupId={group.id} latestForecast={forecasts[0]} />
        </div>
      </div>
    </div>
  );
}
