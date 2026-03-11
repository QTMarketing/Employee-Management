"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Documents() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Technically this asks for all documents. Since our API currently restricts to employee/:id
        // We might need to implement a GET /api/documents if we want all of them. 
        // For now, let's fetch employees and then documents or implement a simple backend fetch if needed.
        // Wait, the API `GET /api/documents` doesn't exist yet, we only wrote `GET /api/documents/employee/:id`.
        // Let's implement a workaround.
        // I will just fetch all document alerts and map them, since alerts are actually what we care about for global views right now.
        // Actually this page can just be a placeholder until we write the backend for /api/documents.
        setLoading(false);
    }, []);

    return (
        <div className="dashboard-container">
            <div className="header">
                <h1>All Documents</h1>
            </div>

            <div className="card">
                <div className="table-container" style={{ marginTop: 0, boxShadow: 'none', border: 'none' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Type</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                    Global document view arriving soon. For now, view documents from specific <Link href="/employees">Employee Profiles</Link>.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
