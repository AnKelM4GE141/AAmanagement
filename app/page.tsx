import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          AA Portal
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Property Management Platform
        </p>
        <div className="space-x-4">
          <Link
            href="/auth/login"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="inline-block px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
