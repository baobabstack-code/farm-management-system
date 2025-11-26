"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Unlink,
  Download,
  Upload,
} from "lucide-react";

interface QuickBooksConnection {
  id: string;
  companyName?: string;
  isActive: boolean;
  lastSyncAt?: string;
  syncStatus?: string;
  syncErrors?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

interface SyncLog {
  id: string;
  syncType: string;
  status: string;
  recordsAffected: number;
  errorMessage?: string;
  createdAt: string;
}

interface QuickBooksStatus {
  connected: boolean;
  connection: QuickBooksConnection | null;
  syncLogs: SyncLog[];
  stats: {
    accountsCount: number;
    suppliersCount: number;
  };
}

export default function QuickBooksIntegration() {
  const [status, setStatus] = useState<QuickBooksStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchStatus();

    // Check for URL parameters from OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get("success");
    const error = urlParams.get("error");

    if (success === "connected") {
      setAlert({
        type: "success",
        message: "QuickBooks connected successfully!",
      });
    } else if (error) {
      const errorMessage = getErrorMessage(error);
      setAlert({ type: "error", message: errorMessage });
    }
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/quickbooks/status");
      if (!response.ok) throw new Error("Failed to fetch status");
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error("Error fetching QuickBooks status:", error);
      setAlert({ type: "error", message: "Failed to fetch QuickBooks status" });
    } finally {
      setLoading(false);
    }
  };

  const connectQuickBooks = async () => {
    setConnecting(true);
    try {
      const response = await fetch("/api/quickbooks/connect");
      if (!response.ok) throw new Error("Failed to get connection URL");
      const data = await response.json();

      // Open QuickBooks OAuth in a new window
      window.location.href = data.authUrl;
    } catch (error) {
      console.error("Error connecting to QuickBooks:", error);
      setAlert({
        type: "error",
        message: "Failed to initiate QuickBooks connection",
      });
    } finally {
      setConnecting(false);
    }
  };

  const disconnectQuickBooks = async () => {
    if (
      !confirm(
        "Are you sure you want to disconnect QuickBooks? This will stop all synchronization."
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/quickbooks/disconnect", {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to disconnect");

      setAlert({
        type: "success",
        message: "QuickBooks disconnected successfully",
      });
      fetchStatus();
    } catch (error) {
      console.error("Error disconnecting QuickBooks:", error);
      setAlert({ type: "error", message: "Failed to disconnect QuickBooks" });
    }
  };

  const syncData = async (syncType: string) => {
    setSyncing(true);
    try {
      const response = await fetch("/api/quickbooks/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ syncType }),
      });

      if (!response.ok) throw new Error("Sync failed");
      const data = await response.json();

      setAlert({
        type: "success",
        message: `${data.syncType} sync completed. ${data.recordsAffected} records affected.`,
      });
      fetchStatus();
    } catch (error) {
      console.error("Error syncing data:", error);
      setAlert({
        type: "error",
        message: "Failed to sync data with QuickBooks",
      });
    } finally {
      setSyncing(false);
    }
  };

  const getErrorMessage = (error: string) => {
    switch (error) {
      case "oauth_error":
        return "OAuth authorization failed. Please try again.";
      case "missing_params":
        return "Missing required parameters from QuickBooks.";
      case "connection_failed":
        return "Failed to establish connection with QuickBooks.";
      default:
        return "An unknown error occurred.";
    }
  };

  const getStatusIcon = (syncStatus?: string) => {
    switch (syncStatus) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "in_progress":
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">QuickBooks Integration</h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {alert && (
        <Alert
          className={
            alert.type === "error"
              ? "border-red-500"
              : alert.type === "success"
                ? "border-green-500"
                : "border-blue-500"
          }
        >
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">QuickBooks Integration</h3>
          <p className="text-sm text-gray-600">
            Connect your QuickBooks account to synchronize accounts, vendors,
            and financial data.
          </p>
        </CardHeader>
        <CardContent>
          {!status?.connected ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900">
                  Not Connected
                </h4>
                <p className="text-sm text-gray-600">
                  Connect your QuickBooks account to enable enhanced cost
                  tracking and financial management.
                </p>
              </div>
              <Button
                onClick={connectQuickBooks}
                disabled={connecting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {connecting ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4 mr-2" />
                )}
                Connect QuickBooks
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Connection Status */}
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
                  <div>
                    <h4 className="font-medium text-green-900">
                      Connected to QuickBooks
                    </h4>
                    <p className="text-sm text-green-700">
                      {status.connection?.companyName || "QuickBooks Company"}
                    </p>
                    <p className="text-xs text-green-600">
                      Connected on{" "}
                      {new Date(
                        status.connection?.createdAt || ""
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={disconnectQuickBooks}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Unlink className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              </div>

              {/* Sync Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    {getStatusIcon(status.connection?.syncStatus)}
                    <span className="ml-2 font-medium">Sync Status</span>
                  </div>
                  <Badge
                    variant={
                      status.connection?.syncStatus === "success"
                        ? "default"
                        : "destructive"
                    }
                  >
                    {status.connection?.syncStatus || "Unknown"}
                  </Badge>
                  {status.connection?.lastSyncAt && (
                    <p className="text-xs text-gray-600 mt-1">
                      Last sync:{" "}
                      {new Date(status.connection.lastSyncAt).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Download className="w-4 h-4 text-blue-500" />
                    <span className="ml-2 font-medium">Accounts</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {status.stats.accountsCount}
                  </p>
                  <p className="text-xs text-gray-600">
                    synced from QuickBooks
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Upload className="w-4 h-4 text-green-500" />
                    <span className="ml-2 font-medium">Suppliers</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {status.stats.suppliersCount}
                  </p>
                  <p className="text-xs text-gray-600">
                    synced from QuickBooks
                  </p>
                </div>
              </div>

              {/* Sync Actions */}
              <div className="space-y-3">
                <h4 className="font-medium">Data Synchronization</h4>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => syncData("accounts")}
                    disabled={syncing}
                  >
                    {syncing ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Sync Accounts
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => syncData("vendors")}
                    disabled={syncing}
                  >
                    {syncing ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Sync Vendors
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => syncData("all")}
                    disabled={syncing}
                  >
                    {syncing ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Sync All Data
                  </Button>
                </div>
              </div>

              {/* Recent Sync Logs */}
              {status.syncLogs.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Recent Sync Activity</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {status.syncLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded"
                      >
                        <div className="flex items-center">
                          {getStatusIcon(log.status)}
                          <div className="ml-3">
                            <p className="text-sm font-medium capitalize">
                              {log.syncType} sync
                            </p>
                            <p className="text-xs text-gray-600">
                              {new Date(log.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              log.status === "success"
                                ? "default"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {log.status}
                          </Badge>
                          {log.status === "success" && (
                            <p className="text-xs text-gray-600 mt-1">
                              {log.recordsAffected} records
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
