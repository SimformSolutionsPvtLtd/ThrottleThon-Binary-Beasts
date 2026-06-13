# Frontend — Claude Code Prompts (Copy-Paste Ready)

> **How to use:** Open Claude Code in your `frontend/` folder. Copy-paste ONE prompt at a time. Wait for it to finish. Test. Commit. Move to next prompt.
> Prompts reference `ai-prompt/FE-tasks.md` for context — make sure that file exists in your frontend folder.
> **CRITICAL:** The backend must be running for testing. Start it with `npm run start:dev` in the backend folder.

---

## PROMPT 1 — Phase 0: App Shell, White-Label Theming, Auth Flow

```
Read ai-prompt/FE-tasks.md for full project context. We are building SmarterSprint — a multi-tenant white-label SaaS dashboard.

This is Phase 0. We have a bare Angular 20 scaffold with package.json. Implement the COMPLETE app shell, tenant branding, and auth flow.

IMPORTANT CONSTRAINTS:
- Angular 20, standalone components everywhere — ZERO NgModules
- Angular Material 20 for UI primitives (dialog, snackbar, slider, table, chips, expansion panel, drag-drop via CDK)
- Tailwind CSS 3.4 for layout and dark theme
- Angular Signals for ALL state management — no NgRx, no BehaviorSubject for state
- NEVER use localStorage or sessionStorage — all tokens/state in memory only
- Desktop only: minimum 1280px viewport
- Dark theme is the DEFAULT
- Backend API runs at http://localhost:3000

### 1. Environment Config
src/environments/environment.ts: { production: false, apiBaseUrl: 'http://localhost:3000' }
src/environments/environment.prod.ts: { production: true, apiBaseUrl: '' } (same-origin in prod, proxied via nginx)

Create InjectionToken APP_CONFIG provided in app.config.ts.

### 2. Tailwind Config (tailwind.config.js)
darkMode: 'class'
Extend colors with CSS custom properties for white-label theming:
  brand: { primary: 'var(--brand-primary, #2563EB)', secondary: 'var(--brand-secondary, #1E40AF)', accent: 'var(--brand-accent, #3B82F6)' }
  surface: { DEFAULT: 'var(--surface, #0F172A)', raised: 'var(--surface-raised, #1E293B)', overlay: 'var(--surface-overlay, #334155)' }
  content: { DEFAULT: 'var(--content, #E2E8F0)', muted: 'var(--content-muted, #94A3B8)', accent: 'var(--content-accent, #60A5FA)' }

### 3. Global Styles (src/styles.scss)
- Import Tailwind directives (@tailwind base/components/utilities)
- Set CSS custom properties on :root for default dark theme
- Add Angular Material custom dark theme using the brand CSS variables
- html, body: bg-surface, text-content, font-sans, min-width: 1280px
- @media print: white bg, black text, hide .no-print class
- Scrollbar styling for dark theme

### 4. TypeScript Interfaces (src/app/core/models/)
Create interfaces matching the backend API responses EXACTLY:

auth.model.ts:
  LoginRequest: { email: string; password: string; tenantSlug: string }
  LoginResponse: { accessToken: string; refreshToken: string; user: User; tenantBranding: TenantBranding }
  User: { id: string; email: string; firstName: string; lastName: string; tenantId: string; tenantSlug: string; roleName: string; permissions: string[] }

tenant.model.ts:
  TenantBranding: { brandName: string; primaryColor: string; logoUrl: string | null; slug: string }
  TenantMembership: { tenantId: string; tenantSlug: string; tenantName: string; roleName: string }

data-status.model.ts:
  DataStatus: { tenant: { name: string; slug: string; plan: string }; sources: { git: SourceStatus; jira: SourceStatus; hrms: SourceStatus } }
  SourceStatus: { mode: 'sandbox' | 'live'; repoCount?: number; ticketCount?: number; sprintCount?: number; employeeCount?: number; lastSyncAt: string | null }

scenario.model.ts:
  Scenario: { id: string; externalId: string; name: string; description: string; category: string; baseEffortPoints: number; config: ScenarioConfig; isActive: boolean }
  ScenarioConfig: { riskFactors: string[]; assumptions: string[]; applicableLabels: string[]; expectedOutcome: string }

developer.model.ts:
  Developer: { pseudonym: string; role: string; department: string; tenureYears: number; costBand: string; skills: Skill[]; currentAllocation: { project: string; percent: number }; availablePercent?: number }
  Skill: { tech: string; proficiency: number; source: string }
  Allocation: { devPseudonym: string; scenarioExternalId: string; allocationPercent: number }

forecast.model.ts:
  ForecastInput: { scenarioIds: string[]; priorityPressure: number; scopePercent: number; contingencyBuffer: number; allocations: Array<{ devPseudonym: string; scenarioExternalId: string; allocationPercent: number }> }
  ForecastResult: { scenarioId: string; adjustedEffortPoints: number; projectTimelineWeeks: number; projectCost: number; riskAdjustedCost: number; confidenceScore: number; breakdown: ForecastBreakdown }
  ForecastBreakdown: { baseEffort: number; labelMultiplier: number; complexityMultiplier: number; teamCapacityFactor: number; frictionFactor: number; priorityPressure: number; scopeMultiplier: number; contingencyMultiplier: number; sprintCapacity: number; monthlyTeamCost: number }
  WinnerInfo: { scenarioId: string; reason: string }

debate.model.ts:
  DebateResult: { scenarioExternalId: string; frictionFactor: number; confidenceScore: number; keyRisks: KeyRisk[]; debateLog: DebateEntry[]; meta: { mode: 'live' | 'fixture' | 'cached'; totalDurationMs: number; roundsCompleted: number } }
  KeyRisk: { risk: string; severity: 'critical' | 'high' | 'medium' | 'low'; sourceAgent: string; evidence: string }
  DebateEntry: { round: number; agent: string; position: string; argument: string; evidenceCited: string[] }
  DebateProgress: { currentAgent: string; round: number; completedAgents: number; totalAgents: number }

brief.model.ts:
  BriefRequest: { scenarioExternalId: string; includeRealNames?: boolean }
  BriefData: { generatedAt: string; tenant: { name: string; brandName: string; logoUrl: string | null }; scenario: { name: string; description: string; category: string; externalId: string }; forecast: ForecastResult; team: BriefTeamMember[]; risks: KeyRisk[]; debateSummary: string; recommendation: { scenarioId: string; reason: string } | null }
  BriefTeamMember: { pseudonym: string; realName?: string; role: string; costBand: string; allocationPercent: number; topSkills: string[] }

### 5. API Service (src/app/core/services/api.service.ts)
Single @Injectable({ providedIn: 'root' }) service. ALL HTTP calls go through here. No component ever uses HttpClient directly.

Group methods by domain (matching backend endpoints EXACTLY):
Auth: login(data: LoginRequest), refreshToken(token: string), getMe(), getUserTenants()
Status: getStatus()
Scenarios: getScenarios(), getScenario(externalId), createScenario(data), updateScenario(externalId, data)
Developers: getDevelopers(), getDeveloper(pseudonym), getBenchDevelopers()
Forecast: computeForecast(input: ForecastInput)
Allocations: getAllocations(scenarioExternalId?), updateAllocation(data), bulkUpdateAllocations(data[]), deleteAllocation(scenarioExternalId, devPseudonym), resetAllocations(scenarioExternalId)
Ingestion: triggerIngestion(source), getParsedData(source, forceRefresh?), triggerAllIngestion()
Debate: runDebate(scenarioExternalIds: string[]), getDebateResult(scenarioExternalId)
IdentityMap: getIdentityMap()
Brief: generateBrief(data: BriefRequest)
Tenant: getTenantBranding(slug), getCurrentTenant(), updateTenant(data), getMembers(), addMember(data), updateMemberRole(userId, roleId), removeMember(userId)
AuditLogs: getAuditLogs(filters?)
Health: getHealth()

Base URL from APP_CONFIG.apiBaseUrl.

### 6. Auth Service (src/app/core/services/auth.service.ts)
Signals-based auth state:
  currentUser = signal<User | null>(null)
  accessToken = signal<string | null>(null)  // IN MEMORY ONLY
  refreshTokenStr = signal<string | null>(null)  // IN MEMORY ONLY
  isAuthenticated = computed(() => !!this.currentUser())
  userRole = computed(() => this.currentUser()?.roleName ?? null)
  userPermissions = computed(() => this.currentUser()?.permissions ?? [])
  tenantId = computed(() => this.currentUser()?.tenantId ?? null)
  tenantSlug = computed(() => this.currentUser()?.tenantSlug ?? null)

Methods:
  login(email, password, tenantSlug): calls api.login() → stores tokens in signals, stores user, returns user
  logout(): clears all signals, navigates to /auth/login
  refreshAccessToken(): calls api.refreshToken() → updates accessToken signal
  hasPermission(perm: string): boolean — checks userPermissions()
  hasAnyPermission(...perms: string[]): boolean

### 7. Tenant Branding Service (src/app/core/services/tenant-branding.service.ts)
  branding = signal<TenantBranding | null>(null)
  loadBranding(slug: string): calls GET /api/v1/tenants/branding?slug= (no auth needed), sets CSS custom properties on document.documentElement, updates branding signal
  Register as APP_INITIALIZER: extract slug from URL query param (?tenant=vectorfin) or subdomain, call loadBranding(). Use 'vectorfin' as default if nothing found.

### 8. HTTP Interceptors (src/app/core/interceptors/)
Create as functional interceptors (Angular 20 withInterceptors style):

auth.interceptor.ts:
  If accessToken exists → add Authorization: Bearer <token> header
  On 401 response → attempt refreshAccessToken() → retry original request → if refresh fails → logout()

error.interceptor.ts:
  Catch HTTP errors → show MatSnackBar with user-friendly messages:
  400: show server message, 401: "Session expired" → redirect login, 403: "Permission denied", 404: "Not found", 429: "Too many requests, wait a moment", 500+: "Something went wrong"

Register in app.config.ts: provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]))

### 9. Route Guards (src/app/core/guards/)
auth.guard.ts: if not authenticated → redirect /auth/login?returnUrl=<current>
permission.guard.ts: reads route data { permissions: ['admin','super_admin'] }, checks user role

### 10. Routing (src/app/app.routes.ts)
/auth/login → LoginComponent
/ → redirects to /dashboard (guarded by authGuard)
/dashboard → DashboardComponent
/scenarios → ScenariosListComponent (placeholder)
/developers → DevelopersListComponent (placeholder)
/allocations → AllocationBoardComponent (placeholder)
/debate/:scenarioExternalId → DebateTimelineComponent (placeholder)
/brief/:scenarioExternalId → BriefComponent (placeholder)
/admin → AdminLayoutComponent (guarded by permission guard, requires 'admin' or 'super_admin' role)
  /admin/users → UserManagementComponent (placeholder)
  /admin/tenant → TenantSettingsComponent (placeholder)
  /admin/audit → AuditLogComponent (placeholder)

### 11. App Shell (src/app/layout/)
DashboardLayoutComponent (the main layout wrapper for all authenticated routes):
- Sidebar (collapsible):
  - Tenant logo (from branding service) at top
  - Nav items with Material icons: Dashboard (dashboard), Scenarios (compare_arrows), Developers (group), Allocations (drag_indicator), Admin (settings) — Admin only visible if user role is admin/super_admin
  - User info at bottom: name, role badge, logout button
- Top bar:
  - Page title (dynamic from route data)
  - "Show Real Names" MatSlideToggle (only visible if user hasPermission('identity-map:read'))
  - User menu (profile, switch tenant, logout)
- Main content: <router-outlet>
- Dark theme background

### 12. Login Page (src/app/features/auth/login/)
- Branded: shows tenant logo and brandName from branding service
- Form (reactive, Angular forms): email (required, email validation), password (required, min 6)
- "Sign In" button → calls authService.login(email, password, tenantSlug from branding)
- On success: navigate to returnUrl or /dashboard
- On error: show error message below form
- Dark theme, centered card layout, brand-primary accent color

### 13. Viewport Guard
If window.innerWidth < 1280: show full-screen overlay "SmarterSprint requires a desktop browser (1280px+)"

After implementation:
1. ng serve → app starts without errors
2. Visit http://localhost:4200 → redirected to /auth/login (not authenticated)
3. Login page shows tenant branding (logo, colors)
4. Login with admin@vectorfin.example / changeme → redirected to /dashboard
5. Dashboard layout: sidebar with nav, top bar, empty main content
6. DevTools → Application → localStorage and sessionStorage are EMPTY
7. Sidebar shows correct nav items, admin link visible for admin user
8. Clicking nav items navigates correctly
9. Logout → redirected to login, cannot access dashboard
10. Resize below 1280px → viewport warning appears
```

