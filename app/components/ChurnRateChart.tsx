/**
 * ChurnRateChart.tsx
 * 해지율 차트 컴포넌트
 * 
 * 기능:
 * 1. 월별 해지율을 라인 차트 또는 바 차트로 표시
 * 2. 차트 타입 전환 기능 (라인 ↔ 바)
 * 3. 도움말 모달 표시 기능
 * 
 * 데이터:
 * - API 엔드포인트: /api/churn_rate
 * - 표시 정보: 월별 전체 고객 수, 해지 고객 수로 계산된 해지율(%)
 */

"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChartIcon, LineChartIcon, HelpCircle } from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import HelpModal from "./HelpModal"

// 컴포넌트 props 타입 정의
interface ChurnRateChartProps {
  selectedMonth: number // 선택된 월 (1-12)
}

export default function ChurnRateChart({ selectedMonth }: ChurnRateChartProps) {
  // 상태 관리
  const [data, setData] = useState<any[]>([])  // 차트 데이터
  const [chartType, setChartType] = useState<"line" | "bar">("line")  // 차트 타입 (라인/바)
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false)  // 도움말 모달 상태

  // localStorage에서 저장된 차트 타입 불러오기
  useEffect(() => {
    const savedType = localStorage.getItem('churnRateChartType');
    if (savedType === 'line' || savedType === 'bar') {
      setChartType(savedType as "line" | "bar");
    }
  }, []);

  // 차트 타입 변경 시 localStorage에 저장
  const handleChartTypeChange = (newType: "line" | "bar") => {
    setChartType(newType);
    localStorage.setItem('churnRateChartType', newType);
  };

  // API에서 해지율 데이터 가져오기
  useEffect(() => {
    const fetchChurnRate = async () => {
      try {
        const response = await axios.get("http://54.206.52.197:8000/api/churn_rate")
        // 12월 데이터 제외하고 해지율 계산하여 데이터 가공
        const filteredData = response.data
          .filter((item: any) => item.p_mt !== 12)
          .map((item: any) => ({
            p_mt: item.p_mt,
            month: `${item.p_mt}월`,
            churn_rate: ((item.churn_customers / item.total_customers) * 100).toFixed(2),
          }))
        setData(filteredData)
      } catch (error) {
        console.error("Error fetching churn rate data:", error)
      }
    }
    fetchChurnRate()
  }, [selectedMonth])

  // 차트 렌더링 함수
  const renderChart = () => {
    const ChartComponent = chartType === "line" ? LineChart : BarChart

    return (
      <ChartComponent data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis domain={[0.6, 0.8]} ticks={[0.6, 0.65, 0.7, 0.75, 0.8]} />
        <Tooltip 
          cursor={chartType === "bar" ? false : undefined} 
          content={<CustomTooltip />} 
        />
        {chartType === "line" ? (
          <Line
            type="monotone"
            dataKey="churn_rate"
            stroke="#A50034"
            strokeWidth={2}
          />
        ) : (
          <Bar
            dataKey="churn_rate"
            fill="#A50034"
            radius={[4, 4, 0, 0]}
          />
        )}
      </ChartComponent>
    )
  }

  // 커스텀 툴팁 컴포넌트
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
          <p className="font-medium">{data.month}</p>
          <p className="text-sm font-bold" style={{ color: '#A50034' }}>해지율: {data.churn_rate}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle>월별 해지율</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsHelpModalOpen(true)}
            className="h-8 w-8"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleChartTypeChange(chartType === "line" ? "bar" : "line")}
          className="h-8 w-8"
          title={`${chartType === "line" ? "막대" : "라인"} 차트로 변경`}
        >
          {chartType === "line" ? (
            <BarChartIcon className="h-4 w-4" />
          ) : (
            <LineChartIcon className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
    </Card>
  )
}