import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";

export function useOnboarding() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    async function checkOnboardingStatus() {
      // Skip check if not loaded, no user, or already on onboarding page
      if (!isLoaded || !user || pathname === "/onboarding") {
        setChecking(false);
        return;
      }

      try {
        const response = await fetch("/api/onboarding/status");
        if (response.ok) {
          const data = await response.json();

          if (!data.completed) {
            setNeedsOnboarding(true);
            // Redirect to onboarding
            router.push("/onboarding");
          }
        }
      } catch (error) {
        console.error("Failed to check onboarding status:", error);
      } finally {
        setChecking(false);
      }
    }

    checkOnboardingStatus();
  }, [user, isLoaded, router, pathname]);

  return { checking, needsOnboarding };
}
