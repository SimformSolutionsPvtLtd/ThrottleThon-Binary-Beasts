import { Injectable, inject, InjectionToken } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginRequest, LoginResponse, User } from '../models/auth.model';
import { TenantBranding, TenantMembership } from '../models/tenant.model';
import { DataStatus } from '../models/data-status.model';
import { Scenario } from '../models/scenario.model';
import { Developer, Allocation } from '../models/developer.model';
import { ForecastInput, ForecastResult, WinnerInfo } from '../models/forecast.model';
import { DebateResult } from '../models/debate.model';
import { BriefRequest, BriefData } from '../models/brief.model';

export interface AppConfig {
  apiBaseUrl: string;
  production: boolean;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface ForecastResponse {
  results: ForecastResult[];
  winner: WinnerInfo | null;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  private get base(): string {
    return this.config.apiBaseUrl;
  }

  private url(path: string): string {
    return `${this.base}${path}`;
  }

  // Auth
  login(data: LoginRequest): Observable<ApiEnvelope<LoginResponse>> {
    return this.http.post<ApiEnvelope<LoginResponse>>(this.url('/api/v1/auth/login'), data);
  }

  refreshToken(token: string): Observable<ApiEnvelope<{ accessToken: string }>> {
    return this.http.post<ApiEnvelope<{ accessToken: string }>>(this.url('/api/v1/auth/refresh'), { refreshToken: token });
  }

  getMe(): Observable<ApiEnvelope<User>> {
    return this.http.get<ApiEnvelope<User>>(this.url('/api/v1/auth/me'));
  }

  getUserTenants(): Observable<ApiEnvelope<TenantMembership[]>> {
    return this.http.get<ApiEnvelope<TenantMembership[]>>(this.url('/api/v1/auth/tenants'));
  }

  // Status
  getStatus(): Observable<ApiEnvelope<DataStatus>> {
    return this.http.get<ApiEnvelope<DataStatus>>(this.url('/api/v1/status'));
  }

  // Scenarios
  getScenarios(): Observable<ApiEnvelope<Scenario[]>> {
    return this.http.get<ApiEnvelope<Scenario[]>>(this.url('/api/v1/scenarios'));
  }

  getScenario(externalId: string): Observable<ApiEnvelope<Scenario>> {
    return this.http.get<ApiEnvelope<Scenario>>(this.url(`/api/v1/scenarios/${externalId}`));
  }

  createScenario(data: Partial<Scenario>): Observable<ApiEnvelope<Scenario>> {
    return this.http.post<ApiEnvelope<Scenario>>(this.url('/api/v1/scenarios'), data);
  }

  updateScenario(externalId: string, data: Partial<Scenario>): Observable<ApiEnvelope<Scenario>> {
    return this.http.put<ApiEnvelope<Scenario>>(this.url(`/api/v1/scenarios/${externalId}`), data);
  }

  // Developers
  getDevelopers(): Observable<ApiEnvelope<Developer[]>> {
    return this.http.get<ApiEnvelope<Developer[]>>(this.url('/api/v1/developers'));
  }

  getDeveloper(pseudonym: string): Observable<ApiEnvelope<Developer>> {
    return this.http.get<ApiEnvelope<Developer>>(this.url(`/api/v1/developers/${pseudonym}`));
  }

  getBenchDevelopers(): Observable<ApiEnvelope<Developer[]>> {
    return this.http.get<ApiEnvelope<Developer[]>>(this.url('/api/v1/developers/bench'));
  }

  // Forecast
  computeForecast(input: ForecastInput): Observable<ApiEnvelope<ForecastResponse>> {
    return this.http.post<ApiEnvelope<ForecastResponse>>(this.url('/api/v1/forecast'), input);
  }

  // Allocations
  getAllocations(scenarioExternalId?: string): Observable<ApiEnvelope<Allocation[]>> {
    let params = new HttpParams();
    if (scenarioExternalId) params = params.set('scenarioExternalId', scenarioExternalId);
    return this.http.get<ApiEnvelope<Allocation[]>>(this.url('/api/v1/allocations'), { params });
  }

  updateAllocation(data: Allocation): Observable<ApiEnvelope<Allocation>> {
    return this.http.put<ApiEnvelope<Allocation>>(this.url('/api/v1/allocations'), data);
  }

  bulkUpdateAllocations(data: Allocation[]): Observable<ApiEnvelope<Allocation[]>> {
    return this.http.put<ApiEnvelope<Allocation[]>>(this.url('/api/v1/allocations/bulk'), data);
  }

  deleteAllocation(scenarioExternalId: string, devPseudonym: string): Observable<ApiEnvelope<void>> {
    return this.http.delete<ApiEnvelope<void>>(this.url(`/api/v1/allocations/${scenarioExternalId}/${devPseudonym}`));
  }

  resetAllocations(scenarioExternalId: string): Observable<ApiEnvelope<void>> {
    return this.http.delete<ApiEnvelope<void>>(this.url(`/api/v1/allocations/${scenarioExternalId}`));
  }

  // Ingestion
  triggerIngestion(source: string): Observable<ApiEnvelope<unknown>> {
    return this.http.post<ApiEnvelope<unknown>>(this.url(`/api/v1/ingest/${source}`), {});
  }

  getParsedData(source: string, forceRefresh = false): Observable<ApiEnvelope<unknown>> {
    let params = new HttpParams();
    if (forceRefresh) params = params.set('forceRefresh', 'true');
    return this.http.get<ApiEnvelope<unknown>>(this.url(`/api/v1/ingest/${source}/parsed`), { params });
  }

  triggerAllIngestion(): Observable<ApiEnvelope<unknown>> {
    return this.http.post<ApiEnvelope<unknown>>(this.url('/api/v1/ingest/all'), {});
  }

  // Debate
  runDebate(scenarioExternalIds: string[]): Observable<ApiEnvelope<DebateResult[]>> {
    return this.http.post<ApiEnvelope<DebateResult[]>>(this.url('/api/v1/debate'), { scenarioExternalIds });
  }

  getDebateResult(scenarioExternalId: string): Observable<ApiEnvelope<DebateResult>> {
    return this.http.get<ApiEnvelope<DebateResult>>(this.url(`/api/v1/debate/${scenarioExternalId}`));
  }

  // Identity Map
  getIdentityMap(): Observable<ApiEnvelope<Record<string, { realName: string; email: string }>>> {
    return this.http.get<ApiEnvelope<Record<string, { realName: string; email: string }>>>(this.url('/api/v1/identity-map'));
  }

  // Brief
  generateBrief(data: BriefRequest): Observable<ApiEnvelope<BriefData>> {
    return this.http.post<ApiEnvelope<BriefData>>(this.url('/api/v1/brief'), data);
  }

  // Tenant
  getTenantBranding(slug: string): Observable<ApiEnvelope<TenantBranding>> {
    let params = new HttpParams().set('slug', slug);
    return this.http.get<ApiEnvelope<TenantBranding>>(this.url('/api/v1/tenants/branding'), { params });
  }

  getCurrentTenant(): Observable<ApiEnvelope<unknown>> {
    return this.http.get<ApiEnvelope<unknown>>(this.url('/api/v1/tenants/current'));
  }

  updateTenant(data: unknown): Observable<ApiEnvelope<unknown>> {
    return this.http.put<ApiEnvelope<unknown>>(this.url('/api/v1/tenants/current'), data);
  }

  getMembers(): Observable<ApiEnvelope<unknown[]>> {
    return this.http.get<ApiEnvelope<unknown[]>>(this.url('/api/v1/tenants/members'));
  }

  addMember(data: unknown): Observable<ApiEnvelope<unknown>> {
    return this.http.post<ApiEnvelope<unknown>>(this.url('/api/v1/tenants/members'), data);
  }

  updateMemberRole(userId: string, roleId: string): Observable<ApiEnvelope<unknown>> {
    return this.http.put<ApiEnvelope<unknown>>(this.url(`/api/v1/tenants/members/${userId}/role`), { roleId });
  }

  removeMember(userId: string): Observable<ApiEnvelope<void>> {
    return this.http.delete<ApiEnvelope<void>>(this.url(`/api/v1/tenants/members/${userId}`));
  }

  // Audit Logs
  getAuditLogs(filters?: Record<string, string>): Observable<ApiEnvelope<unknown[]>> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => { params = params.set(k, v); });
    }
    return this.http.get<ApiEnvelope<unknown[]>>(this.url('/api/v1/audit-logs'), { params });
  }

  // Health
  getHealth(): Observable<unknown> {
    return this.http.get(this.url('/api/v1/health'));
  }
}
