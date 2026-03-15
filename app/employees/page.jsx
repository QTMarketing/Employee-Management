"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Building2, Download, Plus, Search, Trash2, UserCircle2 } from "lucide-react";

export default function Employees() {
    const [employees, setEmployees] = useState([]);
    const [stores, setStores] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [selectedStore, setSelectedStore] = useState("");

    const [formData, setFormData] = useState({
        name: '', employee_id: '', store_id: '', position: '', hire_date: '', email: '', phone: ''
    });

    useEffect(() => {
        fetchEmployees();
        fetchStores();
    }, []);

    const fetchEmployees = async () => {
        const res = await fetch('/api/employees');
        const data = await res.json();
        setEmployees(data.data || []);
        setLoading(false);
    };

    const fetchStores = async () => {
        const res = await fetch('/api/stores');
        const data = await res.json();
        setStores(data.data || []);
    };

    const deleteEmployee = async (id) => {
        if (!confirm("Are you sure?")) return;
        const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
        if (res.ok) fetchEmployees();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await fetch('/api/employees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        if (res.ok) {
            setShowModal(false);
            setFormData({ name: '', employee_id: '', store_id: '', position: '', hire_date: '', email: '', phone: '' });
            fetchEmployees();
        } else {
            const err = await res.json();
            alert("Error: " + err.error);
        }
    };

    const getStatusBadge = (status) => {
        const safeStatus = status || "Inactive";
        const s = String(safeStatus).toLowerCase();
        if (s === "active") return <span className="badge badge-active">Active</span>;
        if (s === "pending") return <span className="badge badge-warning">Pending</span>;
        return <span className="badge badge-inactive">{safeStatus}</span>;
    };

    const filteredEmployees = useMemo(() => {
        const byStore = selectedStore
            ? employees.filter((emp) => String(emp.store_id || "") === selectedStore)
            : employees;
        const q = query.trim().toLowerCase();
        if (!q) return byStore;
        return byStore.filter((emp) => {
            const searchable = [
                emp.employee_id,
                emp.name,
                emp.position,
                emp.store_number,
                emp.status,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            return searchable.includes(q);
        });
    }, [employees, query, selectedStore]);

    const handleExport = () => {
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());
        if (selectedStore) params.set("store_id", selectedStore);
        window.location.href = `/api/employees/export${params.toString() ? `?${params.toString()}` : ""}`;
    };

    if (loading) return <div className="dashboard-container text-sm text-gray-500">Loading employees...</div>;

    return (
        <div className="dashboard-container">
            <section className="dashboard-section">
                <div className="dashboard-surface-card">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">Employee Directory</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Manage employees and quickly access compliance profiles.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="search"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search employees..."
                                    className="w-[250px] text-sm border border-gray-200 rounded-xl bg-white pl-9 pr-3 py-2.5 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <select
                                value={selectedStore}
                                onChange={(e) => setSelectedStore(e.target.value)}
                                className="h-10 min-w-[170px] text-sm border border-gray-200 rounded-xl bg-white px-3 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">All Stores</option>
                                {stores.map((s) => (
                                    <option key={s.id} value={String(s.id)}>
                                        {s.store_number || `Store ${s.id}`}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={handleExport}
                                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium whitespace-nowrap transition-colors shadow-sm"
                            >
                                <Download size={14} />
                                Export CSV
                            </button>
                            <button
                                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium whitespace-nowrap transition-colors shadow-sm"
                                onClick={() => setShowModal(true)}
                            >
                                <Plus size={15} />
                                New Employee
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="dashboard-section">
                <div className="dashboard-surface-card p-0 max-w-full overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 text-xs text-gray-500">
                        Showing {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? "s" : ""}{selectedStore ? " for selected store" : ""}.
                    </div>
                    <div className="max-w-full overflow-x-auto">
                    <table className="dashboard-table w-full min-w-[900px] table-auto text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID Number</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Store</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Position</th>
                                <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-[150px]">Status</th>
                                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-[180px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-16 text-center text-sm text-gray-500">
                                        {query ? "No matching employees found." : "No employees found."}
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployees.map(emp => (
                                    <tr key={emp.id} className="transition-colors duration-150 hover:bg-gray-50">
                                        <td>
                                            <span className="font-mono text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
                                                {emp.employee_id || "—"}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
                                                    <UserCircle2 size={16} />
                                                </div>
                                                <strong className="text-gray-900">{emp.name}</strong>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600">
                                                <Building2 size={13} className="text-gray-400" />
                                                {emp.store_number || "Unassigned"}
                                            </span>
                                        </td>
                                        <td>{emp.position}</td>
                                        <td className="text-center">{getStatusBadge(emp.status)}</td>
                                        <td className="text-right">
                                            <div className="inline-flex items-center gap-2">
                                            <Link href={`/employee-profile/${emp.id}`}>
                                                <button className="dashboard-resolve-btn bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                                                    Profile
                                                </button>
                                            </Link>
                                            <button
                                                className="inline-flex items-center gap-1.5 h-[30px] px-3 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
                                                onClick={() => deleteEmployee(emp.id)}
                                            >
                                                <Trash2 size={12} />
                                                Delete
                                            </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    </div>
                </div>
            </section>

            {/* Modal */}
            <div className={`modal-overlay ${showModal ? 'active' : ''}`}>
                <div className="modal">
                    <div className="modal-header">
                        <h2 className="modal-title">Add Employee</h2>
                        <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Name</label>
                            <input type="text" className="form-control" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Employee ID</label>
                            <input type="text" className="form-control" required value={formData.employee_id} onChange={e => setFormData({ ...formData, employee_id: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input type="email" className="form-control" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone</label>
                            <input type="tel" className="form-control" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Store</label>
                            <select className="form-control" required value={formData.store_id} onChange={e => setFormData({ ...formData, store_id: e.target.value })}>
                                <option value="">Select Store</option>
                                {stores.map(s => <option key={s.id} value={s.id}>{s.name} - {s.store_number}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Position</label>
                            <input type="text" className="form-control" required value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Hire Date</label>
                            <input type="date" className="form-control" required value={formData.hire_date} onChange={e => setFormData({ ...formData, hire_date: e.target.value })} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1.5rem" }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary">Save Employee</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
