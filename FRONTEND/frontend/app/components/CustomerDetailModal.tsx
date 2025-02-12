/**
 * CustomerDetailModal.tsx
 * 고객 상세 정보 모달 컴포넌트
 * 
 * 기능:
 * 1. 선택된 고객의 상세 정보를 모달로 표시
 * 2. 고객 기본 정보 (이름, 나이, 성별 등) 표시
 * 3. 상품 정보 (상품명, 가격, 약정 등) 표시
 * 4. 해지 위험도 정보 표시
 * 5. 모달 외부 클릭 시 자동 닫힘
 * 
 * 사용:
 * - CustomerTable에서 고객 행 클릭 시 표시
 * - isOpen과 onClose props로 모달 상태 제어
 * - customerData prop으로 표시할 고객 데이터 전달
 */

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingDown, AlertTriangle, User, FileSignature, Calendar, Loader2 } from "lucide-react";
import { Customer, CustomerHistory, FeatureImportanceData, CustomerDetailModalProps } from "../types/customer";
import { getRiskColor } from "../utils/colors";

/**
 * 고객 데이터 인터페이스 정의
 */
interface CustomerData {
  name: string           // 고객 이름
  age: number           // 고객 나이
  gender: string        // 고객 성별
  address: string       // 고객 주소
  productName: string   // 상품명
  productPrice: number  // 상품 가격
  agreementPeriod: string // 약정 기간
  riskScore: number     // 해지 위험도 점수
}

/**
 * 모달 컴포넌트 props 타입 정의
 */
interface CustomerDetailModalProps {
  isOpen: boolean           // 모달 표시 여부
  onClose: () => void       // 모달 닫기 핸들러
  customer: Customer        // 표시할 고객 데이터
}

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

/**
 * 고객 상품 가입 계약 정보 카드 컴포넌트
 */
