/** Hợp đồng dữ liệu đích. Không phải API đã triển khai. */
export type ID = string;
export type VND = number; // integer >= 0; API/DB phải validate runtime
export type Revision = number;
export type Source = {
  kind: 'user_input' | 'demo' | 'supplier_quote' | 'official_publication' | 'professional_review';
  reference: string; observedAt: string; validUntil?: string;
};
export type Project = {
  id: ID; ownerId: ID; name: string; revision: Revision;
  currency: 'VND'; country: 'VN'; activeScenarioId: ID;
  entryPath: 'reference_photo' | 'floor_plan' | 'guided';
  status: 'draft' | 'planning' | 'construction' | 'handover_pending' | 'closed' | 'archived';
};
export type FinanceProfile = {
  cash: VND; emergencyReserve: VND; netMonthlyIncome: VND;
  grossMonthlyIncome: VND | null; livingCosts: VND; existingMonthlyDebt: VND;
};
export type Loan = {
  principal: VND; months: number; method: 'annuity' | 'equal_principal';
  status: 'hypothetical' | 'approved' | 'disbursed';
  ratePeriods: Array<{ fromMonth: number; annualRate: number; source: Source }>;
  drawdowns: Array<{month: number; amount: VND}>;
};
export type Site = {
  regionCode: string; regionVersion: string; polygonMeters: Array<[number, number]>;
  roadWidthMeters: number | null; directionDegrees: number | null;
  soilStatus: 'unknown' | 'self_reported' | 'surveyed'; surveyAssetId?: ID;
  foundationStatus: 'needs_survey' | 'scenario_only' | 'professional_reviewed';
};
export type Household = {
  residents: number; bedrooms: number; hasElders: boolean; hasChildren: boolean;
  accessibilityNeeds: string[]; stylePreferences: string[];
  fengShui: {enabled: boolean; ruleVersion?: string;
    members?: Array<{id: ID; role: string; birthYear?: number; calendar?: 'lunar'|'solar'}>};
};
export type Design = {
  id: ID; scenarioId: ID; revision: Revision; units: 'm'; confirmed: boolean;
  kind: 'concept';
  floors: Array<{id: ID; elevation: number; outline: Array<[number,number]>}>;
  rooms: Array<{id: ID; floorId: ID; name: string; polygon: Array<[number,number]>}>;
  walls: Array<{id: ID; floorId: ID; from: [number,number]; to: [number,number]; height: number; thickness: number}>;
  openings: Array<{id: ID; wallId: ID; kind: 'door'|'window'; width: number; height: number; offset: number}>;
};
export type EstimateLine = {
  id: ID; description: string; quantity: number; unit: string; priceUnit: string;
  quantityConfirmed: boolean; quantitySource: Source; designEntityIds: ID[];
  unitPrice: VND; taxRate: number; wasteRate: number;
  priceSource: string; priceDate: string; priceRecordId?: ID;
};
export type Snapshot = {
  id: ID; projectId: ID; scenarioId: ID; inputRevision: Revision;
  designVersionId: ID; ruleVersion: string; createdAt: string;
  estimateKind: 'area_approximation'|'concept_takeoff'|'reviewed_quantities';
  lines: EstimateLine[]; exclusions: string[]; assumptions: string[];
  baseTotal: VND; constructionContingency: VND; total: VND;
};
export type Evaluation = {
  snapshotId: ID; ruleVersion: string; coverage: number;
  criteria: Array<{id: string; weight: number; score: number | null;
    status: 'evaluated'|'missing_data'|'requires_professional'; evidenceIds: ID[]; explanation: string}>;
};
export type Order = {
  id: ID; userId: ID; projectId: ID; productVersion: string; amount: VND; currency: 'VND';
  status: 'pending'|'paid'|'expired'|'reconciliation'|'refunded'|'cancelled';
  providerOrderId: string; expiresAt: string;
};
export type Entitlement = {
  id: ID; userId: ID; projectId: ID; orderId: ID | null;
  key: 'project_package'; status: 'active'|'revoked'; source: 'purchase'|'trial'|'admin_grant';
};
export type Job = {
  id: ID; projectId: ID; inputRevision: Revision; snapshotId?: ID;
  type: 'ocr'|'review'|'export'; status: 'queued'|'running'|'needs_confirmation'|'succeeded'|'failed'|'cancelled';
  attempts: number; errorCode?: string; outputAssetIds: ID[];
};
export type ChecklistItem = {
  id: ID; projectId: ID; templateVersion: string; title: string;
  status: 'unchecked'|'pass'|'fail'|'not_applicable';
  checkedBy?: ID; checkedAt?: string; evidenceAssetIds: ID[]; note?: string;
};
export type ApiError = {code: string; message: string; fieldErrors?: Record<string,string>; requestId: string};
