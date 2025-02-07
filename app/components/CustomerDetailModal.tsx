import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingDown, AlertTriangle, User, FileSignature, Calendar } from "lucide-react";
import { Customer, CustomerHistory, FeatureImportanceData, CustomerDetailModalProps } from "../types/customer";
import { getRiskColor } from "../utils/colors";

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
          <p className="text-sm"><span className="font-medium">연령대:</span> {mainCustomer.AGE_GRP10}</p>
          <p className="text-sm"><span className="font-medium">상품명:</span> {mainCustomer.PROD_NM_GRP}</p>
        </CardContent>
      </Card>

      {/* 사용 정보 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-[#ED174D] mb-2">
            <User className="w-5 h-5" />
            <span className="font-semibold">사용 정보</span>
          </div>
          <p className="text-sm"><span className="font-medium">총 사용 일수:</span> {customer.TOTAL_USED_DAYS}</p>
          <p className="text-sm"><span className="font-medium">최근 시청일:</span> {customer.CH_LAST_DAYS_BF_GRP}</p>
        </CardContent>
      </Card>

      {/* 상담 정보 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-[#ED174D] mb-2">
            <FileSignature className="w-5 h-5" />
            <span className="font-semibold">상담 정보</span>
          </div>
          <p className="text-sm"><span className="font-medium">상담 여부:</span> {customer.VOC_TOTAL_MONTH1_YN}</p>
        </CardContent>
      </Card>

      {/* 약정 정보 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-[#ED174D] mb-2">
            <Calendar className="w-5 h-5" />
            <span className="font-semibold">약정 정보</span>
          </div>
          <p className="text-sm"><span className="font-medium">약정 종료일:</span> {mainCustomer.AGMT_END_YMD}</p>
          <p className="text-sm"><span className="font-medium">남은 개월 수:</span> {customer.MONTHS_REMAINING}</p>
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
        const factors = Object.keys(record)
          .filter((key) => key.startsWith("feature_") && record[key])
          .map((key) => ({
            factor: record[key],
            impact: (record[`impact_value_${key.split("_")[1]}`] || 0) * 100,
          }));
        setChurnFactors(factors);
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
      {/* 월별 필터를 고객 상세 정보 아래쪽으로 이동 */}
  <div className="flex justify-end mt-4">
    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
      <SelectTrigger className="w-[120px]">
        <SelectValue placeholder="월 선택" />
      </SelectTrigger>
      <SelectContent>
        {Array.from({ length: 12 }, (_, i) => `${i + 1}`).filter((month) => month !=="1").map((month) => (
          <SelectItem key={month} value={month}>
            {month}월
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
  </DialogHeader>

  <Card>
    <CardContent className="p-6 flex justify-between items-start">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-[#ED174D] text-white text-2xl flex items-center justify-center rounded-full">
          {customer.sha2_hash.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <p className="text-lg font-semibold">SHA2: {customer.sha2_hash}</p>
          <Badge style={{ backgroundColor: getRiskColor(customer.customer_category) }}>
            이탈 위험도: {customer.customer_category}
          </Badge>
        </div>
      </div>
    </CardContent>
  </Card>

  {/* 고객 상세 정보 카드 */}
  <CustomerProductSubscriptionContractCard customer={customerHistory} mainCustomer={customer} />

  {/* 주요 해지 요인 */}
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

  {/* 해지 확률 */}
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center space-x-2 text-[#ED174D] mb-4">
        <AlertTriangle className="w-5 h-5" />
        <span className="font-semibold text-lg">해지 확률</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-full h-4 bg-gray-100 rounded-full relative">
          <div className="h-full rounded-full transition-all duration-500" 
               style={{ width: `${churnProbability}%`, backgroundColor: getRiskColor(customer.customer_category) }} />
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
