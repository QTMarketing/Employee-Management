"use client";

import { Bell, Lock, ShieldCheck, UserCog } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="dashboard-container">
            <section className="dashboard-section">
                <div className="dashboard-surface-card">
                    <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        System preferences and access controls for the compliance platform.
                    </p>
                </div>
            </section>

            <section className="dashboard-section">
                <div className="dashboard-stats-grid">
                    {[
                        {
                            title: "Profile & Account",
                            desc: "Manage admin identity, email, and session behavior.",
                            icon: UserCog,
                        },
                        {
                            title: "Security",
                            desc: "Password standards, access restrictions, and auth policy.",
                            icon: Lock,
                        },
                        {
                            title: "Alerts",
                            desc: "Configure 60/30/7 day reminders and notifications.",
                            icon: Bell,
                        },
                        {
                            title: "Compliance Defaults",
                            desc: "Required document coverage and baseline status rules.",
                            icon: ShieldCheck,
                        },
                    ].map((item) => (
                        <div key={item.title} className="dashboard-surface-card">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                                <item.icon size={18} />
                            </div>
                            <h2 className="text-sm font-semibold text-gray-900">{item.title}</h2>
                            <p className="mt-1 text-sm text-gray-500">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
