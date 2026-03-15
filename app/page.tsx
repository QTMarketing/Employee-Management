"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Users,
  Clock,
  AlertTriangle,
  FileWarning,
  CheckCircle2,
  ChevronRight,
  Building2,
  Shield,
  TrendingUp,
  RefreshCw,
  Search,
  Download,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ExpiringDoc = { doc: string; days: number };

type Employee = {
  id: number;
  name: string;
  store: string;
  storeId: string | null;
  position: string;
  missing: string[];
  expired: string[];
  expiring: ExpiringDoc[];
};
type ApiEmployee = {
  id: number;
  name: string;
  position: string;
  store_id?: number | null;
  store_number?: string | null;
  store?: string | null;
};

type ApiDocument = {
  employee_id: number;
  document_type?: string;
  type?: string;
  expiry_date: string;
};

const REQUIRED_DOCS = [
  "Driver License",
  "SSN",
  "Work Permit",
  "Alcohol Sales Permit",
  "Food Safety Certificate",
];

const DOC_ALIAS_MAP: Record<string, string> = {
  "driver license": "Driver License",
  "drivers license": "Driver License",
  driver_license: "Driver License",
  ssn: "SSN",
  "social security number": "SSN",
  "social security": "SSN",
  work_permit: "Work Permit",
  "work permit": "Work Permit",
  alcohol_permit: "Alcohol Sales Permit",
  "alcohol permit": "Alcohol Sales Permit",
  "alcohol sales permit": "Alcohol Sales Permit",
  food_safety_certificate: "Food Safety Certificate",
  "food safety certificate": "Food Safety Certificate",
};

function normalizeDocName(value?: string): string {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ");
}

function canonicalDocName(value?: string): string {
  const normalized = normalizeDocName(value);
  return DOC_ALIAS_MAP[normalized] || value || "";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatus(emp: Employee): "non-compliant" | "incomplete" | "at-risk" | "compliant" {
  if (emp.expired.length > 0) return "non-compliant";
  if (emp.missing.length > 0) return "incomplete";
  if (emp.expiring.length > 0) return "at-risk";
  return "compliant";
}

function urgencyLabel(days: number): string {
  if (days <= 7) return "7d";
  if (days <= 30) return "30d";
  return "60d";
}

function urgencyColor(days: number): string {
  if (days <= 7) return "bg-red-100 text-red-700 border-red-200";
  if (days <= 30) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-yellow-50 text-yellow-700 border-yellow-200";
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
  subtitle?: string;
  trend?: string;
}

function StatCard({
  title,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  valueColor = "text-gray-900",
  subtitle,
  trend,
}: StatCardProps) {
  return (
    <div className="dashboard-surface-card flex items-start justify-between">
      <div className="min-w-0 flex-1 flex flex-col gap-1 pl-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
        <p className={`text-3xl font-bold mt-1 ${valueColor}`}>{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp size={12} className="text-green-500" />
            <span className="text-xs text-green-600 font-medium">{trend}</span>
          </div>
        )}
      </div>
      <div className={`${iconBg} p-3 rounded-xl shrink-0 ml-4`}>
        <Icon size={24} className={iconColor} />
      </div>
    </div>
  );
}

interface StatusBadgeProps {
  status: ReturnType<typeof getStatus>;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const map = {
    "non-compliant": {
      label: "Non-Compliant",
      classes: "bg-red-100 text-red-700 border border-red-200",
      dot: "bg-red-500",
    },
    incomplete: {
      label: "Incomplete",
      classes: "bg-rose-100 text-rose-700 border border-rose-200",
      dot: "bg-rose-500",
    },
    "at-risk": {
      label: "At Risk",
      classes: "bg-amber-100 text-amber-700 border border-amber-200",
      dot: "bg-amber-500",
    },
    compliant: {
      label: "Compliant",
      classes: "bg-green-100 text-green-700 border border-green-200",
      dot: "bg-green-500",
    },
  };

  const { label, classes, dot } = map[status];

