"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface ChurnRateChartProps {
  selectedMonth: number
}

export default function ChurnRateChart({ selectedMonth }: ChurnRateChartProps) {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    const fetchChurnRate = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/churn_rate")
        const filteredData = response.data
          .filter((item: any) => item.p_mt !== 12) // ✅ 12월 제거
          .map((item: any) => ({
            p_mt: item.p_mt,
            churn_rate: ((item.churn_customers / item.total_customers) * 100).toFixed(2),
          }))
        setData(filteredData)
      } catch (error) {
        console.error("Error fetching churn rate data:", error)
      }
    }
    fetchChurnRate()
  }, [selectedMonth])

  return (
    <Card>
      <CardHeader>
        <CardTitle>월별 해지율</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="p_mt" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="churn_rate" stroke="#ED174D" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