---

## PROMPT 2 — Phase 1: Dashboard Data Loading & Display

```
Read ai-prompt/FE-tasks.md Phase 1 for context.

Phase 0 is complete. We have: app shell, routing, tenant branding, auth flow, login page, sidebar, API service, all TypeScript interfaces.

Now implement Phase 1: Load real data from the backend and display it on the dashboard.

### 1. ForecastStateService (src/app/core/services/forecast-state.service.ts)
The CENTRAL state store. Every dashboard component reads from here. No component holds its own copy of data.

@Injectable({ providedIn: 'root' })
Signals:
  dataStatus = signal<DataStatus | null>(null)
  scenarios = signal<Scenario[]>([])
  activeScenarioIds = signal<string[]>([])  // externalIds of selected scenarios
  activeScenarios = computed(() => this.scenarios().filter(s => this.activeScenarioIds().includes(s.externalId)))
  developers = signal<Developer[]>([])
  benchDevelopers = computed(() => this.developers().filter(d => (d.availablePercent ?? (100 - d.currentAllocation.percent)) > 0))
  priorityPressure = signal(1.0)
  scopePercent = signal(100)
  contingencyBuffer = signal(0.10)
  allocations = signal<Allocation[]>([])
  forecastResults = signal<ForecastResult[]>([])
  winner = signal<WinnerInfo | null>(null)
  debateResults = signal<Map<string, DebateResult>>(new Map())
  identityMap = signal<Map<string, {realName: string; email: string}> | null>(null)
  showRealNames = signal(false)
  isForecastLoading = signal(false)
  isDebateLoading = signal(false)
  isIngestionLoading = signal(false)
  debateProgress = signal<DebateProgress | null>(null)

  // Helper computed
  resolvedName = computed(() => {
    const map = this.identityMap();
    const show = this.showRealNames();
    return (pseudonym: string) => (show && map?.get(pseudonym)?.realName) || pseudonym;
  })

### 2. ResolvePseudonymPipe (src/app/shared/pipes/resolve-pseudonym.pipe.ts)
@Pipe({ name: 'resolveName', standalone: true, pure: false })
Uses ForecastStateService.resolvedName() to resolve DEV_XX → real name when toggle is on.
Template usage: {{ developer.pseudonym | resolveName }}

### 3. CurrencyInrPipe (src/app/shared/pipes/currency-inr.pipe.ts)
@Pipe({ name: 'inr', standalone: true })
Formats numbers as Indian currency:
  - < 100000: "₹50,000"
  - 100000 to 9999999: "₹18.4L" (lakhs)
  - >= 10000000: "₹2.2Cr" (crores)

### 4. DashboardComponent (src/app/features/dashboard/dashboard.component.ts)
The main dashboard page that orchestrates data loading.

On init (ngOnInit or constructor with inject):
  Load in parallel: apiService.getStatus(), apiService.getScenarios(), apiService.getBenchDevelopers(), apiService.getAllocations()
  On all loaded:
    - Update forecastState signals
    - Auto-select first 2 scenarios as active
    - Call apiService.computeForecast() with default slider values and current allocations
    - Update forecastResults and winner

Layout (Tailwind grid):
  Row 1: DataStatusBar (full width)
  Row 2: ScenarioCard × 2 (side by side, equal width)
  Row 3: ParameterSliders (full width) — placeholder for Phase 2
  Row 4: FinancialChart (full width) — placeholder for Phase 2
  Row 5: AllocationBoard (full width) — placeholder for Phase 3
  Row 6: DebateTimeline (full width) — placeholder for Phase 4

Show full-page skeleton loader while data loads. Use Angular's @if with a loading signal.

### 5. DataStatusBarComponent (src/app/features/dashboard/components/data-status-bar/)
Horizontal bar showing 3 data source statuses.
Reads: forecastState.dataStatus()

For each source (Git, Jira, HRMS):
  - Material icon (code, assignment, people)
  - Status chip: "Sandbox" (amber MatChip) or "Live" (green) or "Error" (red)
  - Count text: "12 employees" / "60 tickets · 8 sprints" / "1 repo"
  - "Refresh" icon button (calls triggerIngestion for that source — just wire the click, actual ingestion is Phase 4)

Tailwind: flex row, gap-4, surface-raised bg, rounded-xl, p-4

### 6. ScenarioCardComponent (src/app/features/dashboard/components/scenario-card/)
Reusable card for one scenario. Used twice in the dashboard (one per active scenario).

Input: scenarioExternalId (string)
Reads from ForecastStateService: activeScenarios(), forecastResults(), winner()

Display:
  - Header: scenario name, category badge (MatChip)
  - Forecast numbers (large, prominent):
    - Timeline: "31.2 weeks" (1 decimal)
    - Cost: "₹18.4L" (use inr pipe)
    - Risk-Adjusted Cost: "₹22.1L" (use inr pipe, slightly bolder)
    - Confidence: circular progress (use a simple SVG circle or mat-progress-spinner in determinate mode)
  - Winner badge: green "✓ Recommended" badge if this scenario is the winner
  - Risk factors: expandable section showing scenario.config.riskFactors (collapsed by default)
  - When isForecastLoading() is true: show shimmer animation on the numbers (CSS animation, don't replace content)

Style: surface-raised, rounded-xl, p-6, border-2 border-transparent. Winner card: border-green-500/50 with subtle glow.

### 7. DevelopersListPage (src/app/features/developers/developers-list/)
Full page at /developers route showing all developers.
Reads: forecastState.developers()

Angular Material MatTable with columns:
  - Pseudonym (with resolveName pipe)
  - Role
  - Department
  - Tenure (years)
  - Cost Band (color-coded chip: C1=grey, C2=blue, C3=yellow, C4=orange, C5=red)
  - Skills (MatChip list, showing top 3 with proficiency dots)
  - Current Allocation (progress bar showing percent)

MatPaginator, MatSort on all columns. Search/filter input at top.

After implementation:
1. Navigate to /dashboard → skeleton shows briefly, then all data renders
2. Data Status Bar shows: Git (Sandbox, 1 repo), Jira (Sandbox, 60 tickets · 8 sprints), HRMS (Sandbox, 12 employees)
3. Two Scenario Cards show with names, forecast numbers, winner badge
4. /developers page shows table of 12 developers with skills, NO real names visible
5. All numbers formatted correctly (₹ in lakhs, weeks with 1 decimal)
6. No console errors
```

