"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AnimalGroup {
  id: string;
  name: string;
  species: { name: string; slug: string };
  quantity: number;
  status: string;
  _count: { production: number };
}

export default function AnimalsPage() {
  const [groups, setGroups] = useState<AnimalGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/animals/groups")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setGroups(data.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6 page-container">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold farm-heading-page">My Animals</h1>
        <Link href="/animals/new">
          <Button className="farm-btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Group
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : groups.length === 0 ? (
        <Card className="text-center py-10 farm-card">
          <CardContent>
            <p className="text-muted-foreground mb-4">
              No animal groups found.
            </p>
            <Link href="/animals/new">
              <Button variant="link" className="text-primary">
                Create your first flock/herd
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/animals/${group.id}`}
              className="block group"
            >
              <Card className="farm-card-interactive h-full">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
                      {group.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {group.species.name}
                    </p>
                  </div>
                  <Badge
                    variant={
                      group.status === "active" ? "default" : "secondary"
                    }
                    className={
                      group.status === "active"
                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                    }
                  >
                    {group.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Quantity:</span>
                      <span className="font-medium">{group.quantity}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Production Entries:
                      </span>
                      <span className="font-medium">
                        {group._count.production}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
