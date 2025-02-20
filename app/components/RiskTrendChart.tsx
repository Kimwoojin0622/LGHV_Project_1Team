/**
 * RiskTrendChart.tsx
 * 위험도별 고객 수의 월별 변화 추이를 시각화하는 차트 컴포넌트
 * 
 * 기능:
 * 1. 데이터 시각화
 *    - 위험도별 고객 수 월별 추이 표시
 *    - 3개 위험군 동시 표시 (매우 위험/위험/주의)
 *    - Y축: 고객 수 (50,000 ~ 400,000 범위)
 *    - X축: 월 표시
 * 
 * 2. 데이터 처리
 *    - API 엔드포인트: /risk-summary/risk-trend
 *    - 자동 데이터 로드 (컴포넌트 마운트 시)
 *    - 숫자 천 단위 구분자 적용
 * 
 * 3. 사용자 경험
 *    - 직관적인 색상 코드 사용
 *      - 매우 위험: #ED174D (빨간색)
 *      - 위험: #ff8042 (주황색)
 *      - 주의: #FFBB28 (노란색)
 *    - 호버 시 상세 정보 툴팁
 *      - 월별 각 위험군의 정확한 고객 수 표시
 *    - 범례에 굵은 글씨 적용
 * 
 * 스타일:
 * - recharts 라이브러리 사용
 * - 반응형 컨테이너 (width 100%, height 300px)
 * - 점선 그리드로 가독성 향상
 * - 라인 두께 2px, 데이터 포인트 반지름 3px
 */

"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from "recharts";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://54.206.52.197:8000";

// 커스텀 툴팁 컴포넌트
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-200 shadow-md">
        <p className="font-bold mb-1">{label}월</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function RiskTrendChart() {
  // ✅ 상태 변수 (월별 데이터 저장)
  const [data, setData] = useState<{ p_mt: number; "매우 위험": number; "위험": number; "주의": number }[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get(`${API_BASE_URL}/risk-summary/risk-trend`);
        setData(response.data);
      } catch (error) {
        console.error("위험군 변화 추이 데이터 로드 실패:", error);
      }
    }
    fetchData();
  }, []);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="p_mt" tickFormatter={(tick) => `${tick}월`} />
        <YAxis domain={[50000, 400000]} tickFormatter={(value) => `${value.toLocaleString()}`} />
        <Tooltip content={<CustomTooltip />} />
        <Legend formatter={(value) => <span style={{ fontWeight: 'bold' }}>{value}</span>} />
        <Line type="monotone" dataKey="주의" stroke="#FFBB28" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="위험" stroke="#ff8042" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="매우 위험" stroke="#ED174D" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}