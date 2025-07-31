import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              User Profile
            </h1>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <div className="mt-1 text-sm text-gray-900">
                  {session.user.username}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1 text-sm text-gray-900">
                  {session.user.email}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  User ID
                </label>
                <div className="mt-1 text-sm text-gray-900">
                  {session.user.id}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
