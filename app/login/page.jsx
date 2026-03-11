"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("admin@gravity.local");
    const [password, setPassword] = useState("admin123");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email, password }),
            });
            const payload = await res.json();
            if (!res.ok || !payload?.success) {
                setError(payload?.error || "Login failed");
                return;
            }
            router.replace("/");
        } catch {
            setError("Unable to connect. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="min-h-screen flex flex-col lg:flex-row lg:items-center">
                
                {/* Left branding panel - FIXED WITH INLINE STYLES */}
<section className="relative hidden overflow-hidden lg:flex lg:w-[44%] lg:h-screen">
    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-900 to-violet-700" />
    <div
        className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-violet-400/30 blur-3xl"
        style={{ animation: "floatOne 9s ease-in-out infinite" }}
    />
    <div
        className="absolute top-1/2 -right-28 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl"
        style={{ animation: "floatTwo 12s ease-in-out infinite" }}
    />
    <div
        className="absolute bottom-8 left-10 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl"
        style={{ animation: "floatThree 10s ease-in-out infinite" }}
    />

    {/* CONTENT CONTAINER WITH FORCED PADDING */}
    <div className="relative z-10 flex h-full w-full items-center justify-center text-white" style={{ paddingLeft: '80px', paddingRight: '80px' }}>
        <div className="-translate-y-10 max-w-[380px] w-full" style={{ animation: "fadeUp 650ms ease-out both" }}>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/25 bg-white/10 text-lg font-bold tracking-wide backdrop-blur">
                G
            </div>
            <p style={{ marginTop: '40px', fontSize: '12px', letterSpacing: '0.18em', color: 'rgba(224, 231, 255, 0.8)', textTransform: 'uppercase' }}>Secure Workspace</p>
            <h1 style={{ marginTop: '16px', fontSize: '52px', fontWeight: '600', lineHeight: '1.04', color: '#FFFFFF' }}>
                Gravity Employee Management
            </h1>
            <p style={{ marginTop: '28px', maxWidth: '34ch', fontSize: '16px', lineHeight: '1.75', color: 'rgba(224, 231, 255, 0.9)' }}>
                Manage employees, documents, and alerts from one dashboard.
            </p>
        </div>
    </div>
</section>

                {/* Right form panel - UNCHANGED */}
                <section className="relative flex w-full items-center justify-center px-6 py-12 sm:px-10 lg:w-[56%] lg:px-16 xl:px-24">
                    
                    {/* MAIN CARD - FORCE INLINE PADDING */}
                    <div 
                        className="w-full max-w-md rounded-3xl bg-white shadow-xl border border-gray-100"
                        style={{ animation: "fadeUp 500ms ease-out both", padding: '48px' }}
                    >
                        
                        {/* HEADER WITH TOP & BOTTOM SPACE */}
                        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                            <h2 style={{ fontSize: '32px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>Welcome back</h2>
                            <p style={{ fontSize: '15px', color: '#6B7280' }}>Sign in to your dashboard</p>
                        </div>

                        {/* FORM SECTION */}
                        <form onSubmit={handleSubmit}>
                            
                            {/* EMAIL FIELD */}
                            <div style={{ marginBottom: '24px' }}>
                                <label htmlFor="email" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px', paddingLeft: '4px' }}>Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={{ width: '100%', height: '48px', borderRadius: '16px', border: '1px solid #E5E7EB', paddingLeft: '20px', paddingRight: '20px', fontSize: '16px', outline: 'none', transition: 'all 0.2s' }}
                                    onFocus={(e) => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.1)'; }}
                                    onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
                                    placeholder="you@company.com"
                                    required
                                />
                            </div>

                            {/* PASSWORD FIELD */}
                            <div style={{ marginBottom: '24px' }}>
                                <label htmlFor="password" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px', paddingLeft: '4px' }}>Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{ width: '100%', height: '48px', borderRadius: '16px', border: '1px solid #E5E7EB', paddingLeft: '20px', paddingRight: '20px', fontSize: '16px', outline: 'none', transition: 'all 0.2s' }}
                                    onFocus={(e) => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.1)'; }}
                                    onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>

                            {/* ERROR MESSAGE */}
                            {error && (
                                <p style={{ marginBottom: '16px', fontSize: '14px', color: '#DC2626', paddingLeft: '4px' }}>{error}</p>
                            )}
                            
                            {/* SUBMIT BUTTON */}
                            <button
                                type="submit"
                                disabled={loading}
                                style={{ 
                                    width: '100%', 
                                    height: '48px', 
                                    borderRadius: '16px', 
                                    backgroundColor: '#7C3AED', 
                                    color: 'white', 
                                    fontWeight: '500', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    gap: '8px', 
                                    border: 'none', 
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.6 : 1,
                                    marginTop: '8px',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => { if (!loading) e.target.style.backgroundColor = '#6D28D9'; }}
                                onMouseLeave={(e) => { if (!loading) e.target.style.backgroundColor = '#7C3AED'; }}
                            >
                                {loading ? "Signing in..." : "Sign in"}
                                {!loading && <ArrowRight size={15} />}
                            </button>
                        </form>

                        {/* FOOTER WITH BOTTOM SPACE */}
                        <p style={{ textAlign: 'center', fontSize: '12px', color: '#9CA3AF', marginTop: '32px' }}>© Gravity Systems</p>
                    
                    </div>
                </section>
            </div>
            
            <style jsx>{`
                @keyframes floatOne {
                    0%, 100% { transform: translate3d(0, 0, 0); }
                    50% { transform: translate3d(16px, -10px, 0); }
                }
                @keyframes floatTwo {
                    0%, 100% { transform: translate3d(0, 0, 0); }
                    50% { transform: translate3d(-10px, 14px, 0); }
                }
                @keyframes floatThree {
                    0%, 100% { transform: translate3d(0, 0, 0); }
                    50% { transform: translate3d(8px, -12px, 0); }
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}