  return (
    <span className={`dashboard-status-pill ${classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleRiskExport = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (selectedStore) params.set("store_id", selectedStore);
    window.location.href = `/api/exports/risk-register${params.toString() ? `?${params.toString()}` : ""}`;
  };

  const loadLiveData = async () => {
    try {
      setRefreshing(true);
      const empRes = await fetch("/api/employees");
      if (!empRes.ok) {
        setAllEmployees([]);
        return;
      }

      const empJson = await empRes.json();
      const rawEmployees: ApiEmployee[] = empJson?.data || [];

      const docsPerEmployee = await Promise.all(
        rawEmployees.map(async (emp) => {
          try {
            const docsRes = await fetch(`/api/documents/employee/${emp.id}`);
            if (!docsRes.ok) return [];
            const docsJson = await docsRes.json();
            return (docsJson?.data || []) as ApiDocument[];
          } catch {
            return [];
          }
        })
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const computed: Employee[] = rawEmployees.map((emp, index) => {
        const docs = docsPerEmployee[index];
        const presentRequired = new Set<string>();
        const expired = new Set<string>();
        const expiringMap = new Map<string, number>();

        docs.forEach((doc) => {
          const canonical = canonicalDocName(doc.document_type || doc.type);
          const expiry = new Date(doc.expiry_date);
          expiry.setHours(0, 0, 0, 0);
          const days = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          if (REQUIRED_DOCS.includes(canonical)) {
            presentRequired.add(canonical);
          }
          if (days < 0 && canonical) {
            expired.add(canonical);
          } else if (days <= 60 && canonical) {
            const existing = expiringMap.get(canonical);
            if (existing === undefined || days < existing) {
              expiringMap.set(canonical, days);
            }
          }
        });

        const missing = REQUIRED_DOCS.filter((doc) => !presentRequired.has(doc));
        const expiring = Array.from(expiringMap.entries())
          .map(([doc, days]) => ({ doc, days }))
          .sort((a, b) => a.days - b.days);

        return {
          id: emp.id,
          name: emp.name,
          store: emp.store_number || emp.store || "Unassigned",
          storeId:
            emp.store_id != null
              ? String(emp.store_id)
              : (emp.store_number || emp.store || "Unassigned"),
          position: emp.position || "—",
          missing,
          expired: Array.from(expired),
          expiring,
        };
      });

      setAllEmployees(computed);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLiveData();
  }, []);

  const stores = useMemo(() => {
    const map = new Map<string, string>();
    allEmployees.forEach((e) => {
      if (e.storeId) map.set(e.storeId, e.store);
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [allEmployees]);

  const storeScopedEmployees = useMemo(() => {
    if (!selectedStore) return allEmployees;
    return allEmployees.filter((e) => e.storeId === selectedStore);
  }, [selectedStore, allEmployees]);

  const employees = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return storeScopedEmployees;
    return storeScopedEmployees.filter((e) => {
      const searchable = [
        e.name,
        e.position,
        e.store,
        ...e.missing,
        ...e.expired,
        ...e.expiring.map((x) => x.doc),
        getStatus(e),
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(q);
    });
  }, [storeScopedEmployees, searchQuery]);

  // Stat calculations
  const totalEmployees = employees.length;

  const expiringSoon = employees.filter((e) => e.expiring.length > 0).length;

  const expiredDocs = employees.reduce(
    (acc, e) => acc + e.expired.length,
    0
  );

  const missingDocs = employees.reduce(
    (acc, e) => acc + e.missing.length,
    0
  );

  // Risk table: only employees with issues
  const atRiskEmployees = employees.filter(
    (e) => e.expired.length > 0 || e.missing.length > 0 || e.expiring.length > 0
  );

  // Summary counts for header
  const nonCompliantCount = employees.filter((e) => getStatus(e) === "non-compliant").length;
  const compliantCount = employees.filter((e) => getStatus(e) === "compliant").length;
  const complianceRate = totalEmployees > 0
    ? Math.round((compliantCount / totalEmployees) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 -m-0">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="dashboard-container !py-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <Shield size={19} className="text-indigo-600" />
            <h1 className="text-2xl font-semibold text-gray-900">Compliance Dashboard</h1>
            <span className="hidden md:inline h-4 w-px bg-gray-300 mx-1" />
            <span className="hidden md:inline text-sm text-gray-500">Real-time overview</span>
          </div>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex-1 min-w-[220px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employees, stores, docs..."
                className="w-full text-sm border border-gray-200 rounded-xl bg-white pl-9 pr-3 py-2.5 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="ml-auto flex items-center gap-2.5 shrink-0">
              <div className="flex items-center gap-2 bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-2.5">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">{complianceRate}% Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-gray-400" />
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="text-sm border border-gray-200 rounded-xl bg-white px-3 py-2.5 text-gray-700 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer min-w-[165px]"
                >
                  <option value="">All Stores</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={loadLiveData}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors rounded-lg px-2 py-1.5 hover:bg-slate-100 whitespace-nowrap"
              >
                <RefreshCw size={13} />
                <span>{refreshing ? "Refreshing..." : "Live"}</span>
              </button>
              <div className="hidden sm:flex items-center gap-2 pl-2.5 border-l border-gray-200">
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-900">Admin User</p>
                  <p className="text-[11px] text-gray-500">admin@gravity.local</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center justify-center border border-white shadow-sm">
                  AU
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard-container">

      {/* ── Stat Cards ── */}
      <section className="dashboard-section">
        <div className="dashboard-stats-grid">
          <StatCard
            title="Total Employees"
            value={totalEmployees}
            icon={Users}
            iconBg="bg-indigo-50"
            iconColor="text-indigo-600"
            subtitle={`Across ${selectedStore ? "1 store" : `${stores.length} stores`}`}
            trend={`${compliantCount} fully compliant`}
          />
          <StatCard
            title="Expiring Soon"
            value={expiringSoon}
            icon={Clock}
            iconBg="bg-amber-50"
            iconColor="text-amber-500"
            valueColor="text-amber-600"
            subtitle="Within 60-day window"
          />
          <StatCard
            title="Expired Documents"
            value={expiredDocs}
            icon={AlertTriangle}
            iconBg="bg-red-50"
            iconColor="text-red-500"
            valueColor="text-red-600"
            subtitle="Immediate action required"
          />
          <StatCard
            title="Missing Required Docs"
            value={missingDocs}
            icon={FileWarning}
            iconBg="bg-rose-50"
            iconColor="text-rose-500"
            valueColor="text-rose-600"
            subtitle="Employees incomplete"
          />
        </div>
      </section>

      {/* ── Alert Tier Summary ── */}
      <section className="dashboard-section">
        <div className="dashboard-alert-row">
          {[
            {
              label: "Final Alert",
              subtitle: "Expiring within 7 days",
              count: employees.filter((e) => e.expiring.some((x) => x.days <= 7)).length,
              bg: "bg-red-50",
              border: "border-red-200",
              dot: "bg-red-500",
              text: "text-red-700",
            },
            {
              label: "Urgent Alert",
              subtitle: "Expiring within 30 days",
              count: employees.filter((e) => e.expiring.some((x) => x.days > 7 && x.days <= 30)).length,
              bg: "bg-amber-50",
              border: "border-amber-200",
              dot: "bg-amber-500",
              text: "text-amber-700",
            },
            {
              label: "Warning Alert",
              subtitle: "Expiring within 60 days",
              count: employees.filter((e) => e.expiring.some((x) => x.days > 30 && x.days <= 60)).length,
              bg: "bg-yellow-50",
              border: "border-yellow-200",
              dot: "bg-yellow-500",
              text: "text-yellow-700",
            },
          ].map((tier) => (
            <div key={tier.label} className={`dashboard-alert-card ${tier.bg} border ${tier.border} justify-between`}>
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${tier.dot} flex-shrink-0`} />
                <div>
                  <p className={`text-sm font-semibold ${tier.text}`}>{tier.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{tier.subtitle}</p>
                </div>
              </div>
              <span className={`text-2xl font-bold ${tier.text}`}>{tier.count}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Compliance Risk Table ── */}
      <section className="dashboard-section">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Compliance Risk Register</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Employees with missing, expired, or expiring documents requiring action.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRiskExport}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 bg-white text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                <Download size={12} />
                Export CSV
              </button>
              <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                {nonCompliantCount} non-compliant
              </span>
              <span className="text-gray-300">·</span>
              <span>{atRiskEmployees.length} total issues</span>
              </div>
            </div>
          </div>

