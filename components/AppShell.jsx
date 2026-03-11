"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";

export default function AppShell({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const isLogin = pathname === "/login";
    const [checking, setChecking] = useState(!isLogin);

    useEffect(() => {
        let cancelled = false;
        const verify = async () => {
            if (isLogin) {
                setChecking(false);
                return;
            }
            setChecking(true);
            try {
                const res = await fetch("/api/auth/me", { credentials: "include" });
                if (!res.ok && !cancelled) {
                    router.replace("/login");
                    return;
                }
            } catch {
                if (!cancelled) router.replace("/login");
                return;
            }
            if (!cancelled) setChecking(false);
        };
        verify();
        return () => {
            cancelled = true;
        };
    }, [isLogin, pathname, router]);

    if (isLogin) {
        return <main className="w-full flex-1 min-h-screen bg-gray-50">{children}</main>;
    }

    if (checking) {
        return (
            <main className="w-full flex-1 min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-sm text-gray-500">Checking session...</p>
            </main>
        );
    }

    return (
        <>
            <Sidebar />
            <main className="main-content bg-gray-50 min-h-screen">{children}</main>
        </>
    );
}
