import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function UserLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navClass = ({ isActive }) =>
    `px-4 py-2 rounded-md border text-sm font-medium transition ${
      isActive
        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
        : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700"
    }`;

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <header className="h-16 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-sm font-semibold tracking-wide uppercase text-zinc-300">Road Safety AI - User Console</p>
        </div>
        <div className="flex items-center gap-2">
          <NavLink to="/user/profile" className={navClass}>Profile</NavLink>
          <NavLink to="/user/upload" className={navClass}>Upload</NavLink>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-200 text-sm hover:border-red-500/40 hover:text-red-300"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="p-6">
        <div className="mb-4 rounded-md border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-400">
          Logged in as <span className="text-zinc-200">{user?.fullname || "User"}</span>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
