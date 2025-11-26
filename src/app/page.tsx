import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import HomeClient from "./home-client"; // Import the client component

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "FarmerFlow AI",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "150",
    },
    description:
      "AI-powered farm management platform for tracking crops, optimizing resources, and boosting agricultural yields",
    featureList: [
      "Crop Management",
      "Field Tracking",
      "Equipment Management",
      "Task Scheduling",
      "AI-Powered Insights",
      "Weather Integration",
      "Resource Optimization",
    ],
    screenshot: "/og-image.svg",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HomeClient />
    </>
  );
}
