export default function TenantNotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">🏪</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Restaurant Not Found
        </h1>
        <p className="text-gray-600 mb-6">
          We couldn&apos;t find the restaurant you&apos;re looking for. This could happen if:
        </p>
        <ul className="text-left text-gray-600 mb-6 space-y-2">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>The restaurant hasn&apos;t been set up yet</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>You typed the address incorrectly</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>The restaurant is temporarily unavailable</span>
          </li>
        </ul>
        <div className="space-y-3">
          <a
            href="https://alessacloud.com"
            className="block w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors"
          >
            Visit Alessa Cloud
          </a>
          <button
            onClick={() => window.location.reload()}
            className="block w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
