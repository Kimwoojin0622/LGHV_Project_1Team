/**
 * ChurnReasonChart.tsx
 * 해지 사유별 분포 차트 컴포넌트
 * 
 * 기능:
 * 1. 해지 사유별 고객 수를 파이/도넛 차트로 표시
 * 2. 차트 타입 전환 기능 (파이 ↔ 도넛)
 * 3. 도움말 모달 표시 기능
 * 4. 각 해지 사유별 비율을 툴팁으로 표시
 * 
 * 데이터:
 * - API 엔드포인트: /api/churn_rate
 * - 표시 정보: 해지 사유별 고객 수와 비율
 */

"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Button } from "@/components/ui/button"
import { HelpCircle, PieChart as PieChartIcon, Circle } from "lucide-react"
import ChurnRiskHelpModal from "./ChurnRiskHelpModal"

// 컴포넌트 props 타입 정의
interface ChurnReasonChartProps {
  selectedMonth: string  // 선택된 월 (예: "1월")
}

// 색상 배열
const COLORS = ["#2563eb", "#82ca9d", "#FFBB28", "#ff8042", "#ED174D"]

export default function ChurnReasonChart({ selectedMonth }: ChurnReasonChartProps) {
  // 상태 관리
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false)  // 도움말 모달 상태
  const [chartData, setChartData] = useState<{ name: string; value: number; color: string; count: number }[]>([])  // 차트 데이터
  const [loading, setLoading] = useState(true)  // 로딩 상태
  const [chartType, setChartType] = useState<'pie' | 'donut'>('donut')  // 차트 타입 (파이/도넛)

  // localStorage에서 저장된 차트 타입 불러오기
  useEffect(() => {
    const savedType = localStorage.getItem('churnReasonChartType');
    if (savedType === 'pie' || savedType === 'donut') {
      setChartType(savedType as 'pie' | 'donut');
    }
  }, []);

  // 차트 타입 변경 시 localStorage에 저장
  const handleChartTypeChange = (newType: 'pie' | 'donut') => {
    setChartType(newType);
    localStorage.setItem('churnReasonChartType', newType);
  };

  // API에서 해지 사유별 데이터 가져오기
  useEffect(() => {
    const fetchChurnCategoryData = async () => {
      try {
        const response = await axios.get(`http://54.206.52.197:8000/api/churn_rate?p_mt=${selectedMonth}`)
        const data = response.data.find((item: any) => item.p_mt === parseInt(selectedMonth, 10))

        if (data) {
          // 데이터 가공 및 색상 매핑
          const total =
            data.category_stable +
            data.category_normal +
            data.category_caution +
            data.category_risk +
            data.category_high_risk

          if (total > 0) {
            const formattedData = [
              { name: "안정", value: (data.category_stable / total) * 100, color: COLORS[0], count: data.category_stable },
              { name: "양호", value: (data.category_normal / total) * 100, color: COLORS[1], count: data.category_normal },
              { name: "주의", value: (data.category_caution / total) * 100, color: COLORS[2], count: data.category_caution },
              { name: "위험", value: (data.category_risk / total) * 100, color: COLORS[3], count: data.category_risk },
              { name: "매우 위험", value: (data.category_high_risk / total) * 100, color: COLORS[4], count: data.category_high_risk },
            ]
            setChartData(formattedData)
          }
        }
        setLoading(false)
      } catch (error) {
        console.error("데이터 로드 실패:", error)
        setLoading(false)
      }
    }

    fetchChurnCategoryData()
  }, [selectedMonth])

  // 커스텀 툴팁 컴포넌트
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
          <p className="font-bold" style={{ color: data.color }}>
            {data.name}: {data.value.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle>고객 해지 위험 분포</CardTitle>
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
          onClick={() => handleChartTypeChange(chartType === 'pie' ? 'donut' : 'pie')}
          className="h-8 w-8"
        >
          {chartType === 'pie' ? (
            <Circle className="h-4 w-4" />
          ) : (
            <PieChartIcon className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex justify-center items-center h-[300px]">데이터가 없습니다.</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={chartType === 'donut' ? 60 : 0}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={2}
                label={(entry) => `${entry.name}: ${entry.count.toLocaleString()}명`}
                labelLine={true}
                isAnimationActive={false}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    style={{
                      filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.1))",
                    }}
                  />
                ))}
              </Pie>
              <Tooltip
                content={<CustomTooltip />}
                contentStyle={{
                  backgroundColor: "transparent",
                  border: "none",
                  padding: 0,
                }}
              />
              <Legend 
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{
                  paddingTop: "30px",
                  fontWeight: "bold"
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
      <ChurnRiskHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </Card>
  )
}