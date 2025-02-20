/**
 * RiskDistributionChart.tsx
 * 위험도별 고객 분포를 시각화하는 차트 컴포넌트
 * 
 * 기능:
 * 1. 데이터 시각화
 *    - 위험도별 고객 수 표시 (매우 위험/위험/주의)
 *    - 파이/도넛 차트 전환 가능
 *    - 각 위험도별 비율을 툴팁으로 표시
 * 
 * 2. 데이터 처리
 *    - API 엔드포인트: /risk-summary/risk-distribution
 *    - 월별 데이터 필터링
 *    - 전체 고객 수 대비 비율 계산
 * 
 * 3. 사용자 경험
 *    - 차트 타입 선택 저장 (localStorage)
 *    - 도움말 모달 제공
 *    - 직관적인 색상 코드 사용
 *      - 매우 위험: #ED174D (빨간색)
 *      - 위험: #ff8042 (주황색)
 *      - 주의: #FFBB28 (노란색)
 * 
 * Props:
 * - month: 조회 기준 월 (string)
 * 
 * 스타일:
 * - recharts 라이브러리 사용
 * - 반응형 컨테이너로 구현
 * - 호버 시 상세 정보 툴팁
 * - 우측 상단 컨트롤 버튼 배치
 */

"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { PieChart, Pie, Tooltip, Cell, Legend, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { HelpCircle, PieChart as PieChartIcon, Circle } from "lucide-react";
import ChurnRiskHelpModal from "./ChurnRiskHelpModal";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://54.206.52.197:8000";

// 🔹 위험도별 색상 지정
const COLORS = ["#ED174D", "#ff8042", "#FFBB28"];  // 매우 위험 - #ED174D, 위험 - #ff8042, 주의 - #FFBB28

export default function RiskDistributionChart({ month }: { month: string }) {
  // 상태 관리
  const [data, setData] = useState<{ name: string; value: number; fill: string }[]>([]);  // 차트 데이터
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);  // 도움말 모달 상태
  const [chartType, setChartType] = useState<'pie' | 'donut'>('donut');  // 차트 타입 (파이/도넛)

  // localStorage에서 저장된 차트 타입 불러오기
  useEffect(() => {
    const savedType = localStorage.getItem('riskDistributionChartType');
    if (savedType === 'pie' || savedType === 'donut') {
      setChartType(savedType as 'pie' | 'donut');
    }
  }, []);

  // 차트 타입 변경 시 localStorage에 저장
  const handleChartTypeChange = (newType: 'pie' | 'donut') => {
    setChartType(newType);
    localStorage.setItem('riskDistributionChartType', newType);
  };

  // API에서 위험도별 고객 분포 데이터 가져오기
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get(`${API_BASE_URL}/risk-summary/risk-distribution`, {
          params: { month: parseInt(month.replace("월", "")) },
        });

        // 데이터 가공 및 색상 매핑
        const fetchedData = response.data;
        setData(
          Object.keys(fetchedData).map((key, idx) => ({
            name: key,
            value: fetchedData[key],
            fill: COLORS[idx],
          }))
        );
      } catch (error) {
        console.error("위험도별 고객 분포 데이터 로드 실패:", error);
      }
    }
    fetchData();
  }, [month]);

  // 전체 고객 수 계산
  const totalCustomers = data.reduce((sum, item) => sum + item.value, 0);

  // 커스텀 툴팁 컴포넌트
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      const percentage = ((data.value / totalCustomers) * 100).toFixed(1);
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
          <p className="font-bold" style={{ color: data.fill }}>
            {data.name}: {percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 flex gap-2 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleChartTypeChange(chartType === 'pie' ? 'donut' : 'pie')}
          className="h-8 w-8 bg-white"
        >
          {chartType === 'pie' ? (
            <Circle className="h-4 w-4" />
          ) : (
            <PieChartIcon className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsHelpModalOpen(true)}
          className="h-8 w-8 bg-white"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </div>
      {data.length === 0 ? (
        <div className="flex justify-center items-center h-[300px]">데이터가 없습니다.</div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={chartType === 'donut' ? 60 : 0}
              outerRadius={80}
              paddingAngle={2}
              label={(entry) => `${entry.name}: ${entry.value.toLocaleString()}명`}
              labelLine={true}
              isAnimationActive={false}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.fill}
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
      <ChurnRiskHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  );
}