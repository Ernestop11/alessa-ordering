/**
 * VPS Observatory - Type Definitions
 * A living, breathing visual control center for your VPS
 */

// ============================================
// PAGE & API TYPES
// ============================================

export type PageGroup =
  | 'public'           // /order, /checkout, /catalog, /bakery, /grocery
  | 'admin'            // /admin/*
  | 'super-admin'      // /super-admin/*
  | 'associate'        // /associate/*
  | 'accountant'       // /accountant/*
  | 'customer'         // /customer/*
  | 'auth'             // Login pages
  | 'test';            // /test/*

export interface VPSPageNode {
  id: string;
  route: string;
  filePath: string;
  componentName: string;
  group: PageGroup;
  lastModified: string;
  position: { x: number; y: number };
  previewUrl: string;
  requiresAuth: boolean;
  hasClientDirective: boolean;
  imports: string[];
}

export interface VPSApiNode {
  id: string;
  route: string;
  filePath: string;
  methods: ('GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH')[];
  group: string;
  lastModified: string;
  position: { x: number; y: number };
}

// ============================================
// SYSTEM STATUS TYPES
// ============================================

export interface NginxSite {
  domain: string;
  configPath: string;
  proxyTo: string;
  sslExpires: string | null;
  status: 'healthy' | 'warning' | 'error';
}

export interface NginxStatus {
  status: 'running' | 'stopped';
  sites: NginxSite[];
  requestsPerMin: number;
  uptime: string;
}

export interface PM2App {
  id: number;
  name: string;
  status: 'online' | 'errored' | 'stopped';
  port: number;
  memory: string;
  memoryBytes: number;
  cpu: number;
  uptime: string;
  restarts: number;
  pid: number;
  serves: string[];  // domains this app serves
}

export interface PM2Status {
  apps: PM2App[];
  totalMemory: string;
}

export interface PostgresDatabase {
  name: string;
  owner: string;
  size: string;
  tableCount: number;
}

export interface PostgresTable {
  name: string;
  schema: string;
  rowCount: number;
  size: string;
  relationships: {
    to: string;
    type: 'hasMany' | 'belongsTo' | 'hasOne';
  }[];
}

export interface PostgresStatus {
  status: 'running' | 'stopped';
  version: string;
  connections: number;
  maxConnections: number;
  databases: PostgresDatabase[];
  uptime: string;
}

export interface RedisStatus {
  status: 'running' | 'stopped';
  memory: string;
  keys: number;
  uptime: string;
}

export interface SystemMetrics {
  memoryUsed: string;
  memoryTotal: string;
  memoryPercent: number;
  diskUsed: string;
  diskTotal: string;
  diskPercent: number;
  cpuLoad: number;
  uptime: string;
  uptimeDays: number;
}

export interface SystemOverview {
  nginx: NginxStatus;
  pm2: PM2Status;
  postgres: PostgresStatus;
  redis: RedisStatus;
  system: SystemMetrics;
  tenants: TenantInfo[];
  scannedAt: string;
}

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  status: string;
  domain: string | null;
  customDomain: string | null;
  hasAssets: boolean;
  primaryColor: string | null;
  secondaryColor: string | null;
  logoUrl: string | null;
  parentTenantId: string | null;
  subTenants: SubTenantInfo[];
  menuSectionCount: number;
  menuItemCount: number;
  orderCount: number;
  customerCount: number;
}

export interface SubTenantInfo {
  id: string;
  name: string;
  slug: string;
  status: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  logoUrl: string | null;
  menuSectionCount: number;
  menuItemCount: number;
}

// ============================================
// CANVAS STATE TYPES
// ============================================

export interface CanvasViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface CanvasState {
  viewport: CanvasViewport;
  selectedNodeId: string | null;
  activeOffice: 'overview' | 'nginx' | 'pm2' | 'postgres' | 'redis' | 'pages' | 'apis' | null;
}

// ============================================
// UI COMPONENT TYPES
// ============================================

export interface OfficeProps {
  onClose: () => void;
  onNavigate: (office: CanvasState['activeOffice']) => void;
}

export interface SystemNodeData {
  type: 'nginx' | 'pm2' | 'postgres' | 'redis' | 'internet' | 'tenant';
  label: string;
  status: 'healthy' | 'warning' | 'error' | 'offline';
  stats?: Record<string, string | number>;
  onClick?: () => void;
}

export interface PageNodeData {
  page: VPSPageNode;
  isSelected: boolean;
  onClick: () => void;
}

// ============================================
// GROUP CONFIGURATIONS
// ============================================

export const GROUP_COLORS: Record<PageGroup | 'api', string> = {
  'public': '#10b981',       // Emerald
  'admin': '#3b82f6',        // Blue
  'super-admin': '#8b5cf6',  // Purple
  'associate': '#f59e0b',    // Amber
  'accountant': '#6366f1',   // Indigo
  'customer': '#ec4899',     // Pink
  'auth': '#64748b',         // Slate
  'test': '#78716c',         // Stone
  'api': '#06b6d4',          // Cyan
};

export const SYSTEM_COLORS = {
  nginx: '#22c55e',      // Green
  pm2: '#3b82f6',        // Blue
  postgres: '#8b5cf6',   // Purple
  redis: '#ef4444',      // Red
  mongodb: '#10b981',    // Emerald
  internet: '#fbbf24',   // Amber
};

export const GROUP_LABELS: Record<PageGroup, string> = {
  'public': 'Public Pages',
  'admin': 'Admin Panel',
  'super-admin': 'Super Admin',
  'associate': 'Associate/MLM',
  'accountant': 'Accountant',
  'customer': 'Customer Portal',
  'auth': 'Authentication',
  'test': 'Test Pages',
};
