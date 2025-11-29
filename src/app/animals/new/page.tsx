"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Species {
  id: string;
  name: string;
}

export default function NewAnimalGroupPage() {
  const router = useRouter();
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    speciesId: "",
    name: "",
    quantity: "",
    startDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    fetch("/api/animals/species")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSpeciesList(data.data);
          if (data.data.length > 0) {
            setFormData((prev) => ({ ...prev, speciesId: data.data[0].id }));
          }
        }
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/animals/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity),
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push("/animals");
      } else {
        alert("Error creating group: " + JSON.stringify(data.error));
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl page-container">
      <Link
        href="/animals"
        className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Animals
      </Link>

      <h1 className="text-3xl font-bold mb-8 farm-heading-page">
        Add New Group
      </h1>

      <Card className="farm-card">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Species</Label>
              <Select
                value={formData.speciesId}
                onValueChange={(value) =>
                  setFormData({ ...formData, speciesId: value })
                }
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select species" />
                </SelectTrigger>
                <SelectContent>
                  {speciesList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Group Name</Label>
              <Input
                type="text"
                placeholder="e.g., Broiler Flock A"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                rows={3}
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full farm-btn-primary"
            >
              {loading ? "Creating..." : "Create Group"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
