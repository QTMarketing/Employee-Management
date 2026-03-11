"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Store, Settings, Zap, LogOut } from 'lucide-react';

const links = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/employees', label: 'Employees', icon: Users },
    { href: '/stores', label: 'Stores', icon: Store },
    { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        router.replace('/login');
    };

    return (
        <div className="fixed top-0 left-0 h-screen w-[268px] bg-slate-900 border-r border-slate-800/90 flex flex-col px-5 pt-7 pb-6 z-10 shadow-[2px_0_24px_rgba(2,6,23,0.25)]">
            {/* Brand */}
            <div className="flex items-center gap-3 px-2 mb-9">
                <div className="w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Zap size={16} className="text-white" />
                </div>
                <div className="flex flex-col leading-none">
                    <span className="text-white font-semibold text-[15px] tracking-tight">Gravity</span>
                    <span className="text-slate-400 font-medium text-[11px] tracking-[0.12em] uppercase">Compliance</span>
                </div>
            </div>

            {/* Navigation Label */}
            <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-[0.14em] px-2 mb-2">
                Navigation
            </p>

            {/* Nav Links */}
            <ul className="flex flex-col gap-2 flex-1">
                {links.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href;
                    return (
                        <li key={href}>
                            <Link
                                href={href}
                                className={`flex items-center h-10 gap-3 px-3.5 rounded-xl font-medium text-sm transition-all duration-200
                                    ${isActive
                                        ? 'bg-indigo-500/18 text-indigo-100 border border-indigo-400/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
                                        : 'text-slate-400 border border-transparent hover:text-slate-100 hover:bg-white/5 hover:border-slate-700'
                                    }`}
                            >
                                <Icon size={17} className={isActive ? 'text-indigo-300' : 'text-slate-500'} />
                                {label}
                                {isActive && (
                                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-300" />
                                )}
                            </Link>
                        </li>
                    );
                })}
            </ul>

            {/* Footer */}
            <div className="px-2 pt-4 border-t border-slate-800/90">
                <button
                    onClick={handleLogout}
                    className="w-full mb-3 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700/90 transition-colors"
                >
                    <LogOut size={14} />
                    Logout
                </button>
                <p className="text-slate-500 text-xs">Gravity EMS v1.0</p>
                <p className="text-slate-600 text-[11px] mt-0.5">Employee Management System</p>
            </div>
        </div>
    );
}
