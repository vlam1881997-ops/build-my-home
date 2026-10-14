-- Thiết kế PostgreSQL cho lõi dự án/thanh toán. Chưa phải migration production đã nghiệm thu.
-- UUID do application sinh. Profile/design JSONB được runtime schema validate trước khi ghi.
-- Các bảng catalog/checklist/thi công chi tiết tiếp tục triển khai theo docs/02-architecture.md.
BEGIN;
CREATE TABLE app_users (
  id UUID PRIMARY KEY,
  auth_subject TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES app_users(id),
  name TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
  currency TEXT NOT NULL DEFAULT 'VND' CHECK (currency = 'VND'),
  profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX projects_owner ON projects(owner_id);
CREATE TABLE project_members (
  project_id UUID NOT NULL REFERENCES projects(id),
  user_id UUID NOT NULL REFERENCES app_users(id),
  role TEXT NOT NULL CHECK (role IN ('editor','viewer')),
  PRIMARY KEY(project_id,user_id)
);
CREATE TABLE scenarios (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  name TEXT NOT NULL,
  inputs JSONB NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK(revision > 0),
  UNIQUE(project_id,id)
);
CREATE TABLE design_versions (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  scenario_id UUID NOT NULL,
  revision INTEGER NOT NULL CHECK(revision > 0),
  geometry JSONB NOT NULL,
  confirmed_at TIMESTAMPTZ,
  FOREIGN KEY(project_id,scenario_id) REFERENCES scenarios(project_id,id),
  UNIQUE(scenario_id,revision),
  UNIQUE(project_id,scenario_id,id)
);
CREATE TABLE assets (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  object_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL CHECK(size_bytes > 0),
  purpose TEXT NOT NULL CHECK(purpose IN ('reference','plan','survey','evidence','export')),
  scan_status TEXT NOT NULL DEFAULT 'pending' CHECK(scan_status IN ('pending','clean','rejected'))
);
CREATE TABLE estimate_snapshots (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  scenario_id UUID NOT NULL,
  design_version_id UUID NOT NULL,
  input_revision INTEGER NOT NULL CHECK(input_revision > 0),
  rule_version TEXT NOT NULL,
  payload JSONB NOT NULL,
  total_vnd BIGINT NOT NULL CHECK(total_vnd >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(project_id,scenario_id,design_version_id) REFERENCES design_versions(project_id,scenario_id,id),
  UNIQUE(project_id,id)
);
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES app_users(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  product_version TEXT NOT NULL,
  amount_vnd BIGINT NOT NULL CHECK(amount_vnd > 0),
  currency TEXT NOT NULL CHECK(currency = 'VND'),
  provider TEXT NOT NULL,
  provider_order_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending','paid','expired','reconciliation','refunded','cancelled')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider,provider_order_id),
  UNIQUE(id,user_id,project_id)
);
CREATE TABLE payment_events (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id),
  provider TEXT NOT NULL,
  provider_event_id TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL,
  payload_digest TEXT NOT NULL,
  UNIQUE(provider,provider_event_id)
);
CREATE TABLE entitlements (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES app_users(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  order_id UUID,
  entitlement_key TEXT NOT NULL CHECK(entitlement_key = 'project_package'),
  source TEXT NOT NULL CHECK(source IN ('purchase','trial','admin_grant')),
  status TEXT NOT NULL CHECK(status IN ('active','revoked')),
  CHECK(source <> 'purchase' OR order_id IS NOT NULL),
  FOREIGN KEY(order_id,user_id,project_id) REFERENCES orders(id,user_id,project_id),
  UNIQUE(user_id,project_id,entitlement_key)
);
CREATE TABLE export_jobs (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  snapshot_id UUID NOT NULL,
  requested_by UUID NOT NULL REFERENCES app_users(id),
  idempotency_key TEXT NOT NULL,
  format TEXT NOT NULL CHECK(format IN ('pdf','xlsx','zip')),
  status TEXT NOT NULL CHECK(status IN ('queued','running','succeeded','failed','cancelled')),
  error_code TEXT,
  output_asset_id UUID REFERENCES assets(id),
  FOREIGN KEY(project_id,snapshot_id) REFERENCES estimate_snapshots(project_id,id),
  UNIQUE(requested_by,idempotency_key)
);
CREATE TABLE audit_events (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  actor_id UUID REFERENCES app_users(id),
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Fail closed cho các kết nối chịu RLS. Backend production cần thêm policies có kiểm thử
-- và role runtime hạn chế; không dùng superuser/service bypass cho API người dùng.
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
COMMIT;
