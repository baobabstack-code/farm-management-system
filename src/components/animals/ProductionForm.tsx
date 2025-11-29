"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProductionForm({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [eggs, setEggs] = useState("");
  const [weight, setWeight] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/animals/production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          date,
          eggs: eggs ? parseInt(eggs) : undefined,
          weightKg: weight ? parseFloat(weight) : undefined,
        }),
      });

      if (res.ok) {
        setEggs("");
        setWeight("");
        router.refresh(); // Refresh server components
      } else {
        alert("Failed to save production record");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="farm-card">
      <CardHeader>
        <CardTitle>Quick Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Eggs Collected</Label>
              <Input
                type="number"
                value={eggs}
                onChange={(e) => setEggs(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Avg Weight (kg)</Label>
              <Input
                type="number"
                step="0.01"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto farm-btn-primary"
          >
            {loading ? "Saving..." : "Save Record"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
