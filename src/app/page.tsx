import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import HomeClient from "./home-client"; // Import the client component

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return <HomeClient />;
}
