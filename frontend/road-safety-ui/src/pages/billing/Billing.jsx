import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Card } from "../../components/ui/card";

const PlanBadge = ({ plan }) => {
  const colors = {
    Free: "bg-gray-700 text-gray-300 border-gray-600",
    Pro: "bg-emerald-900/50 text-emerald-300 border-emerald-600",
    Enterprise: "bg-orange-900/50 text-orange-300 border-orange-600",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${
        colors[plan] || colors.Free
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {plan}
    </span>
  );
};

const Toast = ({ type, message, onDismiss }) => {
  useEffect(() => {
    const t = setTimeout(onDismiss, 8000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const styles =
    type === "success"
      ? "bg-emerald-900/80 border-emerald-500 text-emerald-200"
      : "bg-red-900/80 border-red-500 text-red-200";
  const icon = type === "success" ? "OK" : "ERR";

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 max-w-md p-4 rounded-xl border backdrop-blur-sm shadow-2xl animate-fade-in-up ${styles}`}
    >
      <span className="text-xs mt-1 font-black tracking-wider">{icon}</span>
      <div className="flex-1">
        <p className="font-semibold text-sm">{type === "success" ? "Payment Successful" : "Payment Error"}</p>
        <p className="text-xs mt-0.5 opacity-80">{message}</p>
      </div>
      <button onClick={onDismiss} className="opacity-60 hover:opacity-100 text-lg leading-none">
        x
      </button>
    </div>
  );
};

export default function Billing() {
  const { user, token } = useAuth();
  const [processingPlan, setProcessingPlan] = useState(null);
  const [toast, setToast] = useState(null);

  const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  if (user?.is_admin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const currentPlan = user?.subscription_plan || "Free";

  const pricingPlans = [
    {
      id: "Pro",
      name: "Fleet Pro",
      price: "Rs 1,500",
      cycle: "/month",
      tagline: "Perfect for growing fleet operators",
      features: [
        "Up to 5 vehicles monitored",
        "Real-time accident detection",
        "Monthly analytics reports",
        "Priority email support",
        "Basic incident PDF exports",
      ],
      gradient: "from-emerald-900/40 to-gray-900",
      ring: "ring-emerald-700",
      accentText: "text-emerald-400",
      accentBorder: "border-emerald-700/50",
      btnClass: "bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black font-bold shadow-emerald-900/50",
    },
    {
      id: "Enterprise",
      name: "Enterprise Node",
      price: "Rs 5,000",
      cycle: "/month",
      tagline: "For large-scale, mission-critical deployments",
      recommended: true,
      features: [
        "Unlimited vehicles and camera feeds",
        "AI-powered anomaly detection",
        "Real-time analytics dashboard",
        "24/7 dedicated priority support",
        "Custom LLM incident report generation",
        "Razorpay webhook auto-provisioning",
        "Advanced audit trails and compliance logs",
      ],
      gradient: "from-orange-900/30 to-gray-900",
      ring: "ring-orange-600",
      accentText: "text-orange-400",
      accentBorder: "border-orange-700/50",
      btnClass:
        "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold shadow-orange-900/50",
    },
  ];

  const showToast = (type, message) => setToast({ type, message });
  const dismissToast = () => setToast(null);

  const handlePayment = async (planType) => {
    if (processingPlan) return;

    try {
      setProcessingPlan(planType);

      if (!razorpayKeyId) {
        throw new Error("VITE_RAZORPAY_KEY_ID is missing in your frontend .env file.");
      }
      if (!window.Razorpay) {
        throw new Error("Razorpay SDK not loaded. Check index.html script tag.");
      }

      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${apiBaseUrl}/api/payment/create-order`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          plan_type: planType,
          email: user?.email ?? null,
          contact: user?.phone ?? null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Order creation failed (${res.status})`);
      }

      const order = await res.json();
      const plan = pricingPlans.find((p) => p.id === planType);

      const options = {
        key: razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name: "Road Safety AI",
        description: `${plan.name} - ${plan.price}/month`,
        image: "",
        handler(response) {
          showToast(
            "success",
            `Payment captured. Your ${planType} plan will be activated via webhook shortly. Ref: ${response.razorpay_payment_id}`
          );
          setTimeout(() => window.location.reload(), 6000);
        },
        modal: {
          ondismiss() {
            showToast("error", "Payment cancelled. No charges were made.");
          },
        },
        prefill: {
          name: user?.fullname || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        notes: {
          plan_type: planType,
          email: user?.email || "",
        },
        theme: { color: "#10b981" },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (resp) => {
        showToast("error", `Payment failed: ${resp.error.description}`);
      });
      rzp.open();
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setProcessingPlan(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      {toast && <Toast type={toast.type} message={toast.message} onDismiss={dismissToast} />}

      <div className="flex flex-col gap-1.5">
        <h2 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">Subscription Billing</h2>
        <p className="text-zinc-500 font-medium text-lg">Choose a plan and upgrade securely through Razorpay.</p>
        <div className="pt-2 text-sm text-zinc-500">
          Active plan: <PlanBadge plan={currentPlan} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {pricingPlans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id;
          const isProcessing = processingPlan === plan.id;

          return (
            <Card
              key={plan.id}
              className={`glass-card relative overflow-hidden border ${plan.accentBorder} bg-linear-to-b ${plan.gradient} ${
                plan.recommended ? `ring-2 ${plan.ring}` : ""
              }`}
            >
              {plan.recommended && (
                <div className="absolute top-0 right-0 bg-linear-to-r from-orange-500 to-red-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-xl">
                  Recommended
                </div>
              )}
              {isCurrentPlan && (
                <div className="absolute top-0 left-0 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-br-xl">
                  Current
                </div>
              )}

              <div className="p-7 md:p-8">
                <div className="mb-5">
                  <h3 className="text-2xl font-extrabold text-white mb-1">{plan.name}</h3>
                  <p className="text-zinc-400 text-sm">{plan.tagline}</p>
                </div>

                <div className="mb-7 flex items-baseline gap-1">
                  <span className="text-5xl font-black text-white">{plan.price}</span>
                  <span className="text-zinc-500 text-sm">{plan.cycle}</span>
                </div>

                <button
                  id={`btn-upgrade-${plan.id.toLowerCase()}`}
                  onClick={() => handlePayment(plan.id)}
                  disabled={isCurrentPlan || isProcessing || Boolean(processingPlan)}
                  className={`w-full py-3 px-5 rounded-xl text-sm transition-all duration-200 shadow-lg mb-7 ${plan.btnClass} ${
                    isCurrentPlan
                      ? "opacity-40 cursor-not-allowed"
                      : processingPlan
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:shadow-xl hover:-translate-y-0.5"
                  }`}
                >
                  {isProcessing ? "Creating order..." : isCurrentPlan ? "Your Current Plan" : `Upgrade to ${plan.name}`}
                </button>

                <div className="border-t border-zinc-800 pt-6 space-y-2.5">
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">What's included</p>
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className={`text-base leading-none mt-0.5 ${plan.accentText}`}>+</span>
                      <span className="text-zinc-300 text-sm">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}