          <div className="dashboard-surface-card p-0 max-w-full overflow-hidden">
            <div className="max-w-full overflow-x-auto">
            <table className="dashboard-table w-full min-w-[980px] table-auto text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Store
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Missing Docs
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Expired Docs
                  </th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-[150px]">
                    Status
                  </th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-[120px]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-sm text-gray-500">
                      Loading live compliance data...
                    </td>
                  </tr>
                ) : totalEmployees === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-gray-900 font-semibold">No employees found</p>
                        <p className="text-gray-400 text-xs">Add employees to start live compliance tracking.</p>
                      </div>
                    </td>
                  </tr>
                ) : atRiskEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                          <CheckCircle2 size={24} className="text-green-500" />
                        </div>
                        <p className="text-gray-900 font-semibold">All employees are fully compliant</p>
                        <p className="text-gray-400 text-xs">No outstanding compliance issues detected.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  atRiskEmployees.map((emp) => {
                    const status = getStatus(emp);
                    const rowHighlight = emp.expired.length > 0 ? "bg-red-50 hover:bg-red-100/70" : "hover:bg-gray-50";

                    return (
                      <tr key={emp.id} className={`h-12 transition-colors duration-150 ${rowHighlight}`}>
                        {/* Employee */}
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-indigo-600">
                                {emp.name.split(" ").map((n) => n[0]).join("")}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{emp.name}</p>
                              <p className="text-xs text-gray-400">{emp.position}</p>
                            </div>
                          </div>
                        </td>

                        {/* Store */}
                        <td>
                          <div className="flex items-center gap-1.5">
                            <Building2 size={13} className="text-gray-400" />
                            <span className="text-gray-600 text-xs font-medium">{emp.store}</span>
                          </div>
                        </td>

                        {/* Missing Docs */}
                        <td>
                          {emp.missing.length > 0 ? (
                            <div className="flex flex-wrap">
                              {emp.missing.map((doc) => (
                                <span
                                  key={doc}
                                  className="dashboard-pill text-xs bg-rose-50 text-rose-700 border border-rose-200 font-medium"
                                >
                                  {doc}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>

                        {/* Expired Docs */}
                        <td>
                          {emp.expired.length > 0 ? (
                            <div className="flex flex-wrap">
                              {emp.expired.map((doc) => (
                                <span
                                  key={doc}
                                  className="dashboard-pill text-xs bg-red-50 text-red-700 border border-red-200 font-medium"
                                >
                                  {doc}
                                </span>
                              ))}
                            </div>
                          ) : emp.expiring.length > 0 ? (
                            <div className="flex flex-wrap">
                              {emp.expiring.map(({ doc, days }) => (
                                <span
                                  key={doc}
                                  className={`dashboard-pill text-xs font-medium border ${urgencyColor(days)}`}
                                >
                                  {doc} · {urgencyLabel(days)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="text-center align-middle">
                          <StatusBadge status={status} />
                        </td>

                        {/* Action */}
                        <td className="text-right align-middle">
                          <Link
                            href={`/employee-profile/${emp.id}`}
                            className={`dashboard-resolve-btn transition-all duration-150 ${
                              emp.expired.length > 0
                                ? "bg-red-600 hover:bg-red-700 text-white shadow-sm"
                                : emp.missing.length > 0
                                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                            }`}
                          >
                            Resolve
                            <ChevronRight size={13} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            </div>

            {/* Table Footer */}
            {atRiskEmployees.length > 0 && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Showing {atRiskEmployees.length} employee{atRiskEmployees.length !== 1 ? "s" : ""} with compliance issues
                </p>
                <Link
                  href="/employees"
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 transition-colors"
                >
                  View All Employees <ChevronRight size={12} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Document Coverage Quick Reference ── */}
      <section className="dashboard-section">
        <div className="dashboard-surface-card">
          <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">
            Document Coverage — Required Types (PRD)
          </h3>
          <div className="dashboard-doc-grid">
            {[
              "Driver License",
              "SSN",
              "Work Permit",
              "Alcohol Sales Permit",
              "Food Safety Certificate",
            ].map((docType) => {
              const hasIssues = employees.some(
                (e) =>
                  e.missing.includes(docType) ||
                  e.expired.includes(docType) ||
                  e.expiring.some((x) => x.doc === docType)
              );
              return (
                <div
                  key={docType}
                  className={`dashboard-doc-card rounded-xl border text-center transition-colors ${
                    hasIssues
                      ? "bg-red-50 border-red-200"
                      : "bg-green-50 border-green-200"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mx-auto mb-2 ${
                      hasIssues ? "bg-red-400" : "bg-green-500"
                    }`}
                  />
                  <p
                    className={`text-xs font-semibold ${
                      hasIssues ? "text-red-700" : "text-green-700"
                    }`}
                  >
                    {docType}
                  </p>
                  <p
                    className={`text-xs mt-0.5 ${
                      hasIssues ? "text-red-500" : "text-green-500"
                    }`}
                  >
                    {hasIssues ? "Issues found" : "All clear"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
