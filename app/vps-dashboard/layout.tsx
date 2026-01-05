import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VPS Observatory | Alessa Cloud',
  description: 'Visual system control center for your VPS infrastructure',
};

export default function VPSDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {children}
    </div>
  );
}
