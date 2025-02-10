import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string
  trend?: "up" | "down"
  percentage?: string
}

export default function StatCard({ title, value, trend, percentage }: StatCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-[#53565A]">{title}</CardTitle>
        {trend && (
          <div className={`flex items-center ${trend === "up" ? "text-[#ED174D]" : "text-blue-600"}`}>
            {trend === "up" ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4 text-blue-600" />}
            <span className="text-xs ml-1">{percentage}</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-[#53565A] break-words">{value}</div>
      </CardContent>
    </Card>
  )
}

