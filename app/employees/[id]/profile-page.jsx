"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getComplianceStatus } from "../../../lib/utils";

export default function EmployeeProfilePage({ id }) {
    const [employee, setEmployee] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const [empRes, docsRes] = await Promise.all([
                fetch(`/api/employees/${id}`),
                fetch(`/api/documents/employee/${id}`)
            ]);

            if (empRes.ok) {
                const emp = await empRes.json();
                setEmployee(emp.data);
            }
            if (docsRes.ok) {
                const docs = await docsRes.json();
                setDocuments(docs.data || []);
            }
            setLoading(false);
        };

        load();
    }, [id]);

    if (loading) return <div className="dashboard-container">Loading Profile...</div>;
    if (!employee) {
        return (
            <div className="dashboard-container">
                <div className="card" style={{ maxWidth: 680 }}>
                    <h2 style={{ marginBottom: "0.5rem" }}>Employee not found</h2>
                    <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
                        This profile could not be loaded from the live employee database.
                    </p>
                    <Link href="/employees">
                        <button className="btn btn-primary">Open Employee Directory</button>
                    </Link>
                </div>
            </div>
        );
    }

    const initials = employee.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();

    return (
        <div className="dashboard-container">
            <div className="header">
                <h1>Employee Profile</h1>
                <Link href="/employees">
                    <button className="btn btn-secondary">Back to Roster</button>
                </Link>
            </div>

            <div className="card profile-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                    <div className="profile-avatar">{initials}</div>
                    <div className="profile-info">
                        <h2>{employee.name}</h2>
                        <p style={{ marginTop: "0.5rem" }}>
                            <strong>ID:</strong> <span style={{ fontFamily: "monospace" }}>{employee.employee_id}</span>
                            {"  "}|{"  "}
                            <strong>Store:</strong> {employee.store_number || "Unassigned"}
                            {"  "}|{"  "}
                            <strong>Position:</strong> {employee.position}
                        </p>
                    </div>
                </div>
            </div>

            <div className="header" style={{ marginTop: "3rem" }}>
                <h2>Compliance Documents</h2>
            </div>

            <div className="table-container">
                <table className="dashboard-table">
                    <thead>
                        <tr>
                            <th>Document Type</th>
                            <th>Issue Date</th>
                            <th>Expiry Date</th>
                            <th style={{ textAlign: "center", width: "170px" }}>Status</th>
                            <th style={{ textAlign: "right", width: "150px" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {documents.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: "center", color: "var(--text-muted)" }}>
                                    No documents found.
                                </td>
                            </tr>
                        ) : (
                            documents.map((doc) => {
                                const compliance = getComplianceStatus(doc.expiry_date);
                                return (
                                    <tr key={doc.id}>
                                        <td><strong>{doc.document_type}</strong></td>
                                        <td>{new Date(doc.issue_date).toLocaleDateString()}</td>
                                        <td><strong>{new Date(doc.expiry_date).toLocaleDateString()}</strong></td>
                                        <td style={{ textAlign: "center" }}>
                                            <span className={`badge ${compliance.colorClass}`}>{compliance.label}</span>
                                        </td>
                                        <td style={{ textAlign: "right" }}>
                                            <a
                                                href={doc.file_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="btn btn-secondary btn-sm"
                                                style={{ textDecoration: "none" }}
                                            >
                                                View File
                                            </a>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
