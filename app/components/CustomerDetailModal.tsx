"use client";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingDown, AlertTriangle, User, FileSignature, Calendar } from "lucide-react";
import { Customer, CustomerHistory, FeatureImportanceData, CustomerDetailModalProps } from "../types/customer";
import { getRiskColor } from "../utils/colors";

// API 호출을 위한 절대 경로
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://54.206.52.197/:8000";

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
            <span className="font-medium">상담 여부:</span> {customer.VOC_TOTAL_MONTH1_YN}
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
            <span className="font-medium">남은 개월 수:</span> {customer.MONTHS_REMAINING}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default CustomerProductSubscriptionContractCard;

export function CustomerDetailModal({ customer, isOpen, onClose }: CustomerDetailModalProps) {
  const [selectedMonth, setSelectedMonth] = useState("2");
  const [customerHistory, setCustomerHistory] = useState<CustomerHistory | null>(null);
  const [churnFactors, setChurnFactors] = useState<{ factor: string; impact: number }[]>([]);
  const [churnProbability, setChurnProbability] = useState(0);

  const fetchCustomerData = useCallback(async () => {
    if (!customer) return;
    try {
      // 상세 이력과 중요 피처 영향도 데이터를 병렬로 호출
      const [historyRes, featureRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/customers/${customer.sha2_hash}/detailed-history`, {
          params: { p_mt: parseInt(selectedMonth) },
        }),
        axios.get(`${API_BASE_URL}/customers/${customer.sha2_hash}/feature-importance`, {
          params: { p_mt: parseInt(selectedMonth) },
        }),
      ]);

      setCustomerHistory(historyRes.data);

      const featureData: FeatureImportanceData[] = featureRes.data;
      if (featureData.length > 0) {
        const record = featureData[0];
        // "feature_"로 시작하는 key들을 순회하여 각 피처의 영향도 및 한글명을 매핑
        setChurnFactors(
          Object.keys(record)
            .filter((key) => key.startsWith("feature_") && record[key])
            .map((key) => ({
              factor: featureTranslations[record[key]] || record[key],
              impact: (record[`impact_value_${key.split("_")[1]}`] || 0) * 100,
            }))
        );
        // 해지 확률 추출
        setChurnProbability((record.churn_probability || 0) * 100);
      }
    } catch (error) {
      console.error("데이터 불러오기 실패:", error);
    }
  }, [customer, selectedMonth]);

  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  if (!customer || !customerHistory) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#ED174D]">고객 상세 정보</DialogTitle>
          <div className="flex justify-end mt-4">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="월 선택" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => `${i + 1}`).map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}월
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DialogHeader>

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
                  style={{ width: `${churnProbability}%`, backgroundColor: getRiskColor(customer.customer_category) }}
                />
              </div>
              <span className="text-lg font-semibold" style={{ color: getRiskColor(customer.customer_category) }}>
                {churnProbability.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}