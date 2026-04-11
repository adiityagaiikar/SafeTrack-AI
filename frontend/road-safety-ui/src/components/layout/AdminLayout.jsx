import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const AdminLayout = () => {
    const { user, loading, isAuthenticated } = useAuth();

    // Show loading state
    if (loading) {
        return (
            <div className="w-full h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 bg-amber-500/20 rounded-lg border border-amber-500/40 flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <span className="text-amber-400 font-bold text-2xl">⚡</span>
                    </div>
                    <p className="text-slate-300">Loading...</p>
                </div>
            </div>
        );
    }

    // Check if user is authenticated and has admin role
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (user && !user?.is_admin) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="flex h-screen w-full bg-transparent overflow-hidden">

            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-zinc-800/20 blur-3xl pointer-events-none -z-10 animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-zinc-700/10 blur-3xl pointer-events-none -z-10" />

            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
                {/* Topbar */}
                <Topbar />

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-8 relative z-0 hide-scrollbar">
                    <div className="max-w-6xl mx-auto pb-12">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};
