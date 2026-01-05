'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { TenantInfo, SubTenantInfo } from '@/lib/vps-dashboard/types';

interface TenantNodeData {
  tenant: TenantInfo | SubTenantInfo;
  isSubTenant?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

interface TenantNodeProps {
  data: TenantNodeData;
}

function TenantNode({ data }: TenantNodeProps) {
  const { tenant, isSubTenant, isSelected, onClick } = data;
  const primaryColor = tenant.primaryColor || '#3b82f6';
  const statusColors: Record<string, string> = {
    LIVE: 'bg-green-500',
    APPROVED: 'bg-blue-500',
    PENDING_REVIEW: 'bg-yellow-500',
    PAUSED: 'bg-orange-500',
    ARCHIVED: 'bg-gray-500',
  };

  const statusColor = statusColors[tenant.status] || 'bg-gray-500';
  const isFullTenant = 'orderCount' in tenant;

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-xl border-2 transition-all duration-200
        ${isSubTenant ? 'bg-slate-800/80 p-3 min-w-[160px]' : 'bg-slate-800 p-4 min-w-[200px]'}
        ${onClick ? 'cursor-pointer hover:scale-105' : ''}
        ${isSelected ? 'ring-2 ring-offset-2 ring-offset-slate-900' : ''}
      `}
      style={{
        borderColor: isSelected ? primaryColor : `${primaryColor}80`,
        boxShadow: isSelected ? `0 0 30px ${primaryColor}40` : `0 0 15px ${primaryColor}20`,
        '--tw-ring-color': primaryColor,
      } as React.CSSProperties}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-slate-600 !border-slate-500 !w-3 !h-3"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-slate-600 !border-slate-500 !w-3 !h-3"
      />

      {/* Status indicator */}
      <div
        className={`absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full ${statusColor} ring-2 ring-slate-800`}
        title={tenant.status}
      />

      {/* Logo or Icon */}
      <div className="flex items-center gap-3 mb-2">
        {tenant.logoUrl ? (
          <div
            className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden"
            style={{ borderColor: primaryColor }}
          >
            <img
              src={tenant.logoUrl}
              alt={tenant.name}
              className="w-8 h-8 object-contain"
            />
          </div>
        ) : (
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
            style={{ backgroundColor: `${primaryColor}30` }}
          >
            {isSubTenant ? '🏷️' : '🏪'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm truncate" title={tenant.name}>
            {tenant.name}
          </h3>
          <p className="text-xs text-slate-400 font-mono truncate">
            {tenant.slug}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Menu Items</span>
          <span className="text-slate-300 font-medium">
            {'menuItemCount' in tenant ? tenant.menuItemCount : 0}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Sections</span>
          <span className="text-slate-300 font-medium">
            {'menuSectionCount' in tenant ? tenant.menuSectionCount : 0}
          </span>
        </div>
        {isFullTenant && (
          <>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Orders</span>
              <span className="text-slate-300 font-medium">{(tenant as TenantInfo).orderCount}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Customers</span>
              <span className="text-slate-300 font-medium">{(tenant as TenantInfo).customerCount}</span>
            </div>
          </>
        )}
      </div>

      {/* Sub-tenant indicator */}
      {isFullTenant && (tenant as TenantInfo).subTenants?.length > 0 && (
        <div
          className="mt-2 pt-2 border-t border-slate-700 flex items-center gap-1 text-xs"
          style={{ color: primaryColor }}
        >
          <span>🔗</span>
          <span>{(tenant as TenantInfo).subTenants.length} sub-tenant(s)</span>
        </div>
      )}

      {/* Color preview bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1 rounded-b-lg"
        style={{
          background: `linear-gradient(to right, ${primaryColor}, ${tenant.secondaryColor || primaryColor})`,
        }}
      />
    </div>
  );
}

export default memo(TenantNode);
