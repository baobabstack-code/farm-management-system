"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plug, ExternalLink } from "lucide-react";
import QuickBooksIntegration from "@/components/settings/QuickBooksIntegration";

export default function IntegrationsPage() {
  const integrations = [
    {
      name: "QuickBooks Online",
      description:
        "Sync your financial data, accounts, and vendors with QuickBooks for seamless accounting.",
      logo: "🔢",
      category: "Accounting",
      status: "available",
      component: <QuickBooksIntegration />,
    },
    {
      name: "Stripe",
      description:
        "Accept payments and manage financial transactions directly from your farm management system.",
      logo: "💳",
      category: "Payments",
      status: "coming-soon",
      component: null,
    },
    {
      name: "Weather API",
      description:
        "Get accurate weather forecasts and alerts to optimize your farming decisions.",
      logo: "🌤️",
      category: "Weather",
      status: "integrated",
      component: null,
    },
    {
      name: "John Deere Operations Center",
      description:
        "Connect your John Deere equipment data for comprehensive farm analytics.",
      logo: "🚜",
      category: "Equipment",
      status: "coming-soon",
      component: null,
    },
    {
      name: "Google AI",
      description:
        "Enhanced crop recommendations and analytics powered by artificial intelligence.",
      logo: "🤖",
      category: "AI/Analytics",
      status: "integrated",
      component: null,
    },
  ];

  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(
    null
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "integrated":
        return (
          <Badge className="bg-green-100 text-green-800">Integrated</Badge>
        );
      case "available":
        return <Badge className="bg-blue-100 text-blue-800">Available</Badge>;
      case "coming-soon":
        return <Badge className="bg-gray-100 text-gray-600">Coming Soon</Badge>;
      default:
        return null;
    }
  };

  if (selectedIntegration) {
    const integration = integrations.find(
      (i) => i.name === selectedIntegration
    );
    if (integration && integration.component) {
      return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => setSelectedIntegration(null)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Integrations
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{integration.logo}</span>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {integration.name}
                </h1>
                <p className="text-gray-600">{integration.description}</p>
              </div>
            </div>
          </div>
          {integration.component}
        </div>
      );
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <Link href="/settings">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Settings
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <Plug className="w-8 h-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
        </div>
        <p className="text-gray-600">
          Connect your farm management system with external services to
          streamline your operations.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{integration.logo}</span>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {integration.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {integration.category}
                    </p>
                  </div>
                </div>
                {getStatusBadge(integration.status)}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                {integration.description}
              </p>

              {integration.status === "available" && integration.component && (
                <Button
                  onClick={() => setSelectedIntegration(integration.name)}
                  className="w-full"
                >
                  Configure Integration
                </Button>
              )}

              {integration.status === "integrated" && (
                <Button variant="outline" className="w-full" disabled>
                  Already Integrated
                </Button>
              )}

              {integration.status === "coming-soon" && (
                <Button variant="outline" className="w-full" disabled>
                  Coming Soon
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 p-6 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">
          Need a Custom Integration?
        </h2>
        <p className="text-gray-600 mb-4">
          Don't see the service you need? Contact us to discuss custom
          integration options for your specific requirements.
        </p>
        <Button variant="outline">
          <ExternalLink className="w-4 h-4 mr-2" />
          Contact Support
        </Button>
      </div>
    </div>
  );
}