---

## PROMPT 3 — Phase 2: Sliders, Live Forecast, Charts

```
Read ai-prompt/FE-tasks.md Phase 2 for context.

Phases 0-1 complete. Dashboard loads data, scenario cards show forecast numbers, developers list works.

Now implement Phase 2: Interactive sliders that trigger real-time forecast recalculation, and the financial impact chart.

### 1. ParameterSlidersComponent (src/app/features/dashboard/components/parameter-sliders/)
Three Angular Material sliders in a horizontal row:

Slider 1 — Priority Pressure:
  MatSlider, min=0.5, max=2.0, step=0.1, default=1.0
  Label: "Priority Pressure" with value display: "1.0x"
  MatTooltip: "Higher = more urgency, increases effort from context-switching"

Slider 2 — Scope %:
  MatSlider, min=50, max=150, step=5, default=100
  Label: "Scope %" with value display: "100%"
  MatTooltip: "100% = full scope. Below = descoped. Above = scope creep"

Slider 3 — Contingency Buffer:
  MatSlider, min=0, max=30, step=1, default=10
  Label: "Contingency" with value display: "10%"
  MatTooltip: "Safety margin. 10% typical, 20%+ for high-risk"

Behavior:
  On ANY slider input event → update ForecastStateService signal (priorityPressure, scopePercent, contingencyBuffer)
  Use effect() that watches all three slider signals:
    - Debounce 150ms (use rxjs debounceTime via toObservable())
    - Set forecastState.isForecastLoading(true)
    - Call apiService.computeForecast({ scenarioIds: activeScenarioIds(), priorityPressure, scopePercent, contingencyBuffer: value/100, allocations: current allocations })
    - On response: update forecastState.forecastResults and winner
    - Set forecastState.isForecastLoading(false)

Style: Tailwind surface-raised card, rounded-xl, p-6. Sliders use brand-primary color. Responsive flex row with labels above.

### 2. FinancialChartComponent (src/app/features/dashboard/components/financial-chart/)
Chart.js bar+line combo via ng2-charts (BaseChartDirective).

Reads: forecastState.forecastResults(), forecastState.activeScenarios()

Configuration:
  Type: 'bar'
  X-axis labels: scenario names (from activeScenarios)
  Datasets:
    1. "Project Cost" — bar, backgroundColor: brand-primary with 60% opacity
    2. "Risk-Adjusted Cost" — bar, backgroundColor: amber-500 with 60% opacity
    3. "Confidence Score" — line, borderColor: green-400, yAxisID: 'confidence', data as percentage (0-100)

  Scales:
    y (left): title "Cost (₹)", ticks formatted in lakhs using callback
    confidence (right): title "Confidence %", min 0, max 100, position 'right'

  Dark theme:
    Chart.defaults.color = '#94A3B8' (content-muted)
    Grid: color '#334155' (surface-overlay)
    Background: transparent

  Animation: duration 400ms, easing 'easeInOutQuart'

  Reactivity: use effect() watching forecastResults signal → update chart.data and call chart.update()

Wrapper: surface-raised card, rounded-xl, p-6, header "Financial Impact Comparison"

### 3. Update ScenarioCardComponent — Animated Numbers
Add CSS transitions to the forecast number elements:
  - When values change, numbers should transition smoothly (CSS transition: all 0.3s ease)
  - Or use Angular @angular/animations for a count-up effect
  - During isForecastLoading(): subtle pulse/shimmer on number elements (don't hide them)

### 4. Scenario Selection
Add ability to toggle which scenarios are "active" (compared):
  In the Scenarios section header, add MatChip listbox with all available scenarios.
  User can select 1-4 scenarios for comparison. Selecting/deselecting triggers forecast recalculation.
  Update forecastState.activeScenarioIds accordingly.

After implementation:
1. Drag Priority Pressure from 1.0 to 1.5 → scenario card numbers update within ~250ms, chart bars animate
2. Drag Scope to 50% → costs roughly halve
3. Drag Contingency to 30% → risk-adjusted cost jumps
4. Rapid slider dragging → check Network tab, max 1 API call per 150ms (debounce working)
5. Chart shows 2 scenarios side by side with proper dark theme styling
6. Winner badge switches if cost relationship changes
7. Numbers are formatted correctly (₹ lakhs) on both cards and chart axis
```

