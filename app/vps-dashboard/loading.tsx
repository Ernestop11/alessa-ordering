export default function VPSDashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-6">
          {/* Animated orbital rings */}
          <div className="absolute inset-0 border-2 border-blue-500/30 rounded-full animate-spin" style={{ animationDuration: '3s' }} />
          <div className="absolute inset-2 border-2 border-purple-500/30 rounded-full animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
          <div className="absolute inset-4 border-2 border-green-500/30 rounded-full animate-spin" style={{ animationDuration: '1.5s' }} />

          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
          </div>
        </div>

        <h2 className="text-xl font-semibold text-white mb-2">VPS Observatory</h2>
        <p className="text-slate-400 text-sm">Scanning system components...</p>

        {/* Progress indicators */}
        <div className="mt-6 flex justify-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Nginx
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            PM2
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            PostgreSQL
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
            Redis
          </span>
        </div>
      </div>
    </div>
  );
}
