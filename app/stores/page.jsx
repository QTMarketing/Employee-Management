"use client";
import { useEffect, useState } from "react";
import { Building2, MapPin } from "lucide-react";

export default function StoresPage() {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStores = async () => {
            try {
                const res = await fetch("/api/stores");
                const data = await res.json();
                setStores(data.data || []);
            } finally {
                setLoading(false);
            }
        };
        loadStores();
    }, []);

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
                        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl px-3 py-2 text-xs font-semibold">
                            <Building2 size={14} />
                            {stores.length} total
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
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {stores.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="py-16 text-center text-sm text-gray-500">
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
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    </div>
                </div>
            </section>
        </div>
    );
}
