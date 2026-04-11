import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert, LayoutDashboard, Users, Brain, Route, FileSearch } from 'lucide-react';

export const Sidebar = () => {
    const location = useLocation();

    const navItems = [
        {
            label: 'System Overview',
            path: '/admin/dashboard',
            icon: LayoutDashboard,
        },
        {
            label: 'User Management',
            path: '/admin/users',
            icon: Users,
        },
        {
            label: 'Model Config',
            path: '/admin/config',
            icon: Brain,
        },
        {
            label: 'Dispatch Routing',
            path: '/admin/dispatch',
            icon: Route,
        },
        {
            label: 'Report Audit',
            path: '/admin/reports',
            icon: FileSearch,
        },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <aside className="w-72 glass border-r border-white/5 flex flex-col justify-between z-20 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.5)]">
            {/* Branding */}
            <div className="px-6 py-8">
                <div className="flex items-center gap-3 mb-10 text-white group cursor-pointer">
                    <div className="bg-linear-to-br from-zinc-700 to-zinc-900 p-2.5 rounded-xl shadow-lg shadow-zinc-950/50 transform transition-transform group-hover:scale-105 border border-white/10">
                        <ShieldAlert className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <span className="text-xl font-black tracking-tight text-gradient">Road Safety AI</span>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Admin Console</p>
                    </div>
                </div>

            <nav className="flex flex-col gap-1.5 mt-4">
                <p className="text-[11px] font-bold text-zinc-500 mb-3 px-3 uppercase tracking-widest">System Menu</p>
                <ul className="space-y-1.5">
                    {navItems.map((item) => (
                        <li key={item.path}>
                            {(() => {
                                const Icon = item.icon;
                                return (
                            <Link
                                to={item.path}
                                className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                                    isActive(item.path)
                                        ? 'bg-zinc-800/80 text-white shadow-sm border border-zinc-700/50'
                                        : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 border border-transparent'
                                }`}
                            >
                                {isActive(item.path) && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
                                )}
                                <Icon className={`h-5 w-5 transition-colors ${isActive(item.path) ? 'text-white' : 'text-zinc-500'}`} />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                                );
                            })()}
                        </li>
                    ))}
                </ul>
            </nav>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-black/20 backdrop-blur-md">
                <div className="rounded-xl p-3 text-xs text-zinc-400 text-center border border-white/5 bg-zinc-900/50">
                    <p className="font-semibold text-zinc-300 mb-1">System Status</p>
                    <p className="flex items-center justify-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Control Plane Online
                    </p>
                </div>
            </div>
        </aside>
    );
};
