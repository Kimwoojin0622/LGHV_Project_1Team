"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingDown,
  AlertTriangle,
  User,
  FileSignature,
  Calendar,
  Loader2,
} from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { createPortal } from "react-dom";
import {
  Customer,
  CustomerHistory,
  FeatureImportanceData,
  CustomerDetailModalProps,
} from "../types/customer";

// API 기본 URL (환경 변수 우선, 없으면 하드코딩)
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://54.206.52.197:8000";

// featureTranslations (두 코드에서 사용된 모든 key를 포함)
const featureTranslations: { [key: string]: string } = {
  TV_I_CNT: "TV 사용 댓수",
  AGMT_KIND_NM: "약정 종류",
  MEDIA_NM_GRP: "상품 매체명",
  PROD_NM_GRP: "상품명",
  CH_HH_AVG_MONTH1: "1개월 평균 채널 시청시간",
  BUNDLE_YN: "결합 상품 유무",
  VOC_STOP_CANCEL_MONTH1_YN: "최근 한 달 내 해지 상담 여부",
  VOC_TOTAL_MONTH1_YN: "최근 한 달 내 전체 상담 여부",
  MONTHS_REMAINING: "약정 남은 개월 수",
  STB_RES_1M_YN: "셋톱박스 휴면 유무",
  CH_LAST_DAYS_BF_GRP: "최근 시청일",
  INHOME_RATE: "집돌이 지수",
  AGE_GRP10: "연령대",
  AGMT_END_SEG: "약정 종료일",
  TOTAL_USED_DAYS: "총 사용 일수",
  SCRB_PATH_NM_GRP: "유치경로",
};

// 위험도별 색상 및 설명 관련 함수
const getRiskLevelColor = (category: string) => {
  const colorMap: { [key: string]: string } = {
    "매우위험": "#ED174D",
    "위험": "#ff8042",
    "주의": "#FFBB28",
    "양호": "#82ca9d",
    "안정": "#2563eb",
  };
  return colorMap[category] || "#ED174D";
};

const getRiskLevelFromProbability = (probability: number): string => {
  if (probability >= 80) return "매우위험";
  if (probability >= 60) return "위험";
  if (probability >= 40) return "주의";
  if (probability > 25) return "양호";
  return "안정";
};

const riskLevelDescriptions: { [key: string]: string } = {
  "매우위험": "즉각적인 고객 관리가 필요합니다.",
  "위험": "적극적인 고객 관리가 필요합니다.",
  "주의": "주의 깊은 모니터링이 필요합니다.",
  "양호": "정기적인 모니터링이 필요합니다.",
  "안정": "안정적인 고객 상태입니다.",
};

/**
 * 고객 상품 가입 계약 정보 카드 컴포넌트
 */