---

## PROMPT 4 — Phase 3: Allocation Board (Drag & Drop)

```
Read ai-prompt/FE-tasks.md Phase 3 for context.

Phases 0-2 complete. Dashboard loads data, sliders work, charts animate.

Implement Phase 3: Drag-and-drop allocation board using Angular CDK DragDrop.

### AllocationBoardComponent (src/app/features/dashboard/components/allocation-board/)
Also mounted at route /allocations for full-page view.

3-column Kanban layout:
  Column 1: "Bench" — unallocated developers
  Column 2+: One column per active scenario (from forecastState.activeScenarios())

BENCH COLUMN:
  Reads: forecastState.benchDevelopers()
  Each developer card (DeveloperCardComponent) shows:
    - Pseudonym ({{ dev.pseudonym | resolveName }})
    - Role as small badge
    - Cost band badge (color-coded: C1=slate, C2=blue, C3=amber, C4=orange, C5=red)
    - Top 3 skill chips with proficiency indicator (●●●○○ for 3/5 — use Unicode or small SVG dots)
    - "Available: XX%" text (if partially allocated elsewhere)
  Style: surface-overlay bg, rounded-lg, p-3, cursor-grab

SCENARIO COLUMNS:
  Header: scenario name + total allocation summary (e.g., "3 devs · 280%")
  Shows developer cards that have Allocation records for this scenario
  Each allocated card additionally shows:
    - Allocation % — small inline MatSlider (min=1, max=availableForThisDev, step=5)
    - Changing the slider: debounce 300ms → call apiService.updateAllocation() → update forecast
    - "✕" remove button → call apiService.deleteAllocation() → dev returns to bench → update forecast

CDK DRAGDROP SETUP:
  Import CdkDragDrop, CdkDrag, CdkDropList from @angular/cdk/drag-drop
  Bench and each scenario column is a cdkDropList
  cdkDropListConnectedTo links bench ↔ all scenario columns, and scenario columns ↔ each other

  On drop event (cdkDropListDropped):
    1. If dropped in same list → reorder only (no API call)
    2. If dropped from bench to scenario:
       a. Check developer's available allocation (100 - sum of existing allocations for this dev)
       b. If available = 0: reject. Show MatSnackBar "DEV_XX is fully allocated. Remove from another scenario first." Move item back to source list.
       c. If available > 0: show a small MatDialog or inline prompt asking for allocation %:
          - Default: min(available, 100)
          - MatSlider in the dialog: min=5, max=available, step=5
          - "Allocate" and "Cancel" buttons
       d. On confirm: call apiService.updateAllocation({ devPseudonym, scenarioExternalId, allocationPercent })
       e. On success: add to forecastState.allocations, remove from bench (or reduce availablePercent), update forecastResults
    3. If dropped from scenario A to scenario B:
       - Remove from A, add to B (same allocation % prompt as above)
    4. If dropped from scenario back to bench:
       - Same as clicking remove ✕

  Drag preview: CDK default ghost (semi-transparent clone)
  Drop placeholder: dashed border outline showing where the card will land
  Animation: CDK default animations (250ms smooth transition)

KEYBOARD ACCESSIBILITY:
  - All developer cards are focusable (tabindex=0)
  - Enter/Space on a focused card: opens an accessible allocation dialog instead of drag
  - The dialog has: "Allocate to:" dropdown of scenario names + allocation % slider + Allocate/Cancel buttons
  - This provides the same functionality without requiring mouse drag

RESPONSIVE LAYOUT:
  Tailwind grid: grid-cols-3 at 1280px+, equal column widths
  Each column: surface-raised bg, rounded-xl, p-4, min-height: 400px
  Column header: sticky at top during scroll

After implementation:
1. Bench shows developers with available allocation > 0
2. Drag DEV_01 to Full Migration → allocation dialog appears → confirm → card moves, forecast updates
3. Try dragging DEV_03 (80% on Customer Portal) → max slider is 20%
4. Try dragging a 100%-allocated dev → snackbar error, card stays in bench
5. Adjust allocation slider on allocated dev → forecast recalculates
6. Click ✕ on allocated dev → returns to bench, forecast recalculates
7. Keyboard: Tab to dev, Enter, dialog opens, select scenario, confirm → works
8. Scenario column header shows correct total (e.g., "2 devs · 180%")
```