function CustomerProductSubscriptionContractCard({ customer, mainCustomer }: { customer: CustomerHistory; mainCustomer: Customer }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* 고객 정보 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-[#ED174D] mb-2">
            <User className="w-5 h-5" />
            <span className="font-semibold">고객 정보</span>
          </div>
          <p className="text-sm">
            <span className="font-medium">연령대:</span> {mainCustomer.AGE_GRP10}
          </p>
          <p className="text-sm">
            <span className="font-medium">상품명:</span> {mainCustomer.PROD_NM_GRP}
          </p>
        </CardContent>
      </Card>

      {/* 사용 정보 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-[#ED174D] mb-2">
            <User className="w-5 h-5" />
            <span className="font-semibold">사용 정보</span>
          </div>
          <p className="text-sm">
            <span className="font-medium">총 사용 일수:</span> {customer.TOTAL_USED_DAYS}
          </p>
          <p className="text-sm">
            <span className="font-medium">최근 시청일:</span> {customer.CH_LAST_DAYS_BF_GRP}
          </p>
        </CardContent>
      </Card>

      {/* 상담 정보 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-[#ED174D] mb-2">
            <FileSignature className="w-5 h-5" />
            <span className="font-semibold">상담 정보</span>
          </div>
          <p className="text-sm">
            <span className="font-medium">상담 여부 : </span> {customer.VOC_TOTAL_MONTH1_YN}
          </p>
        </CardContent>
      </Card>

      {/* 약정 정보 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-[#ED174D] mb-2">
            <Calendar className="w-5 h-5" />
            <span className="font-semibold">약정 정보</span>
          </div>
          <p className="text-sm">
            <span className="font-medium">약정 종료일:</span> {mainCustomer.AGMT_END_YMD}
          </p>
          <p className="text-sm">
            <span className="font-medium">남은 개월 수 : </span> {customer.MONTHS_REMAINING}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 위험도별 색상 반환 함수
 */
const getRiskLevelColor = (category: string) => {
  const colorMap: { [key: string]: string } = {
    "매우위험": "#ED174D",
    "위험": "#ff8042",
    "주의": "#FFBB28",
    "양호": "#82ca9d",
    "안정": "#2563eb"
  };
  return colorMap[category] || "#ED174D";
};

/**
 * 위험도별 설명 반환 함수
 */
const getRiskLevelFromProbability = (probability: number): string => {
  if (probability >= 80) return "매우위험";
  if (probability >= 60) return "위험";
  if (probability >= 40) return "주의";
  if (probability > 25) return "양호";
  return "안정";
};

/**
 * 고객 상세 정보 모달 컴포넌트
 */
export function CustomerDetailModal({ customer, isOpen, onClose }: CustomerDetailModalProps) {
  // 선택된 월과 고객 이력 상태 관리
  const [selectedMonth, setSelectedMonth] = useState("12");
  const [customerHistory, setCustomerHistory] = useState<CustomerHistory | null>(null);
  const [churnFactors, setChurnFactors] = useState<{ factor: string; impact: number }[]>([]);
  const [churnProbability, setChurnProbability] = useState(0);
  const [availableMonths, setAvailableMonths] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 모달이 열릴 때마다 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setCustomerHistory(null);
      setChurnFactors([]);
      setChurnProbability(0);
      setAvailableMonths([]);
      setSelectedMonth("12");
    }
  }, [isOpen]);

  // 고객 데이터가 변경될 때마다 데이터 로딩
  useEffect(() => {
    if (!customer || !isOpen) return;
    
    const loadData = async () => {
      try {
        setIsLoading(true);
        await checkAvailableMonths();
      } catch (error) {
        console.error("데이터 로딩 실패:", error);
        // toast.error("데이터를 불러오는데 실패했습니다.");
      }
    };

    loadData();
  }, [customer, isOpen]);

  // 사용 가능한 월 데이터 확인
  const checkAvailableMonths = useCallback(async () => {
    if (!customer) return;
    
    try {
      // 모든 월(2~12)에 대해 병렬로 API 호출
      const monthPromises = Array.from({ length: 11 }, (_, i) => i + 2).map(async (month) => {
        try {
          const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/${customer.sha2_hash}/detailed-history`, {
            params: { p_mt: month },
          });
          return response.data ? month : null;
        } catch {
          return null;
        }
      });

      // 모든 응답을 기다림
      const results = await Promise.all(monthPromises);
      
      // null이 아닌 월만 필터링하고 정렬
      const validMonths = results.filter((month): month is number => month !== null).sort((a, b) => a - b);
      setAvailableMonths(validMonths);
      
      // 유효한 월이 있다면 그 중 가장 최근 월을 선택
      if (validMonths.length > 0) {
        const maxMonth = Math.max(...validMonths);
        setSelectedMonth(String(maxMonth));
        
        // 선택된 월의 데이터 로딩
        const [historyRes, featureRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/${customer.sha2_hash}/detailed-history`, {
            params: { p_mt: maxMonth },
          }),
          axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/${customer.sha2_hash}/feature-importance`, {
            params: { p_mt: maxMonth },
          }),
        ]);

        setCustomerHistory(historyRes.data);

        const featureData: FeatureImportanceData[] = featureRes.data;
        if (featureData.length > 0) {
          const record = featureData[0];
          setChurnFactors(
            Object.keys(record)
              .filter((key) => key.startsWith("feature_") && record[key])
              .map((key) => ({
                factor: featureTranslations[record[key]] || record[key],
                impact: (record[`impact_value_${key.split("_")[1]}`] || 0) * 100,
              }))
          );
          setChurnProbability((record.churn_probability || 0) * 100);
        }
      }
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [customer]);

  // 월 선택 변경 시 데이터 업데이트
  useEffect(() => {
    if (!customer || !isOpen) return;
    fetchCustomerData();
  }, [selectedMonth, customer, isOpen]);

  const fetchCustomerData = useCallback(async () => {
    if (!customer) return;
    try {
      const [historyRes, featureRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/${customer.sha2_hash}/detailed-history`, {
          params: { p_mt: parseInt(selectedMonth) },
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/${customer.sha2_hash}/feature-importance`, {
          params: { p_mt: parseInt(selectedMonth) },
        }),
      ]);

      setCustomerHistory(historyRes.data);

      const featureData: FeatureImportanceData[] = featureRes.data;
      if (featureData.length > 0) {
        const record = featureData[0];
        setChurnFactors(
          Object.keys(record)
            .filter((key) => key.startsWith("feature_") && record[key])
            .map((key) => ({
              factor: featureTranslations[record[key]] || record[key],
              impact: (record[`impact_value_${key.split("_")[1]}`] || 0) * 100,
            }))
        );
        setChurnProbability((record.churn_probability || 0) * 100);
      }
    } catch (error) {
      console.error("고객 데이터 조회 실패:", error);
      // toast.error("데이터를 불러오는데 실패했습니다.");
    }
  }, [customer, selectedMonth]);

  // 위험도별 설명 객체 추가
  const riskLevelDescriptions: { [key: string]: string } = {
    "매우위험": "즉각적인 고객 관리가 필요합니다.",
    "위험": "적극적인 고객 관리가 필요합니다.",
    "주의": "주의 깊은 모니터링이 필요합니다.",
    "양호": "정기적인 모니터링이 필요합니다.",
    "안정": "안정적인 고객 상태입니다."
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-bold text-[#ED174D]">고객 상세 정보</DialogTitle>
            {!isLoading && (
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="월 선택" />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.map((month) => (
                    <SelectItem key={month} value={String(month)}>
                      {month}월
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#ED174D]" />
            <p className="text-gray-500">데이터를 불러오고 있습니다...</p>
          </div>
        ) : (
          <>
            {/* 프로필 카드 */}
            <div className="mt-4 p-4 border-2 rounded-lg" style={{ borderColor: 'rgb(165, 0, 52)' }}>
              <div className="flex items-start space-x-4">
                {/* 프로필 이미지 */}
                <div className="w-12 h-12 bg-[#ED174D] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {customer?.sha2_hash?.charAt(0) || 'U'}
                </div>
                
                {/* 고객 정보 */}
                <div className="flex-1">
                  <div className="space-y-3">
                    <div className="text-gray-900 font-medium text-lg">SHA2: {customer?.sha2_hash || 'N/A'}</div>
                    <div className="text-gray-600">{customer?.AGE_GRP10 || 'N/A'}</div>
                    <div>
                      <span 
                        className="px-3 py-1 text-white rounded-full text-sm font-bold"
                        style={{ backgroundColor: getRiskLevelColor(getRiskLevelFromProbability(churnProbability)) }}
                      >
                        이탈 위험도: {getRiskLevelFromProbability(churnProbability)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 고객 상세 정보 카드 */}
            <CustomerProductSubscriptionContractCard customer={customerHistory} mainCustomer={customer} />

            {/* 주요 해지 요인 출력 */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 text-[#ED174D] mb-4">
                  <TrendingDown className="w-5 h-5" />
                  <span className="font-semibold text-lg">주요 해지 요인</span>
                </div>
                <ul className="space-y-2">
                  {churnFactors.map((factor, index) => (
                    <li key={index} className="flex justify-between">
                      <span className="text-sm">{factor.factor}</span>
                      <span className="text-sm font-medium">{factor.impact.toFixed(1)}%</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* 해지 확률 막대 그래프 */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 text-[#ED174D] mb-4">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-semibold text-lg">해지 확률</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-full h-4 bg-gray-100 rounded-full relative">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${churnProbability}%`, backgroundColor: getRiskLevelColor(getRiskLevelFromProbability(churnProbability)) }}
                    />
                  </div>
                  <span className="text-lg font-semibold" style={{ color: getRiskLevelColor(getRiskLevelFromProbability(churnProbability)) }}>
                    {churnProbability.toFixed(1)}%
                  </span>
                </div>
                {/* 현재 위험도에 대한 설명 */}
                <div className="mt-4 text-sm text-gray-600">
                  {riskLevelDescriptions[getRiskLevelFromProbability(churnProbability)]}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
