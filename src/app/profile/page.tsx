import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="content-container py-8">
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-500 to-gray-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
              <span className="text-white text-2xl">👤</span>
            </div>
            <div>
              <h1 className="text-display text-gray-900">User Profile</h1>
              <p className="text-gray-600 mt-1">
                Manage your account information and preferences
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-2">
              <div className="card-enhanced p-8">
                <div className="flex items-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-6">
                    <span className="text-white text-2xl font-bold">
                      {(
                        user?.firstName?.[0] ||
                        user?.username?.[0] ||
                        "U"
                      ).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </h2>
                    <p className="text-gray-600">
                      {user?.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="metric-card">
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Full Name
                    </label>
                    <div className="text-lg font-semibold text-gray-900">
                      {user?.firstName} {user?.lastName || "Not set"}
                    </div>
                  </div>

                  <div className="metric-card">
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Username
                    </label>
                    <div className="text-lg font-semibold text-gray-900">
                      {user?.username || "Not set"}
                    </div>
                  </div>

                  <div className="metric-card md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Email Address
                    </label>
                    <div className="text-lg font-semibold text-gray-900">
                      {user?.primaryEmailAddress?.emailAddress}
                    </div>
                  </div>

                  <div className="metric-card">
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Account Created
                    </label>
                    <div className="text-lg font-semibold text-gray-900">
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "Not available"}
                    </div>
                  </div>

                  <div className="metric-card">
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Last Updated
                    </label>
                    <div className="text-lg font-semibold text-gray-900">
                      {user?.updatedAt
                        ? new Date(user.updatedAt).toLocaleDateString()
                        : "Not available"}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex space-x-4">
                  <button className="btn-enhanced btn-primary">
                    <span className="mr-2">✏️</span>
                    Edit Profile
                  </button>
                  <button className="btn-enhanced bg-gray-500 text-white hover:bg-gray-600 focus:ring-gray-500">
                    <span className="mr-2">⚙️</span>
                    Account Settings
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats Sidebar */}
            <div className="space-y-6">
              <div className="card-enhanced p-6">
                <h3 className="text-heading text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Account Status
                    </span>
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">User ID</span>
                    <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {userId?.slice(-8)}...
                    </span>
                  </div>
                </div>
              </div>

              <div className="card-enhanced p-6">
                <h3 className="text-heading text-gray-900 mb-4">
                  Farm Overview
                </h3>
                <div className="space-y-3">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <div className="text-sm text-green-600">Active Crops</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <div className="text-sm text-blue-600">Pending Tasks</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
