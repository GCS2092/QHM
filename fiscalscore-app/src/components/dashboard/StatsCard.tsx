type Color = "blue" | "red" | "green" | "emerald";
interface StatsCardProps { title: string; value: string; change: string; positive: boolean; icon: React.ReactNode; color: Color; }
const colorMap: Record<Color, { bg: string; icon: string }> = {
  blue: { bg: "bg-blue-50", icon: "text-blue-600" },
  red: { bg: "bg-red-50", icon: "text-red-600" },
  green: { bg: "bg-green-50", icon: "text-green-600" },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-600" },
};
export default function StatsCard({ title, value, change, positive, icon, color }: StatsCardProps) {
  const colors = colorMap[color];
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <div className={`w-9 h-9 ${colors.bg} rounded-lg flex items-center justify-center ${colors.icon}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className={`text-xs font-medium ${positive ? "text-green-600" : "text-red-500"}`}>{change}</p>
    </div>
  );
}
