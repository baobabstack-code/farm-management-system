import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Join FarmFlow Today
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Create your account and start managing your farm
          </p>
        </div>
        <div className="flex justify-center">
          <SignUp
            appearance={{
              elements: {
                formButtonPrimary:
                  "bg-green-600 hover:bg-green-700 text-sm normal-case",
                card: "shadow-lg border border-gray-200",
                headerTitle: "text-gray-900",
                headerSubtitle: "text-gray-600",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
