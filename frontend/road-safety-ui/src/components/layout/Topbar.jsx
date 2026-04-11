import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Bell, ShieldAlert, LogOut } from 'lucide-react';

export const Topbar = () => {
    const { user, logout } = useAuth();
    const displayName = user?.fullname || user?.email || 'Administrator';
    const displayEmail = user?.email || '';

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    return (
        <header className="flex h-20 items-center justify-between glass border-b border-white/5 px-8 z-20 shrink-0">
            <div className="flex items-center gap-3">
                <div className="bg-linear-to-br from-zinc-700 to-zinc-900 p-2.5 rounded-xl shadow-lg shadow-zinc-950/50 border border-white/10">
                    <ShieldAlert className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h1 className="text-base font-extrabold text-white tracking-tight">Intelligent Transportation System</h1>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">System Admin</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="p-2.5 rounded-full bg-zinc-900/80 border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] border border-zinc-900"></span>
                </button>
                <div className="text-right hidden sm:block">
                    <p className="text-zinc-100 text-sm font-medium truncate max-w-55">{displayName}</p>
                    {displayEmail && <p className="text-zinc-500 text-xs truncate max-w-55">{displayEmail}</p>}
                </div>
                <div className="w-10 h-10 rounded-full border border-white/20 shadow-sm bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <span className="text-white font-bold text-base">
                        {displayName?.charAt(0)?.toUpperCase()}
                    </span>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="ml-2 border-white/10 text-zinc-300 hover:bg-white hover:text-zinc-950 hover:border-white transition-all group"
                >
                    <LogOut className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Logout
                </Button>
            </div>
        </header>
    );
};
