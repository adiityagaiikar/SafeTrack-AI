import React from "react";
import { useAuth } from "../../context/AuthContext";

export default function UserProfile() {
  const { user, role } = useAuth();

  return (
    <section className="max-w-2xl rounded-xl border border-gray-800 bg-gray-900 p-6">
      <h2 className="text-xl font-bold text-white">User Profile</h2>
      <div className="mt-4 space-y-2 text-sm">
        <p className="text-gray-300">Name: <span className="text-white">{user?.fullname || "-"}</span></p>
        <p className="text-gray-300">Email: <span className="text-white">{user?.email || "-"}</span></p>
        <p className="text-gray-300">Role: <span className="text-emerald-300 uppercase">{role || "user"}</span></p>
      </div>
    </section>
  );
}
