export default function VPSTestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">VPS Test Page</h1>
        <p className="text-slate-400">
          This page was created to test VPS Observatory live sync.
        </p>
        <p className="text-slate-500 mt-2">
          Created at: {new Date().toISOString()}
        </p>
      </div>
    </div>
  );
}
