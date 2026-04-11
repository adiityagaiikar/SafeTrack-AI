import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowRight, Lock, Mail, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [selectedRole, setSelectedRole] = useState("user");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullname, setFullname] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { login, signup, isAuthenticated, user } = useAuth();

    if (isAuthenticated && user) {
        if (user.is_admin) {
            return <Navigate to="/admin/dashboard" replace />;
        }
        return <Navigate to="/overview" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (isLogin) {
                const result = await login({ email, password, selectedRole });
                if (result.role === "admin") {
                    navigate("/admin/dashboard");
                } else {
                    navigate("/overview");
                }
            } else {
                const result = await signup({ fullname, email, password });
                if (result.role === "admin") {
                    navigate("/admin/dashboard");
                } else {
                    navigate("/overview");
                }
            }
        } catch (err) {
            setError(err.message || "Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-[#09090b] text-zinc-100 overflow-hidden relative">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-zinc-800/20 blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: "4s" }} />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-zinc-700/10 blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: "6s", animationDelay: "2s" }} />

            <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative z-10 border-r border-white/5 bg-zinc-950/50 backdrop-blur-3xl">
                <div className="flex items-center gap-3 text-white">
                    <div className="bg-linear-to-br from-zinc-700 to-zinc-900 p-2.5 rounded-xl shadow-lg border border-white/10">
                        <ShieldAlert className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-2xl font-black tracking-tight">Road Safety AI</span>
                </div>

                <div className="space-y-6 max-w-md">
                    <h1 className="text-5xl font-black tracking-tighter leading-tight bg-clip-text text-transparent bg-linear-to-br from-white via-zinc-200 to-zinc-600 drop-shadow-sm">
                        Secure Operator Access.
                    </h1>
                    <p className="text-lg font-medium text-zinc-400">
                        Separate login paths for Admin and User, with signup-login flow for operators.
                    </p>
                </div>

                <div className="text-sm font-semibold text-zinc-500 uppercase tracking-widest">Capstone Project</div>
            </div>

            <div className="flex-1 flex items-center justify-center p-6 relative z-10">
                <div className="w-full max-w-md">
                    <Card className="glass-card border-none shadow-2xl p-8 backdrop-blur-2xl">
                        <div className="mb-6">
                            <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">
                                {isLogin ? "Sign in" : "Create account"}
                            </h2>
                            <p className="text-zinc-400 font-medium">
                                {isLogin ? "Choose role and login." : "Signup for a new user account."}
                            </p>
                        </div>

                        {isLogin && (
                            <div className="mb-5 space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        type="button"
                                        onClick={() => setSelectedRole("user")}
                                        variant="outline"
                                        className={`border-white/10 ${selectedRole === "user" ? "bg-white text-zinc-900" : "text-white"}`}
                                    >
                                        User Login
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => setSelectedRole("admin")}
                                        variant="outline"
                                        className={`border-white/10 ${selectedRole === "admin" ? "bg-amber-400 text-zinc-900" : "text-white"}`}
                                    >
                                        Admin Login
                                    </Button>
                                </div>
                                <p className="text-xs text-zinc-500">
                                    Dummy User: operator@roadsafety.local / user123 | Dummy Admin: admin@roadsafety.local / admin123
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm font-semibold text-center">
                                    {error}
                                </div>
                            )}

                            {!isLogin && (
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                                    <Input
                                        placeholder="Full Name"
                                        required
                                        value={fullname}
                                        onChange={(e) => setFullname(e.target.value)}
                                        className="pl-11 bg-zinc-900/50 border-white/10 text-white h-12 rounded-xl"
                                    />
                                </div>
                            )}

                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                                <Input
                                    type="email"
                                    placeholder="name@organization.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-11 bg-zinc-900/50 border-white/10 text-white h-12 rounded-xl"
                                />
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-11 bg-zinc-900/50 border-white/10 text-white h-12 rounded-xl"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-base"
                            >
                                {loading ? "Processing..." : (isLogin ? "Login" : "Sign Up")}
                                {!loading && <ArrowRight className="w-5 h-5 ml-2 opacity-50" />}
                            </Button>
                        </form>

                        <p className="mt-8 text-center text-sm font-medium text-zinc-400">
                            {isLogin ? "Need an account?" : "Already have an account?"}{" "}
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-white hover:text-zinc-300 font-bold underline decoration-white/30 underline-offset-4 transition-colors"
                            >
                                {isLogin ? "Sign up" : "Sign in"}
                            </button>
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
}
