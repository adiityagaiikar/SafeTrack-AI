import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, TrendingUp, ShieldCheck, Map } from "lucide-react";

export default function BehaviorAnalytics() {
  // Mock data representing the Driving Behavior Analytics Module output
  const overallScore = 82;
  
  const metrics = [
    { name: "Lane Discipline", score: 90, status: "Excellent" },
    { name: "Braking Frequency", score: 65, status: "Needs Improvement" },
    { name: "Acceleration Stability", score: 85, status: "Good" },
    { name: "Following Distance", score: 88, status: "Good" },
  ];

  const recentViolations = [
    { time: "14-Mar 09:15 AM", type: "Harsh Braking", location: "Highway Route 9", severity: "Medium" },
    { time: "12-Mar 06:30 PM", type: "Tailgating", location: "Intersection Main", severity: "High" },
    { time: "10-Mar 08:45 AM", type: "Lane Drift", location: "City Center Cam 3", severity: "Low" },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Behavior Analytics</h2>
          <p className="text-slate-500 mt-1">Evaluate driving patterns and risk distribution trends.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-3 rounded-lg border shadow-sm">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-slate-500">Overall Safety Score</span>
            <span className="text-2xl font-bold text-indigo-600">{overallScore} / 100</span>
          </div>
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-indigo-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Breakdown */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Performance Breakdown</CardTitle>
            <CardDescription>Analysis of your uploaded driving sessions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {metrics.map((metric, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{metric.name}</span>
                  <span className="text-slate-500">{metric.score}%</span>
                </div>
                <Progress 
                  value={metric.score} 
                  className={`h-2 ${
                    metric.score >= 85 ? "[&>div]:bg-green-500" : 
                    metric.score >= 70 ? "[&>div]:bg-yellow-500" : 
                    "[&>div]:bg-red-500"
                  }`} 
                />
                <p className="text-xs text-slate-500 text-right">{metric.status}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Personalized Recommendations */}
        <Card className="col-span-1 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 bg-slate-50 m-4 mt-0 rounded-md p-4 border border-slate-100">
            <ul className="space-y-4 text-sm text-slate-700">
              <li className="flex gap-3">
                <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                <p><strong>Reduce Harsh Braking:</strong> Your braking frequency score is low. Anticipate traffic flow earlier to avoid sudden stops.</p>
              </li>
              <li className="flex gap-3">
                <Activity className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <p><strong>Maintain Consistency:</strong> Excellent lane discipline! Keep maintaining steady acceleration in heavy traffic zones.</p>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Risk Heatmap / Violation Log */}
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Time-Stamped Violation Reports</CardTitle>
              <CardDescription>Recent risky behaviors detected by the system.</CardDescription>
            </div>
            <Map className="h-5 w-5 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {recentViolations.map((violation, i) => (
                <div key={i} className="flex flex-col gap-2 p-4 border rounded-lg bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">{violation.type}</span>
                    <Badge variant="outline" className={
                      violation.severity === "High" ? "bg-red-50 text-red-700 border-red-200" :
                      violation.severity === "Medium" ? "bg-orange-50 text-orange-700 border-orange-200" :
                      "bg-yellow-50 text-yellow-700 border-yellow-200"
                    }>
                      {violation.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    {violation.time}
                  </p>
                  <p className="text-xs font-medium text-slate-700 mt-1">📍 {violation.location}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}