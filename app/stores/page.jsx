"use client";
import { useEffect, useState } from "react";
import { Building2, MapPin, Plus, Trash2 } from "lucide-react";

export default function StoresPage() {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [formData, setFormData] = useState({
        store_number: "",
        name: "",
        location: "",
    });

    const loadStores = async () => {
        try {
            const res = await fetch("/api/stores");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to load stores");
            setStores(data.data || []);
        } catch (error) {
            alert(error.message || "Failed to load stores");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStores();
    }, []);

    const handleCreateStore = async (e) => {
        e.preventDefault();
        if (!formData.store_number.trim()) {
            alert("Store number is required.");
            return;
        }
        setSaving(true);
        try {
            const res = await fetch("/api/stores", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload.error || "Failed to create store");
            setShowModal(false);
            setFormData({ store_number: "", name: "", location: "" });
            await loadStores();
        } catch (error) {
            alert(error.message || "Failed to create store");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteStore = async (store) => {
        const confirmed = window.confirm(`Delete ${store.store_number}? This action cannot be undone.`);
        if (!confirmed) return;
        setDeletingId(store.id);
        try {
            const res = await fetch(`/api/stores/${store.id}`, { method: "DELETE" });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload.error || "Failed to delete store");
            await loadStores();
        } catch (error) {
            alert(error.message || "Failed to delete store");
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) return <div className="dashboard-container text-sm text-gray-500">Loading stores...</div>;

    return (
        <div className="dashboard-container">
            <section className="dashboard-section">
                <div className="dashboard-surface-card">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">Stores</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Store locations and metadata used by compliance reporting.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setShowModal(true)}
                                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors shadow-sm"
                            >
                                <Plus size={14} />
                                Add Store
                            </button>
                            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl px-3 py-2 text-xs font-semibold">
                                <Building2 size={14} />
                                {stores.length} total
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="dashboard-section">
                <div className="dashboard-surface-card p-0 max-w-full overflow-hidden">
                    <div className="max-w-full overflow-x-auto">
                        <table className="dashboard-table w-full min-w-[760px] table-auto text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Store Number</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {stores.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="py-16 text-center text-sm text-gray-500">
                                            No stores found.
                                        </td>
                                    </tr>
                                ) : (
                                    stores.map((store) => (
                                        <tr key={store.id} className="transition-colors duration-150 hover:bg-gray-50">
                                            <td>
                                                <span className="font-mono text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
                                                    {store.store_number}
                                                </span>
                                            </td>
                                            <td className="font-medium text-gray-900">{store.name}</td>
                                            <td>
                                                <span className="inline-flex items-center gap-1.5 text-gray-600">
                                                    <MapPin size={13} className="text-gray-400" />
                                                    {store.location || "N/A"}
                                                </span>
                                            </td>
                                            <td className="text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteStore(store)}
                                                    disabled={deletingId === store.id}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors disabled:opacity-60"
                                                >
                                                    <Trash2 size={12} />
                                                    {deletingId === store.id ? "Deleting..." : "Delete"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {showModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 shadow-xl p-6">
                        <h2 className="text-lg font-semibold text-gray-900">Add New Store</h2>
                        <p className="mt-1 text-sm text-gray-500">Create a store for employee mapping and reporting.</p>

                        <form onSubmit={handleCreateStore} className="mt-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Store Number *</label>
                                <input
                                    type="text"
                                    value={formData.store_number}
                                    onChange={(e) => setFormData((p) => ({ ...p, store_number: e.target.value }))}
                                    className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g. S-105"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Store Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                                    className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g. Downtown Gas Station"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
                                    className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g. Kathmandu"
                                />
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="h-10 px-4 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-60"
                                >
                                    {saving ? "Saving..." : "Save Store"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