function CustomerProductSubscriptionContractCard({
  customer,
  mainCustomer,
}: {
  customer: CustomerHistory;
  mainCustomer: Customer;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* 고객 정보 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-[#ED174D] mb-2">
            <User className="w-5 h-5" />
            <span className="font-semibold">고객 정보</span>
          </div>
          <p className="text-sm mb-3">
            <span className="font-medium">연령대:</span> {mainCustomer.AGE_GRP10}
          </p>
          <p className="text-sm mb-3">
            <span className="font-medium">상품명:</span> {mainCustomer.PROD_NM_GRP}
          </p>
          <p className="text-sm">
          <span className="font-medium">결합 상품 유무:</span> {customer.BUNDLE_YN}
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
          <p className="text-sm mb-3">
            <span className="font-medium">총 사용 일수:</span> {customer.TOTAL_USED_DAYS}
          </p>
          <p className="text-sm mb-3">
            <span className="font-medium">최근 시청일:</span> {customer.CH_LAST_DAYS_BF_GRP}
          </p>
          <p className="text-sm">
            <span className="font-medium">한 달 평균 시청 시간:</span> {customer.CH_HH_AVG_MONTH1}
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
          <p className="text-sm mb-3">
            <span className="font-medium">상담 여부:</span> {customer.VOC_TOTAL_MONTH1_YN}
          </p>
          <p className="text-sm">
            <span className="font-medium">해지 상담 여부:</span> {customer.VOC_STOP_CANCEL_MONTH1_YN}
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
          <p className="text-sm mb-3">
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

// ──────────────────────────────────────────────────────────────
// 마케팅 전략 관련 타입 선언
// ──────────────────────────────────────────────────────────────

interface StrategySolution {
  title: string;
  subtitle?: string;
  details: string[];
}

interface StrategyGroup {
  factors: string[];
  strategy: string;
  solutions: StrategySolution[];
}

const MARKETING_STRATEGIES: Record<string, StrategyGroup> = {
  viewing: {
    factors: ["최근 시청일", "셋톱박스 휴면 유무", "1개월 평균 채널 시청시간"],
    strategy: "최근 시청 관련 마케팅 전략",
    solutions: [
      {
        title: "1. 최근 시청 이력 부족 고객",
        subtitle: "최근 시청 이력이 없을수록 해지 가능성 증가",
        details: [
          "(1) 무료 VOD 체험 & 사용자 선호",
          "인기 드라마, 예능, 영화 중 첫 화(또는 일부 에피소드) 무료 시청권 제공",
          "채널별 하이라이트 영상을 앱 푸시/문자로 안내해 '재시청'을 유도",
          "사용자가 선호하는 채널 및 VOD에 대한 맞춤형 큐레이션 메시지 발송",
          "",
          "(2) 이벤트 / 챌린지",
          "일정 기간 내 n회 이상 시청 시, 포인트/쿠폰 지급 등 '시청 미션' 부여",
          "시청 인증 이벤트로 사용자 참여율 높임",
          "시청만 해도 월 요금 할부 할인 등 즉각적 보상정책 병행",
        ],
      },
      {
        title: "2. 셋탑박스 휴면 고객",
        subtitle: "최근 한 달간 셋탑박스 미사용 시 해지 가능성 증가",
        details: [
          "(1) '휴면 깨기' 프로모션",
          "셋탑박스 전원만 켜도 즉시 보상이 주어지는 이벤트",
          "1개월 요금 할인, 특정 채널 무료 시청, VOD 쿠폰 등",
          "기가·리모컨 문제 시 신속 수리·교체로 만족도 향상",
          "",
          "(2) OTT 결합 및 무료 체험",
          "LG헬로비전의 OTT 연동(예: 유튜브, 넷플릭스 등)을 한시적 무료 체험 (HD → UHD 전환 등)",
          "셋탑박스를 통해 OTT를 간편하게 시청 가능하다는 점 홍보",
        ],
      },
      {
        title: "3. 낮은 월평균 시청시간 고객",
        subtitle: "월평균 채널 시청 시간이 적을수록 해지 가능성 증가",
        details: [
          "(1) 관심사 기반 채널·상품 재구성",
          "취향 조사 결과를 바탕으로 고객이 선호하는 프로그램 위주의 채널 패키지 추천",
          "시청량 적은 고객에게 저가 상품, 1화 무료권 등 부담 완화 정책 제공",
          "",
          "(2) 다양한 할인 혜택",
          "특정 콘텐츠 무료 시청권 제공",
          "이른 가능성이 큰 고객을 위한 맞춤 할인 VOD 쿠폰 등 프로모션 진행",
        ],
      },
    ],
  },
  contract: {
    factors: ["약정 남은 개월 수", "총 사용 일수", "약정 종료일", "약정 종류"],
    strategy: "약정 및 사용 일수 관련 마케팅 전략",
    solutions: [
      {
        title: "1. 남은 개월 수가 적은 고객",
        subtitle: "약정 만료가 가까울수록 해지 가능성 증가",
        details: [
          "(1) 재약정(재계약) 유도",
          "만료 1~2개월 전부터 안내 (요금 할인, 번들 옵션 등 신규 제안)",
          "단기 연장 프로모션(1년 추가 시 특별 혜택 등)",
        ],
      },
      {
        title: "2. 장기 이용 고객",
        subtitle: "충성도 높은 고객 → 우대정책으로 이탈을 최소화",
        details: [
          "(1) Loyalty Program(누적 사용 등급, 혜택 확대)",
          "예) '5년차 이상 전용 프리미엄 채널', '매년 VOD 쿠폰'",
          "번들 할인 확대, 셋탑 기기 무상 업그레이드 등 혜택 제공",
        ],
      },
      {
        title: "3. 신규·단기 이용 고객",
        subtitle:
          "초기 적응기 실패 → 해지 가능성 증가 / 신규 & 약정승계일수록 해지 가능성 증가",
        details: [
          "(1) 집중 케어 & 웰컴 패키지",
          "가입 후 첫 3개월 할인, 사용 가이드, 맞춤형 채널 추천",
          "VOC 모니터링으로 즉각 문제 해결",
          "",
          "(2) 초기 만족도 관리",
          "웰컴 프로모션(가입 초기 할인, 무료 채널 체험 등)",
          "조기 VOC 모니터링으로 불만을 즉각 해소",
        ],
      },
      {
        title: "4. 약정 종료 구간",
        subtitle: "약정 만료 전후 1개월이 해지 위험이 가장 높은 구간",
        details: [
          "(1) 만료 1개월 전 관리",
          "사전 안내(문자·이메일·전화)로 재약정 혜택 강조",
          "위약금 부담 고객에겐 부분 면제, 번들 할인, VOD 쿠폰 등 차별적 제공",
          "",
          "(2) 만료 직후 관리",
          "해지 VOC가 급증하는 시점 → 전담 상담팀 운영",
          "재약정·단기 연장 옵션으로 이탈 방지",
        ],
      },
      {
        title: "5. 약정 종류",
        subtitle: "신규 & 약정승계 고객일수록 해지 가능성 상승",
        details: [
          "(1) 초기 만족도 관리",
          "웰컴 프로모션(가입 초기 할인, 무료 채널 체험 등)",
          "조기 VOC 모니터링으로 불만을 즉각 해소",
        ],
      },
    ],
  },
  voc: {
    factors: ["최근 한 달 내 전체 상담 여부", "최근 한 달 내 해지 상담 여부"],
    strategy: "상담 VOC 관련 마케팅 전략",
    solutions: [
      {
        title: "1. 해지 VOC 인입 고객",
        subtitle: "해지 관련 상담 고객일수록 해지 위험 증가",
        details: [
          "(1) 즉각 대응 체계",
          "해지 문의 발생 시, 리텐션 전담 상담팀으로 바로 연결",
          "고객 불만을 빠르게 해결하고, 추가 인센티브(요금 할인, 1개월 무료 월정액 등) 제공",
          "",
          "(2) Win-back / Retention Offers",
          "한시적 요금 할인, 유료 채널 무료 시청 1~3개월, OTT(넷플릭스 등) 구독권 등",
          "해지 전 고객이 '유지 시 이익'을 충분히 느낄 수 있도록 유도",
        ],
      },
      {
        title: "2. 일반 VOC 인입 고객",
        subtitle: "단순 불만·기술 문제 등으로 인한 상담 고객",
        details: [
          "(1) 해지 가능성 사전 차단",
          "'채널·VOD·셋탑' 문제를 제때 해결 못 했던 해지로 이어질 수 있음",
          "VOC 접수 후, 원격지원이나 기사 방문 등을 통해 문제 신속 조치",
          "처리 결과를 문자·이메일로 피드백하여, 추가 불만이 없도록 마무리",
        ],
      },
    ],
  },
  product: {
    factors: ["상품 매체명", "상품명", "결합 상품 유무"],
    strategy: "상품 관련 마케팅 전략",
    solutions: [
      {
        title: "1. 결합 상품(번들) 가입 고객",
        subtitle: "번들 가입 고객에서 해지 가능성 증가",
        details: [
          "(1) 번들 상품 혜택 강조",
          "단일 상품 대비 구독료 절감, 추가 할인 등 가시적 이점 부각",
          "예) \"TV+인터넷+OTT 결합 시 월 ○○원 할인\"",
          "",
          "(2) 번들 유지 인센티브",
          "장기 번들 사용자 대상 특별 프로모션, 멤버십 포인트 제공",
          "번들 이탈(부분 해지) 시 놓치는 혜택(할인·무료 채널 등) 강조",
        ],
      },
      {
        title: "2. 고가 상품 가입 고객",
        subtitle: "고가 상품을 사용할수록 해지 가능성 증가",
        details: [
          "(1) 가치 인식 제고",
          "프리미엄 채널, 고화질 VOD, 전담 상담 등 차별화된 혜택 홍보",
          "월 비용이 높더라도 \"그만큼의 가치가 있다\"는 메시지 전달",
          "",
          "(2) 다운그레이드 옵션 제안",
          "해지 대신 '한 단계 낮은 상품'으로 전환 가능하도록 유연성 부여",
          "중간 가격대 상품을 통해 핵심 기능 유지, 비용 부담 완화",
          "",
          "(3) 고가 상품 이용 고객 전담 케어",
          "VOC 우선 처리, VIP 이벤트, 맞춤형 혜택 제공",
          "가격 부담이나 불만 발생 시 즉각 해결책(할인, 보상 등)으로 이탈 방지",
        ],
      },
    ],
  },
};

// hover 가능한 요인 목록 (모든 그룹의 요인들을 합침)
const HOVERABLE_FACTORS = [
  ...MARKETING_STRATEGIES.viewing.factors,
  ...MARKETING_STRATEGIES.contract.factors,
  ...MARKETING_STRATEGIES.voc.factors,
  ...MARKETING_STRATEGIES.product.factors,
];

/**
 * 고객 상세 정보 모달 컴포넌트
 *
 * 기능:
 * 1. 선택된 고객의 상세 정보를 모달로 표시
 * 2. 고객 기본 정보 (예: 이름, 연령 등) 및 상품 정보 표시
 * 3. 해지 위험도 및 마케팅 전략(해지 요인별)을 함께 표시
 * 4. 모달 외부 클릭 시 자동 닫힘
 *
 * 사용:
 * - CustomerTable에서 고객 행 클릭 시 표시
 * - isOpen, onClose props로 모달 상태 제어
 * - customer prop으로 표시할 고객 데이터 전달
 */
export function CustomerDetailModal({
  customer,
  isOpen,
  onClose,
}: CustomerDetailModalProps) {
  const [selectedMonth, setSelectedMonth] = useState("12");
  const [customerHistory, setCustomerHistory] = useState<CustomerHistory | null>(
    null
  );
  const [churnFactors, setChurnFactors] = useState<{ factor: string; impact: number }[]>(
    []
  );
  const [churnProbability, setChurnProbability] = useState(0);
  const [availableMonths, setAvailableMonths] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 마케팅 전략 관련 상태
  const [selectedFactor, setSelectedFactor] = useState<string | null>(null);
  const [showStrategyModal, setShowStrategyModal] = useState(false);

  // 모달이 열릴 때마다 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setCustomerHistory(null);
      setChurnFactors([]);
      setChurnProbability(0);
      setAvailableMonths([]);
      setSelectedMonth("12");
      setSelectedFactor(null);
      setShowStrategyModal(false);
    }
  }, [isOpen]);

  // 고객 데이터 및 사용 가능한 월 확인 (모달 오픈 또는 고객 변경 시)
  useEffect(() => {
    if (!customer || !isOpen) return;
    const loadData = async () => {
      try {
        setIsLoading(true);
        await checkAvailableMonths();
      } catch (error) {
        console.error("데이터 로딩 실패:", error);
      }
    };
    loadData();
  }, [customer, isOpen]);

  // 사용 가능한 월 데이터 확인 및 선택된 월 데이터 로딩
  const checkAvailableMonths = useCallback(async () => {
    if (!customer) return;
    try {
      const monthPromises = Array.from({ length: 11 }, (_, i) => i + 2).map(
        async (month) => {
          try {
            const response = await axios.get(
              `${API_BASE_URL}/customers/${customer.sha2_hash}/detailed-history`,
              { params: { p_mt: month } }
            );
            return response.data ? month : null;
          } catch {
            return null;
          }
        }
      );

      const results = await Promise.all(monthPromises);
      const validMonths = results.filter(
        (month): month is number => month !== null
      ).sort((a, b) => a - b);
      setAvailableMonths(validMonths);

      if (validMonths.length > 0) {
        const maxMonth = Math.max(...validMonths);
        setSelectedMonth(String(maxMonth));

        const [historyRes, featureRes] = await Promise.all([
          axios.get(
            `${API_BASE_URL}/customers/${customer.sha2_hash}/detailed-history`,
            { params: { p_mt: maxMonth } }
          ),
          axios.get(
            `${API_BASE_URL}/customers/${customer.sha2_hash}/feature-importance`,
            { params: { p_mt: maxMonth } }
          ),
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

  // 선택된 월 변경 시 데이터 업데이트
  const fetchCustomerData = useCallback(async () => {
    if (!customer) return;
    try {
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
    }
  }, [customer, selectedMonth]);

  useEffect(() => {
    if (!customer || !isOpen) return;
    fetchCustomerData();
  }, [selectedMonth, customer, isOpen, fetchCustomerData]);

  // 마케팅 전략 상세 정보를 보여주는 모달 (createPortal 사용)
  const StrategyModal = () => {
    if (!selectedFactor) return null;
    const strategyGroup = getStrategyForFactor(selectedFactor);
    if (!strategyGroup) return null;

    return createPortal(
      <Dialog open={showStrategyModal} onOpenChange={setShowStrategyModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{strategyGroup.strategy}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {strategyGroup.solutions.map(
              (solution: StrategySolution, sIndex: number) => (
                <div key={sIndex} className="space-y-2">
                  <h4 className="text-md font-semibold text-[#A50034]">
                    {solution.title}
                  </h4>
                  {solution.subtitle && (
                    <p className="text-sm text-gray-600 font-bold">
                      {solution.subtitle}
                    </p>
                  )}
                  <div className="space-y-2">
                    {solution.details.map((detail: string, dIndex: number) => {
                      const isTitle =
                        detail.startsWith("(1)") || detail.startsWith("(2)") || detail.startsWith("(3)");
                      const isEmpty = detail === "";
                      return (
                        <p
                          key={dIndex}
                          className={`text-sm text-gray-600 ${!isTitle && !isEmpty ? "ml-8" : "ml-4"
                            }`}
                        >
                          {detail}
                        </p>
                      );
                    })}
                  </div>
                </div>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>,
      document.body
    );
  };

  // 주어진 요인에 해당하는 마케팅 전략 그룹 반환 함수
  const getStrategyForFactor = (factor: string): StrategyGroup | null => {
    for (const groupKey in MARKETING_STRATEGIES) {
      const group = MARKETING_STRATEGIES[groupKey];
      if (group.factors.includes(factor)) {
        return group;
      }
    }
    return null;
  };

  // 해지 요인 항목 렌더링 (hover 시 미리보기 제공)
  const FactorItem = ({
    factor,
    impact,
  }: {
    factor: string;
    impact: number;
  }) => {
    const isHoverable = HOVERABLE_FACTORS.includes(factor);
    const strategyGroup = getStrategyForFactor(factor);

    if (isHoverable && strategyGroup) {
      return (
        <HoverCard>
          <HoverCardTrigger asChild>
            <div
              className="flex justify-between w-full cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
              onClick={() => {
                setSelectedFactor(factor);
                setShowStrategyModal(true);
              }}
            >
              <span className="text-sm">{factor}</span>
              <span className="text-sm font-medium">{impact.toFixed(1)}%</span>
            </div>
          </HoverCardTrigger>
          <HoverCardContent className="p-2">
            <p className="text-sm font-semibold text-[#A50034]">
              {strategyGroup.strategy}
            </p>
            <p className="text-xs text-gray-500">자세히 보려면 클릭하세요</p>
          </HoverCardContent>
        </HoverCard>
      );
    } else {
      return (
        <div className="flex justify-between w-full px-2 py-1">
          <span className="text-sm">{factor}</span>
          <span className="text-sm font-medium">{impact.toFixed(1)}%</span>
        </div>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-bold text-[#ED174D]">
              고객 상세 정보
            </DialogTitle>
            {!isLoading && availableMonths.length > 0 && (
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="월 선택" />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.map((month: number) => (
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
            {/* 고객 프로필 카드 */}
            <div
              className="mt-4 p-4 border-2 rounded-lg"
              style={{ borderColor: "rgb(165, 0, 52)" }}
            >
              <div className="flex items-start space-x-4">
                {/* 프로필 이미지 */}
                <div className="w-12 h-12 bg-[#ED174D] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {customer?.sha2_hash?.charAt(0) || "U"}
                </div>
                {/* 고객 정보 */}
                <div className="flex-1">
                  <div className="space-y-3">
                    <div className="text-gray-900 font-medium text-lg">
                      SHA2: {customer?.sha2_hash || "N/A"}
                    </div>
                    <div className="text-gray-600">
                      {customer?.AGE_GRP10 || "N/A"}
                    </div>
                    <Badge
                      style={{
                        backgroundColor: getRiskLevelColor(
                          getRiskLevelFromProbability(churnProbability)
                        ),
                      }}
                      className="text-white text-sm font-bold"
                    >
                      이탈 위험도: {getRiskLevelFromProbability(churnProbability)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* 고객 상세 정보 카드 */}
            {customerHistory && (
              <CustomerProductSubscriptionContractCard
                customer={customerHistory}
                mainCustomer={customer!}
              />
            )}

            {/* 주요 해지 요인 출력 */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 text-[#ED174D] mb-4">
                  <TrendingDown className="w-5 h-5" />
                  <span className="font-semibold text-lg">주요 해지 요인</span>
                </div>
                <ul className="space-y-2">
                  {churnFactors.map((factor, index) => {
                    const isHoverable = HOVERABLE_FACTORS.includes(factor.factor);
                    const strategy = getStrategyForFactor(factor.factor);
                    
                    return (
                      <li key={index} className="flex justify-between group">
                        {isHoverable ? (
                          <div className="flex justify-between w-full cursor-pointer hover:bg-gray-100 px-2 py-1.5 rounded relative group"
                            onClick={() => {
                              setSelectedFactor(factor.factor);
                              setShowStrategyModal(true);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-sm">{factor.factor}</span>
                              <span className="opacity-0 group-hover:opacity-100 text-xs bg-[#ADD8E6] text-gray-800 px-2 py-0.5 rounded-full transition-all duration-200 font-bold">
                                관련 마케팅 대안 보기
                              </span>
                            </div>
                            <span className="text-sm font-medium">{factor.impact.toFixed(1)}%</span>
                          </div>
                        ) : (
                          <div className="flex justify-between w-full px-2 py-1">
                            <span className="text-sm">{factor.factor}</span>
                            <span className="text-sm font-medium">{factor.impact.toFixed(1)}%</span>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>

            {/* 해지 확률 막대 그래프 및 위험도 설명 */}
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
                      style={{
                        width: `${churnProbability}%`,
                        backgroundColor: getRiskLevelColor(
                          getRiskLevelFromProbability(churnProbability)
                        ),
                      }}
                    />
                  </div>
                  <span
                    className="text-lg font-semibold"
                    style={{
                      color: getRiskLevelColor(
                        getRiskLevelFromProbability(churnProbability)
                      ),
                    }}
                  >
                    {churnProbability.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  {riskLevelDescriptions[getRiskLevelFromProbability(churnProbability)]}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </DialogContent>
      {/* 전략 모달 (createPortal로 렌더링) */}
      <StrategyModal />
    </Dialog>
  );
}