---

## PROMPT 5 — Phase 4: AI Debate Timeline & Ingestion

```
Read ai-prompt/FE-tasks.md Phase 4 for context.

Phases 0-3 complete. Full dashboard working: data display, sliders, charts, allocation drag-and-drop.

Implement Phase 4: AI debate triggering, loading state, debate timeline visualization, and ingestion refresh.

### 1. Debate Trigger Button
Add to the dashboard, between the chart and allocation board:
  Section header "AI Risk Analysis" with a button:
  MatButton (raised, brand-primary): icon "psychology" + text "Run AI Debate"
  Disabled while isDebateLoading() is true
  On click:
    forecastState.isDebateLoading.set(true)
    apiService.runDebate(forecastState.activeScenarioIds())
    On success: 
      Update forecastState.debateResults (Map keyed by scenarioExternalId)
      Auto-recalculate forecast (the frictionFactor and confidenceScore from debate are now used)
      forecastState.isDebateLoading.set(false)
    On error: snackbar "Debate failed. Using cached data." + isDebateLoading(false)

### 2. DebateLoadingComponent (src/app/features/dashboard/components/debate-loading/)
Shown when isDebateLoading() is true, in place of the debate timeline.

Visual: 4 agent icons in a row, each representing:
  🔵 Researcher (icon: science, blue-400)
  🔴 Opposer (icon: gavel, red-400)  
  🟠 Worst-Case (icon: warning, amber-400)
  🟢 Synthesizer (icon: balance, green-400)

Animation: 
  - Currently "active" agent has a pulse animation (scale up/down CSS keyframe)
  - Completed agents have a checkmark overlay
  - Cycle through agents every 3 seconds (simulated progress since we don't get real-time updates from BE)
  
Progress bar: MatProgressBar in indeterminate mode
Status text: "Round 1 — Researcher is analyzing the evidence..."  (cycles through agent names)
Elapsed timer: "Running for 12s..." (update every second)
Helper text: "This typically takes 15-25 seconds"

### 3. DebateTimelineComponent (src/app/features/dashboard/components/debate-timeline/)
Also mounted at route /debate/:scenarioExternalId for full-page view.

Reads: forecastState.debateResults()
Input: scenarioExternalId (optional — if on dashboard, show for first active scenario; if on route, use param)

TIMELINE LAYOUT (vertical):
  Round 1 header (MatExpansionPanel, expanded by default)
    Agent Card: Researcher
    Agent Card: Opposer
    Agent Card: Worst-Case
  Round 2 header (MatExpansionPanel, collapsed by default)
    Agent Card: Researcher (round 2)
    Agent Card: Opposer (round 2)
    Agent Card: Worst-Case (round 2)
  Synthesis section (always expanded)
    Synthesizer Card (special styling)
    Key Risks section

AGENT CARD component (reusable):
  - Left border: 4px solid, color = agent color (blue/red/amber/green)
  - Header: agent icon + agent name + role badge ("Advocate"/"Challenger"/"Pessimist")
  - Argument text: show first 3 lines, "Read more" toggle to expand (use MatExpansionPanel or CSS line-clamp)
  - Evidence chips: MatChip list, each chip showing a ticket ID or metric (e.g., "PORTAL-1001", "2.32x", "48.1% coverage")
  
SYNTHESIZER CARD:
  - Green left border, larger styling
  - Prominent display: Friction Factor (large number, e.g., "2.1x") and Confidence Score (circular progress, e.g., "62%")
  - Summary text with typewriter animation on first render:
    Use a signal that reveals characters progressively: setInterval adding 1 char every 10ms until complete
  
KEY RISKS SECTION:
  Renders keyRisks[] sorted by severity
  Each risk:
    - Severity badge: MatChip with color — CRITICAL (red bg), HIGH (orange bg), MEDIUM (yellow bg), LOW (grey bg)
    - Risk text
    - Source agent badge (small chip: "Opposer", "Worst-Case", etc.)
    - Evidence text (muted color, smaller)

META BAR at bottom:
  Mode indicator: "Live AI ✓" (green text) or "Demo Mode" (amber text)
  Duration: "Completed in 22.4s"
  Rounds: "2/2 rounds completed"

### 4. Ingestion Refresh Flow
Update the DataStatusBar "Refresh" buttons to actually work:
  On click: 
    forecastState.isIngestionLoading.set(true)
    Call apiService.triggerIngestion(source)
    On success: update forecastState.dataStatus with new counts, show snackbar "Jira data refreshed"
    forecastState.isIngestionLoading.set(false)
  
  Add a "Refresh All" button that calls apiService.triggerAllIngestion()
  While loading: show MatSpinner on the refresh button

After implementation:
1. Click "Run AI Debate" → loading animation shows with cycling agents
2. After response (instant with fixtures, 15-25s with Gemini) → timeline renders
3. 6 agent cards visible, color-coded, with expandable arguments
4. Evidence chips rendered (PORTAL-XXXX ticket IDs)
5. Synthesizer shows frictionFactor and confidence prominently
6. Key risks sorted by severity with color-coded badges
7. Scenario cards and chart update with new frictionFactor/confidenceScore
8. Mode indicator shows "Live AI" or "Demo Mode"
9. Refresh buttons on data status bar trigger ingestion
```

