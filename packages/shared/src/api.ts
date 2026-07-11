/**
 * Shared API contract types: response envelopes, pagination and health.
 */

/** Standard error envelope returned by the API. */
export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
  code: string;
  /** Optional field-level validation details. */
  details?: Record<string, string[]>;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/** Health of an individual dependency. */
export const HealthStatus = {
  Up: 'up',
  Down: 'down',
  Degraded: 'degraded',
} as const;

export type HealthStatus = (typeof HealthStatus)[keyof typeof HealthStatus];

export interface DependencyHealth {
  status: HealthStatus;
  /** Latency in milliseconds, when measurable. */
  latencyMs?: number;
  message?: string;
}

export interface HealthReport {
  status: HealthStatus;
  version: string;
  uptimeSeconds: number;
  dependencies: {
    database: DependencyHealth;
    redis: DependencyHealth;
    discordGateway: DependencyHealth;
  };
}

/** Live metrics surfaced on the dashboard overview. */
export interface OverviewMetrics {
  memberCount: number;
  onlineCount: number;
  casesToday: number;
  automodEventsToday: number;
  gatewayLatencyMs: number;
  apiLatencyMs: number;
  databaseStatus: HealthStatus;
  redisStatus: HealthStatus;
}
