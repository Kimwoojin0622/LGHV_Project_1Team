/**
 * ImportantFeaturesChart.tsx
 * 고객 해지에 영향을 미치는 주요 요인들을 시각화하는 차트 컴포넌트
 * 
 * 주요 기능:
 * 1. 해지 영향 요인 데이터 표시
 *    - API에서 데이터 가져오기 (/api/churn_reasons)
 *    - 상위 9개 요인만 표시
 *    - 영향도에 따른 내림차순 정렬
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
 * - selectedMonth: 선택된 월 (데이터 조회 기준)
 */

"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

// 주요 해지 요인 한글 매핑
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
  "AGMT_END_SEG": "약정 종료일",
  "TOTAL_USED_DAYS": "총 사용 일수",
  "SCRB_PATH_NM_GRP": "유치경로"
};

interface ChurnImpact {
  reason: string;
  percentage: number;
}

export default function ImportantFeaturesChart({ selectedMonth }: { selectedMonth: number }) {
  const [data, setData] = useState<ChurnImpact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChurnReasons = async () => {
      try {
        const response = await axios.get(`http://54.206.52.197:8000/api/churn_reasons?p_mt=${selectedMonth}`);

        console.log("📊 Fetched Churn Impact Data:", response.data);

        // 데이터 변환 및 정렬
        const sortedData = response.data
          .map((item: any) => ({
            reason: featureTranslations[item.reason] || item.reason, // 한글 변환 적용
            percentage: Math.round((Number(item.percentage) * 100) * 100) / 100, // 소수점 둘째자리까지 유지
          }))
          .sort((a: ChurnImpact, b: ChurnImpact) => b.percentage - a.percentage)
          .slice(0, 9);

        setData(sortedData);
      } catch (error) {
        console.error("🚨 주요 해지 요인 데이터를 가져오는데 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChurnReasons();
  }, [selectedMonth]);

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="text-[#53565A]">주요 해지 영향 요인</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center text-gray-600">데이터 불러오는 중...</div>
        ) : data.length === 0 ? (
          <div className="text-center text-gray-600">데이터가 없습니다.</div>
        ) : (
          <div style={{ width: "100%", height: 420 }}>
            <ResponsiveContainer>
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 5, right: 50, left: 50, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  domain={[0, "dataMax"]} 
                  tickCount={6}
                />
                <YAxis 
                  dataKey="reason" 
                  type="category" 
                  width={120}
                  tickFormatter={(value) => {
                    if (value.length > 15) {
                      const midPoint = Math.floor(value.length / 2);
                      const breakPoint = value.lastIndexOf(' ', midPoint);
                      if (breakPoint !== -1) {
                        return value.slice(0, breakPoint) + '\n' + value.slice(breakPoint + 1);
                      }
                    }
                    return value;
                  }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(248, 248, 248, 0.75)' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
                          <p className="font-medium">{label}</p>
                          <p className="text-sm font-bold" style={{ color: '#A50034' }}>
                            영향도: {payload?.[0]?.value !== undefined ? payload[0].value.toLocaleString() : 'N/A'}
                          </p>
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
                  }}
                />
                <Bar dataKey="percentage" fill="#A50034" barSize={40}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`rgba(165, 0, 52, ${1 - index * (0.7 / data.length)})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
