/**
 * ChurnFactorsChart.tsx
 * 위험군 분석 페이지의 주요 해지 요인 차트 컴포넌트
 * 
 * 주요 기능:
 * 1. 해지 요인 데이터 표시
 *    - API에서 데이터 가져오기 (/risk-summary/churn-factors)
 *    - 영향도에 따른 정렬
 * 2. 데이터 가공
 *    - 영향도를 백분율로 변환 (원본 값 * 100)
 *    - 소수점 둘째자리까지 표시 (예: 69.56%)
 * 3. 요인별 상세 설명 (툴팁)
 *    - 결합 상품 유무: 번들 사용 시 해지율 증가
 *    - 상품명: 고가 상품 사용 시 해지율 증가 (예: 프리미엄)
 *    - 셋톱박스 휴면 유무: 최근 한 달간 셋톱박스 미사용 시 해지율 증가
 *    - 약정 남은 개월 수: 약정 종료일이 가까울수록 해지율 증가
 *    - 1개월 평균 채널 시청시간: 월평균 채널 시청 시간이 적을수록 해지율 증가
 *    - 최근 한 달 내 전체 상담 여부: 최근 한 달간 VOC 발생 시 해지율 증가
 *    - 총 사용 일수: 총 사용 일수가 적을수록 해지율 증가
 *    - 상품 매체명: 고가 요금제 사용 시 해지율 증가 (예: UHD)
 *    - 약정 종류: 신규 및 약정 승계 시 해지율 증가
 * 
 * Props:
 * - month: 선택된 월 (데이터 조회 기준)
 */

/**
 * ChurnFactorsChart.tsx
 * 주요 해지 요인 차트 컴포넌트
 * 
 * 기능:
 * 1. 주요 해지 요인을 가로 막대 차트로 표시
 * 2. 각 요인별 영향도를 수치와 함께 표시
 * 3. 마우스 오버 시 요인별 상세 정보를 툴팁으로 제공
 * 4. 막대 차트에 호버 애니메이션 효과 적용
 * 
 * 데이터:
 * - API 엔드포인트: /risk-summary/churn-factors
 * - 표시 정보: 각 해지 요인의 영향도(중요도) 점수
 */

"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

// API 기본 URL 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://54.206.52.197:8000";

// 해지 요인 코드와 한글 설명 매핑
const featureTranslations: { [key: string]: string } = {
  "TV_I_CNT": "TV 사용 댓수",
  "AGMT_KIND_NM": "약정 종류",
  "MEDIA_NM_GRP": "상품 매체명",
  "PROD_NM_GRP": "상품명",
  "CH_HH_AVG_MONTH1": "1개월 평균 채널 시청시간",
  "BUNDLE_YN": "결합 상품 유무",
  "VOC_STOP_CANCEL_MONTH1_YN": "최근 한 달 내 해지 상담 여부",
  "VOC_TOTAL_MONTH1_YN": "최근 한 달 내 전체 상담 여부",
  "MONTHS_REMAINING": "약정 남은 개월 수",
  "STB_RES_1M_YN": "셋톱박스 휴면 유무",
  "CH_LAST_DAYS_BF_GRP": "최근 시청일",
  "INHOME_RATE": "집돌이 지수",
  "AGE_GRP10": "연령대",
  "AGMT_END_SEG": "약정 종료일"
};

// 커스텀 툴팁 컴포넌트: 해지 요인과 영향도를 보기 좋게 표시
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-200 shadow-md">
        <p className="font-bold mb-1">{label}</p>
        <p className="font-bold" style={{ color: '#A50034' }}>영향도: {payload[0].value.toLocaleString()}</p>
        {label === "결합 상품 유무" && (
          <p className="text-xs text-gray-600 mt-1">번들 사용 시 해지율 증가</p>
        )}
        {label === "상품명" && (
          <p className="text-xs text-gray-600 mt-1">고가 상품 사용 시 해지율 증가 (예: 프리미엄)</p>
        )}
        {label === "셋톱박스 휴면 유무" && (
          <p className="text-xs text-gray-600 mt-1">최근 한 달간 셋톱박스 미사용 시 해지율 증가</p>
        )}
        {label === "약정 남은 개월 수" && (
          <p className="text-xs text-gray-600 mt-1">약정 종료일이 가까울수록 해지율 증가</p>
        )}
        {label === "1개월 평균 채널 시청시간" && (
          <p className="text-xs text-gray-600 mt-1">월평균 채널 시청 시간이 적을수록 해지율 증가</p>
        )}
        {label === "최근 한 달 내 전체 상담 여부" && (
          <p className="text-xs text-gray-600 mt-1">최근 한 달간 VOC 발생 시 해지율 증가</p>
        )}
        {label === "총 사용 일수" && (
          <p className="text-xs text-gray-600 mt-1">총 사용 일수가 적을수록 해지율 증가</p>
        )}
        {label === "상품 매체명" && (
          <p className="text-xs text-gray-600 mt-1">고가 요금제 사용 시 해지율 증가 (예: UHD)</p>
        )}
        {label === "약정 종류" && (
          <p className="text-xs text-gray-600 mt-1">신규 및 약정 승계 시 해지율 증가</p>
        )}
      </div>
    );
  }
  return null;
};

export default function ChurnFactorsChart({ month }: { month: string }) {
  // 차트 데이터 상태 관리
  const [data, setData] = useState<{ factor: string; impact: number }[]>([]);

  // API에서 해지 요인 데이터 가져오기
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get(`${API_BASE_URL}/risk-summary/churn-factors`, {
          params: { month: parseInt(month.replace("월", "")) },
        });

        // 응답 데이터를 한글로 변환하고 차트에 맞게 가공
        const translatedData = response.data.map((item: { factor: string; impact: number }) => ({
          factor: featureTranslations[item.factor] || item.factor,
          impact: Math.round((item.impact / 100000) * 100) / 100, // 100,000으로 나누고 소수점 둘째자리까지 유지
        }));

        setData(translatedData);
      } catch (error) {
        console.error("주요 해지 요인 데이터 로드 실패:", error);
      }
    }
    fetchData();
  }, [month]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart 
        data={data} 
        layout="vertical"
        style={{
          '& .recharts-rectangle.recharts-bar-rectangle:hover': {
            transform: 'scale(1.05)',
            transition: 'transform 0.2s ease-in-out'
          }
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        {/* X축: 영향도 수치 표시 */}
        <XAxis 
          type="number" 
          tickFormatter={(value) => value.toLocaleString()} 
          axisLine={true}
          tickLine={true}
          stroke="#666"
        />
        {/* Y축: 해지 요인 이름 표시 */}
        <YAxis 
          dataKey="factor" 
          type="category" 
          width={120}
          axisLine={true}
          tickLine={true}
          stroke="#666"
        />
        {/* 커스텀 툴팁 설정 */}
        <Tooltip 
          cursor={{ fill: 'rgba(248, 248, 248, 0.75)' }}
          content={<CustomTooltip />}
        />
        {/* 막대 차트 설정 - 호버 시 애니메이션 효과 포함 */}
        <Bar 
          dataKey="impact" 
          fill="#A50034" 
          barSize={30}
          onMouseOver={(data, index) => {
            document.querySelector(`.recharts-bar-rectangle-${index}`)?.setAttribute('style', 'transform: scale(1.05); transition: transform 0.2s ease-in-out;');
          }}
          onMouseOut={(data, index) => {
            document.querySelector(`.recharts-bar-rectangle-${index}`)?.setAttribute('style', 'transform: scale(1); transition: transform 0.2s ease-in-out;');
          }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}