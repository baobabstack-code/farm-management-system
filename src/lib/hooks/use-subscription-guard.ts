"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

interface SubscriptionStatus {
  hasAccess: boolean;
  loading: boolean;
  subscription: any;
}

/**
 * Hook for client-side subscription checking with redirect
 */
export function useSubscriptionGuard(): SubscriptionStatus {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [status, setStatus] = useState<SubscriptionStatus>({
    hasAccess: false,
    loading: true,
    subscription: null,
  });

  useEffect(() => {
    if (!isLoaded || !user) {
      setStatus((prev) => ({ ...prev, loading: false }));
      return;
    }

    const checkSubscription = async () => {
      try {
        const response = await fetch("/api/user/subscription");

        if (response.ok) {
          const data = await response.json();

          if (!data.hasAccess) {
            router.push("/payments?expired=true");
            return;
          }

          setStatus({
            hasAccess: data.hasAccess,
            loading: false,
            subscription: data.subscription,
          });
        } else {
          // On error, allow access to prevent blocking users
          setStatus({
            hasAccess: true,
            loading: false,
            subscription: null,
          });
        }
      } catch (error) {
        console.error("Subscription check error:", error);
        // On error, allow access to prevent blocking users
        setStatus({
          hasAccess: true,
          loading: false,
          subscription: null,
        });
      }
    };

    checkSubscription();
  }, [user, isLoaded, router]);

  return status;
}

/**
 * Hook for client-side subscription status without redirect
 */
export function useSubscriptionStatus(): SubscriptionStatus {
  const { user, isLoaded } = useUser();
  const [status, setStatus] = useState<SubscriptionStatus>({
    hasAccess: false,
    loading: true,
    subscription: null,
  });

  useEffect(() => {
    if (!isLoaded || !user) {
      setStatus((prev) => ({ ...prev, loading: false }));
      return;
    }

    const checkSubscription = async () => {
      try {
        const response = await fetch("/api/user/subscription");

        if (response.ok) {
          const data = await response.json();
          setStatus({
            hasAccess: data.hasAccess,
            loading: false,
            subscription: data.subscription,
          });
        } else {
          setStatus({
            hasAccess: false,
            loading: false,
            subscription: null,
          });
        }
      } catch (error) {
        console.error("Subscription check error:", error);
        setStatus({
          hasAccess: false,
          loading: false,
          subscription: null,
        });
      }
    };

    checkSubscription();
  }, [user, isLoaded]);

  return status;
}
