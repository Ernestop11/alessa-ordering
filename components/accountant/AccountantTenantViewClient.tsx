'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ReportDownloader from './ReportDownloader';
import type { Tenant, TaxRemittance, TaxCheck, TaxAchPayment } from '@prisma/client';

interface Props {
  tenant: Tenant;
  accountantId: string;
  remittances: TaxRemittance[];
  checks: TaxCheck[];
  achPayments: TaxAchPayment[];
  accessLevel: string;
}

export default function AccountantTenantViewClient({
  tenant,
  accountantId,
  remittances,
  checks,
  achPayments,
  accessLevel,
}: Props) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.push(`/accountant/dashboard?accountantId=${accountantId}`)}
                className="text-sm text-blue-600 hover:text-blue-800 mb-2"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
              <p className="text-sm text-gray-600">Tax Management</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ReportDownloader tenantId={tenant.id} tenantSlug={tenant.slug} />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Remittances */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Remittances</h2>
            <div className="space-y-4">
              {remittances.map((remittance) => (
                <div key={remittance.id} className="border-b pb-4 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">
                        {new Date(remittance.periodStart).toLocaleDateString()} -{' '}
                        {new Date(remittance.periodEnd).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-600">Status: {remittance.status}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        ${remittance.totalTaxCollected.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Remitted: ${remittance.totalTaxRemitted.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Checks */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Checks</h2>
            <div className="space-y-4">
              {checks.map((check) => (
                <div key={check.id} className="border-b pb-4 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">Check #{check.checkNumber}</div>
                      <div className="text-sm text-gray-600">{check.payee}</div>
                      <div className="text-sm text-gray-600">Status: {check.status}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${check.amount.toFixed(2)}</div>
                      {check.printedAt && (
                        <div className="text-xs text-gray-500">
                          Printed: {new Date(check.printedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ACH Payments */}
        {achPayments.length > 0 && (
          <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ACH Payments</h2>
            <div className="space-y-4">
              {achPayments.map((payment) => (
                <div key={payment.id} className="border-b pb-4 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{payment.recipientName}</div>
                      <div className="text-sm text-gray-600">
                        {payment.recipientType} - {payment.status}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${payment.amount.toFixed(2)}</div>
                      {payment.confirmationNo && (
                        <div className="text-xs text-gray-500">
                          Confirmation: {payment.confirmationNo}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

