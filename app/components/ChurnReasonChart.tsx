"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"
import ChurnRiskHelpModal from "./ChurnRiskHelpModal"

const COLORS = ["#2563eb", "#82ca9d", "#FFBB28", "#ff8042", "#ED174D"]

interface ChurnReasonChartProps {
  selectedMonth: string
}

export default function ChurnReasonChart({ selectedMonth }: ChurnReasonChartProps) {
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false)
  const [chartData, setChartData] = useState<{ name: string; value: number; color: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChurnCategoryData = async () => {
      try {
        // API에서 해당 월의 category 데이터를 가져옴
        const response = await axios.get(`http://localhost:8000/api/churn_rate?p_mt=${selectedMonth}`)
        const data = response.data.find((item: any) => item.p_mt === parseInt(selectedMonth, 10))

        if (data) {
          const total =
            data.category_stable +
            data.category_normal +
            data.category_caution +
            data.category_risk +
            data.category_high_risk

          if (total > 0) {
            const formattedData = [
              { name: "안정", value: (data.category_stable / total) * 100, color: COLORS[0] },
              { name: "양호", value: (data.category_normal / total) * 100, color: COLORS[1] },
              { name: "주의", value: (data.category_caution / total) * 100, color: COLORS[2] },
              { name: "위험", value: (data.category_risk / total) * 100, color: COLORS[3] },
              { name: "매우 위험", value: (data.category_high_risk / total) * 100, color: COLORS[4] },
            ]
            setChartData(formattedData)
          }
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching churn category data:", error)
        setLoading(false)
      }
    }

    if (selectedMonth) {
      fetchChurnCategoryData()
    }
  }, [selectedMonth])

  return (
    <Card className="border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-[#53565A]">고객 해지 위험 분포</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setIsHelpModalOpen(true)} className="h-8 w-8">
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center mt-10 text-gray-600">데이터 불러오는 중...</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(2)}%`, "비율"]}
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #E5E7EB",
                  borderRadius: "4px",
                  padding: "8px",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
      <ChurnRiskHelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
    </Card>
  )
}
