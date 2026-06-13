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
  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.url('/api/v1/auth/login'), data);
  }

  refreshToken(token: string): Observable<{ accessToken: string }> {
    return this.http.post<{ accessToken: string }>(this.url('/api/v1/auth/refresh'), { refreshToken: token });
  }

  getMe(): Observable<User> {
    return this.http.get<User>(this.url('/api/v1/auth/me'));
  }

  getUserTenants(): Observable<TenantMembership[]> {
    return this.http.get<TenantMembership[]>(this.url('/api/v1/auth/tenants'));
  }

  // Status
  getStatus(): Observable<DataStatus> {
    return this.http.get<DataStatus>(this.url('/api/v1/status'));
  }

  // Scenarios
  getScenarios(): Observable<Scenario[]> {
    return this.http.get<Scenario[]>(this.url('/api/v1/scenarios'));
  }

  getScenario(externalId: string): Observable<Scenario> {
    return this.http.get<Scenario>(this.url(`/api/v1/scenarios/${externalId}`));
  }

  createScenario(data: Partial<Scenario>): Observable<Scenario> {
    return this.http.post<Scenario>(this.url('/api/v1/scenarios'), data);
  }

  updateScenario(externalId: string, data: Partial<Scenario>): Observable<Scenario> {
    return this.http.put<Scenario>(this.url(`/api/v1/scenarios/${externalId}`), data);
  }

  // Developers
  getDevelopers(): Observable<Developer[]> {
    return this.http.get<Developer[]>(this.url('/api/v1/developers'));
  }

  getDeveloper(pseudonym: string): Observable<Developer> {
    return this.http.get<Developer>(this.url(`/api/v1/developers/${pseudonym}`));
  }

  getBenchDevelopers(): Observable<Developer[]> {
    return this.http.get<Developer[]>(this.url('/api/v1/developers/bench'));
  }

  // Forecast
  computeForecast(input: ForecastInput): Observable<ForecastResponse> {
    return this.http.post<ForecastResponse>(this.url('/api/v1/forecast'), input);
  }

  // Allocations
  getAllocations(scenarioExternalId?: string): Observable<Allocation[]> {
    let params = new HttpParams();
    if (scenarioExternalId) params = params.set('scenarioExternalId', scenarioExternalId);
    return this.http.get<Allocation[]>(this.url('/api/v1/allocations'), { params });
  }

  updateAllocation(data: Allocation): Observable<Allocation> {
    return this.http.put<Allocation>(this.url('/api/v1/allocations'), data);
  }

  bulkUpdateAllocations(data: Allocation[]): Observable<Allocation[]> {
    return this.http.put<Allocation[]>(this.url('/api/v1/allocations/bulk'), data);
  }

  deleteAllocation(scenarioExternalId: string, devPseudonym: string): Observable<void> {
    return this.http.delete<void>(this.url(`/api/v1/allocations/${scenarioExternalId}/${devPseudonym}`));
  }

  resetAllocations(scenarioExternalId: string): Observable<void> {
    return this.http.delete<void>(this.url(`/api/v1/allocations/${scenarioExternalId}`));
  }

  // Ingestion
  triggerIngestion(source: string): Observable<unknown> {
    return this.http.post<unknown>(this.url(`/api/v1/ingest/${source}`), {});
  }

  getParsedData(source: string, forceRefresh = false): Observable<unknown> {
    let params = new HttpParams();
    if (forceRefresh) params = params.set('forceRefresh', 'true');
    return this.http.get<unknown>(this.url(`/api/v1/ingest/${source}/parsed`), { params });
  }

  triggerAllIngestion(): Observable<unknown> {
    return this.http.post<unknown>(this.url('/api/v1/ingest/all'), {});
  }

  // Debate
  runDebate(scenarioExternalIds: string[]): Observable<DebateResult[]> {
    return this.http.post<DebateResult[]>(this.url('/api/v1/debate'), { scenarioExternalIds });
  }

  getDebateResult(scenarioExternalId: string): Observable<DebateResult> {
    return this.http.get<DebateResult>(this.url(`/api/v1/debate/${scenarioExternalId}`));
  }

  // Identity Map
  getIdentityMap(): Observable<Record<string, { realName: string; email: string }>> {
    return this.http.get<Record<string, { realName: string; email: string }>>(this.url('/api/v1/identity-map'));
  }

  // Brief
  generateBrief(data: BriefRequest): Observable<BriefData> {
    return this.http.post<BriefData>(this.url('/api/v1/brief'), data);
  }

  // Tenant
  getTenantBranding(slug: string): Observable<TenantBranding> {
    let params = new HttpParams().set('slug', slug);
    return this.http.get<TenantBranding>(this.url('/api/v1/tenants/branding'), { params });
  }

  getCurrentTenant(): Observable<unknown> {
    return this.http.get<unknown>(this.url('/api/v1/tenants/current'));
  }

  updateTenant(data: unknown): Observable<unknown> {
    return this.http.put<unknown>(this.url('/api/v1/tenants/current'), data);
  }

  getMembers(): Observable<unknown[]> {
    return this.http.get<unknown[]>(this.url('/api/v1/tenants/members'));
  }

  addMember(data: unknown): Observable<unknown> {
    return this.http.post<unknown>(this.url('/api/v1/tenants/members'), data);
  }

  updateMemberRole(userId: string, roleId: string): Observable<unknown> {
    return this.http.put<unknown>(this.url(`/api/v1/tenants/members/${userId}/role`), { roleId });
  }

  removeMember(userId: string): Observable<void> {
    return this.http.delete<void>(this.url(`/api/v1/tenants/members/${userId}`));
  }

  // Audit Logs
  getAuditLogs(filters?: Record<string, string>): Observable<unknown[]> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => { params = params.set(k, v); });
    }
    return this.http.get<unknown[]>(this.url('/api/v1/audit-logs'), { params });
  }

  // Health
  getHealth(): Observable<unknown> {
    return this.http.get(this.url('/api/v1/health'));
  }
}
