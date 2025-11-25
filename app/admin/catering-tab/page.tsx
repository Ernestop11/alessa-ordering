import DashboardLayout from '@/components/admin/DashboardLayout';
import CateringTabEditor from '@/components/admin/CateringTabEditor';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CateringTabPage() {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Catering Tab Settings</h1>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <CateringTabEditor />
        </div>
      </div>
    </DashboardLayout>
  );
}
