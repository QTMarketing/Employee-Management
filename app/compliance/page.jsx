"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Download } from "lucide-react";

export default function Compliance() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAlerts() {
            try {
                const res = await fetch('/api/alerts');
                const data = await res.json();
                if (data.data && data.data.all) {
                    setAlerts(data.data.all);
                }
            } catch (err) {
                console.error('Failed to fetch alerts', err);
            } finally {
                setLoading(false);
            }
        }
        fetchAlerts();
    }, []);

    const markAsRead = async (id) => {
        await fetch(`/api/alerts/${id}/read`, { method: 'PATCH' });
        setAlerts(alerts.map(a => a.id === id ? { ...a, read: 1 } : a));
    };

    const handleExport = () => {
        window.location.href = "/api/alerts/export";
    };

    if (loading) return <div>Loading alerts...</div>;

    return (
        <div className="dashboard-container">
            <div className="header">
                <h1>Compliance Center</h1>
                <button
                    type="button"
                    onClick={handleExport}
                    className="btn btn-secondary inline-flex items-center gap-2 whitespace-nowrap"
                >
                    <Download size={14} />
                    Export CSV
                </button>
            </div>

            <div className="card">
                <div className="table-container" style={{ marginTop: 0, boxShadow: 'none', border: 'none' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Employee</th>
                                <th>Alert Type</th>
                                <th>Message</th>
                                <th style={{ textAlign: 'right', width: '180px' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {alerts.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                                        No compliance alerts.
                                    </td>
                                </tr>
                            ) : (
                                alerts.map(alert => (
                                    <tr key={alert.id} style={{ opacity: alert.read ? 0.6 : 1 }}>
                                        <td>{new Date(alert.created_at).toLocaleDateString()}</td>
                                        <td><strong>{alert.employee_name}</strong></td>
                                        <td><span className={`badge ${alert.alert_type === 'expired' ? 'badge-danger' : 'badge-warning'}`}>{alert.alert_type.replace('_', ' ').toUpperCase()}</span></td>
                                        <td>{alert.message}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Link href={`/employee-profile/${alert.employee_id}`}>
                                                <button className="btn btn-secondary btn-sm">Profile</button>
                                            </Link>
                                            {!alert.read && <button className="btn btn-primary btn-sm" onClick={() => markAsRead(alert.id)}>Acknowledge</button>}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