---

## PROMPT 6 — Phase 5: Brief, Show Real Names, Admin, Polish

```
Read ai-prompt/FE-tasks.md Phase 5 for context.

Phases 0-4 complete. Full dashboard with data, sliders, charts, allocation board, AI debate timeline.

Implement Phase 5: Executive brief, real names toggle, admin pages, and production polish.

### 1. Show Real Names Toggle (already wired in layout from Phase 0)
The toggle exists in the top bar but doesn't do anything yet. Now connect it:

In DashboardLayoutComponent:
  - MatSlideToggle bound to forecastState.showRealNames signal
  - Only rendered if authService.hasPermission('identity-map:read') is true
  - On toggle ON:
    If forecastState.identityMap() is null (first time):
      Call apiService.getIdentityMap()
      Convert response Record to Map, store in forecastState.identityMap
    Set forecastState.showRealNames(true)
  - On toggle OFF: set forecastState.showRealNames(false) (keep map in memory)

  Now the ResolvePseudonymPipe (created in Phase 1) automatically resolves all pseudonyms.
  Verify: every component that shows DEV_XX uses {{ pseudonym | resolveName }}

### 2. BriefComponent (src/app/features/brief/brief.component.ts)
Route: /brief/:scenarioExternalId
Also accessible via "Generate Brief" button on dashboard (navigates to this route)

On init:
  Read scenarioExternalId from route params
  Call apiService.generateBrief({ scenarioExternalId, includeRealNames: forecastState.showRealNames() && authService.hasPermission('identity-map:read') })
  Show skeleton while loading

Brief Layout (designed for print):
  .brief-container class (max-width 800px, centered, padding 40px)
  
  HEADER:
    Left: tenant logo (from branding)
    Right: "ENGINEERING DECISION BRIEF" title + "Generated: June 13, 2026" date
    Bottom border line

  SCENARIO SECTION:
    Scenario name (large heading), category badge, description (2-3 lines)

  FORECAST BOX:
    4-column grid: Timeline | Cost | Risk-Adjusted | Confidence
    Each: large number on top, label below
    Use inr pipe for costs

  TEAM TABLE:
    Simple HTML table (not MatTable — cleaner for print)
    Columns: Developer (pseudonym or real name), Role, Cost Band, Allocation %, Top Skills
    Rows: one per allocated developer

  RISKS SECTION:
    Numbered list (1-5) of top risks with severity emoji (🔴🟠🟡) and text

  DEBATE SUMMARY:
    Italic text of the synthesizer summary

  RECOMMENDATION:
    If winner exists: "Based on analysis, [scenario name] is recommended with lower risk-adjusted cost (₹XXL) and higher confidence (XX%)."
    If no winner / single scenario: "Single scenario analyzed. See risk section for key considerations."

  FOOTER:
    "Powered by SmarterSprint · Confidential" + tenant name

PRINT STYLES (in component's styles):
  @media print {
    .no-print { display: none !important }  // hide sidebar, topbar, buttons
    body { background: white !important; color: black !important }
    .brief-container { padding: 20px; max-width: 100%; font-size: 11pt }
    @page { margin: 1.5cm; size: A4 }
    table { border-collapse: collapse } td,th { border: 1px solid #ccc; padding: 6px }
  }

  Screen styles: dark theme matching rest of app

BUTTONS (screen only, .no-print):
  "Print Brief" → window.print()
  "Back to Dashboard" → router.navigate(['/dashboard'])

### 3. ScenariosListComponent (src/app/features/scenarios/scenarios-list/)
Full page at /scenarios:
  MatTable showing all scenarios with columns: Name, Category, Base Effort (pts), Status (active badge), Actions
  Actions: View details, Edit (if scenarios:write permission)
  "Create Scenario" button → dialog/form for new scenario (if scenarios:write)
  Click row → navigate to scenario detail with full config display

### 4. Admin Pages

TenantSettingsComponent (/admin/tenant):
  Reactive form with:
    - Brand Name (text input)
    - Primary Color (color input + preview swatch)
    - Logo URL (text input + image preview)
    - Save button → apiService.updateTenant(data)
    - Preview panel showing sidebar/login with new branding (live preview as you type)

UserManagementComponent (/admin/users):
  MatTable: Name, Email, Role, Joined Date, Status, Actions
  Actions:
    - Change Role: MatSelect dropdown with available roles → apiService.updateMemberRole()
    - Deactivate: Confirm dialog → apiService.removeMember()
  "Invite User" button → MatDialog with email + role selection form → apiService.addMember()
  MatPaginator, MatSort

AuditLogComponent (/admin/audit):
  MatTable: Timestamp (formatted), User (name or "System"), Action, Resource, PII Sanitised (✓/✗ chip)
  Filters row: Date range (MatDatepicker), Action type (MatSelect), Search (text)
  Click row → MatExpansionPanel shows details JSON (formatted, readonly)
  MatPaginator (page size 25)
  "Export CSV" button → generates CSV from current filtered view, triggers download

### 5. Production Polish

Loading skeletons:
  Create a SkeletonLoaderComponent (reusable):
    - Input: type = 'text' | 'card' | 'chart' | 'table'
    - Renders animated placeholder matching the shape of the real content
    - Use CSS animation: shimmer effect (linear-gradient moving left to right)
  Apply to: scenario cards, chart, allocation board, debate timeline, data status bar

Error boundary:
  Create ErrorBoundaryComponent that catches errors from child components:
    Shows "Something went wrong in this section. [Retry]" instead of crashing the whole page

Performance:
  - All dashboard child components use OnPush change detection (changeDetection: ChangeDetectionStrategy.OnPush)
  - Lazy-load the admin module (loadChildren in routes)
  - Lazy-load the brief module
  
Empty states:
  - No scenarios: "No scenarios configured. Contact your admin."
  - No developers: "No team data available."
  - No debate run: "Run an AI debate to see risk analysis."
  - No allocations: "Drag developers from the bench to allocate them."

After implementation:
1. Toggle "Show Real Names" as EM → all DEV_XX become real names throughout app
2. Toggle off → pseudonyms return
3. As viewer → toggle is completely absent from DOM
4. /brief/:id → renders clean brief, print dialog produces clean 1-page A4
5. /scenarios → shows table, CRUD works if user has scenarios:write
6. /admin/users → shows members, role change works
7. /admin/audit → shows all audit entries with filters
8. /admin/tenant → branding preview updates live, save persists
9. Skeleton loaders appear during all loading states
10. Empty states shown for missing data (no blank screens)
11. Full flow: Login → Dashboard → Adjust sliders → Allocate devs → Run debate → Generate brief → Print
```
