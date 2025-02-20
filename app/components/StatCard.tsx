/**
 * StatCard.tsx
 * 통계 정보를 카드 형태로 표시하는 재사용 가능한 컴포넌트
 * 
 * 기능:
 * 1. 통계 데이터 표시
 *    - 제목
 *    - 값 (큰 글씨)
 *    - 증감 표시 (선택적)
 *      - 상승/하락 화살표
 *      - 증감률 퍼센트
 * 
 * Props:
 * - title: 통계 항목 제목 (string)
 * - value: 표시할 값 (string)
 * - trend?: 증감 방향 ('up' | 'down')
 * - percentage?: 증감률 (string)
 * 
 * 스타일:
 * - shadcn/ui Card 컴포넌트 사용
 * - 브랜드 컬러
 *   - 텍스트: #53565A (회색)
 *   - 상승: #ED174D (빨간색)
 *   - 하락: blue-600 (파란색)
 * - 반응형 너비 (w-full)
 * - 타이포그래피
 *   - 제목: 작은 글씨, medium 무게
 *   - 값: 큰 글씨 (text-2xl), 굵은 무게
 *   - 증감률: 아주 작은 글씨
 */

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