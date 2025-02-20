/**
 * CustomerTable.tsx
 * 고객 목록 테이블 컴포넌트
 * 
 * 기능:
 * 1. 고객 데이터를 테이블 형식으로 표시
 * 2. 페이지네이션 지원
 * 3. 정렬 기능 지원 (이름, 나이, 위험도 등)
 * 4. 검색 및 필터링 기능
 * 5. 고객 상세 정보 모달 연동
 * 6. 위험도에 따른 색상 표시
 * 
 * 데이터 표시:
 * - 고객 기본 정보 (이름, 나이, 성별)
 * - 상품 정보 (상품명, 가격)
 * - 위험도 정보 (점수 및 등급)
 * 
 * 사용:
 * - 메인 대시보드에서 고객 목록 표시
 * - 행 클릭 시 상세 정보 모달 표시
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "react-hot-toast";
import { toast } from "react-hot-toast";
import { CustomerDetailModal } from "./CustomerDetailModal";
import type { Customer } from "../types/customer";
import { getRiskColor } from "../utils/colors";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://54.206.52.197:8000";

/**
 * 고객 목록 테이블 컴포넌트
 * 
 * @returns 고객 목록 테이블 컴포넌트
 */
export default function CustomerTable() {
  // 고객 데이터 상태 관리
  const [customers, setCustomers] = useState<Customer[]>([]);
  // 검색어 상태 관리
  const [searchTerm, setSearchTerm] = useState("");
  // 이탈 위험도 필터 상태 관리
  const [riskFilter, setRiskFilter] = useState<Customer["customer_category"] | "이탈 위험도">("이탈 위험도");
  // 가입 경로 필터 상태 관리
  const [scrbPathFilter, setScrbPathFilter] = useState<string>("ALL");
  // 상품 필터 상태 관리
  const [prodNmFilter, setProdNmFilter] = useState<string>("ALL");
  // 데이터 로딩 상태 관리
  const [isFetching, setIsFetching] = useState(false);
  // 더 많은 데이터가 있는지 여부 상태 관리
  const [hasMore, setHasMore] = useState(true);
  // 선택된 고객 데이터 상태 관리
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  // 고객 상세 정보 모달 열림 여부 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 무한 스크롤 감지용 참조
  const observerRef = useRef<HTMLDivElement | null>(null);
  // 한 페이지당 표시할 데이터 개수
  const itemsPerPage = 20;
  // 데이터 오프셋 참조
  const offsetRef = useRef(0);

  /**
   * 고객 데이터를 가져오는 함수
   * 
   * @returns 고객 데이터 가져오기 함수
   */
  const fetchCustomers = useCallback(async () => {
    // 데이터 로딩 중이거나 더 이상 데이터가 없으면 함수 종료
    if (isFetching || !hasMore) return;

    // 데이터 로딩 상태 설정
    setIsFetching(true);
    try {
      // 고객 데이터 가져오기 API 호출
      const response = await axios.get(`${API_BASE_URL}/customers/summary`, {
        params: {
          offset: offsetRef.current,
          limit: itemsPerPage,
          search: searchTerm.trim() !== "" ? searchTerm : undefined,
          customer_category: riskFilter !== "이탈 위험도" ? riskFilter : undefined,
          scrb_path: scrbPathFilter !== "ALL" ? scrbPathFilter : undefined,
          prod_nm: prodNmFilter !== "ALL" ? prodNmFilter : undefined,
        },
      });

      // 가져온 데이터가 있는 경우
      if (response.data.length > 0) {
        // 고객 데이터 상태 업데이트
        setCustomers((prev) => [...prev, ...response.data]);
        // 오프셋 업데이트
        offsetRef.current += itemsPerPage;
      } else {
        // 더 이상 데이터가 없을 경우
        setHasMore(false);
      }
    } catch (error) {
      // 에러 발생 시 로그 출력 및 토스트 표시
      console.error("API 요청 오류:", error);
      toast.error("고객 데이터를 불러오는 데 실패했습니다.");
    }
    // 데이터 로딩 상태 해제
    setIsFetching(false);
  }, [searchTerm, riskFilter, scrbPathFilter, prodNmFilter, isFetching, hasMore]);

  /**
   * 필터 변경 시 고객 데이터 초기화 후 새로 불러오기
   * 
   * @returns 필터 변경 시 고객 데이터 초기화 후 새로 불러오기 함수
   */
  useEffect(() => {
    // 고객 데이터 초기화
    setCustomers([]);
    // 오프셋 초기화
    offsetRef.current = 0;
    // 더 많은 데이터가 있는지 여부 초기화
    setHasMore(true);
    // 고객 데이터 가져오기
    fetchCustomers();
  }, [searchTerm, riskFilter, scrbPathFilter, prodNmFilter]);

  /**
   * 무한 스크롤 감지
   * 
   * @returns 무한 스크롤 감지 함수
   */
  useEffect(() => {
    // 무한 스크롤 감지용 인터섹션 옵저버 생성
    const observer = new IntersectionObserver(
      ([entry]) => {
        // 감지 영역이 화면에 들어왔을 경우
        if (entry.isIntersecting && hasMore) {
          // 고객 데이터 가져오기
          fetchCustomers();
        }
      },
      { threshold: 1 }
    );

    // 옵저버 참조가 있는 경우
    if (observerRef.current) {
      // 옵저버 등록
      observer.observe(observerRef.current);
    }

    // 컴포넌트 언마운트 시 옵저버 해제
    return () => {
      // 옵저버 참조가 있는 경우
      if (observerRef.current) {
        // 옵저버 해제
        observer.unobserve(observerRef.current);
      }
    };
  }, [fetchCustomers, hasMore]);

  // 클립보드 복사 기능 최적화
  const copyToClipboard = useCallback(async (event: React.MouseEvent, text: string) => {
    event.stopPropagation();

    try {
      // Clipboard API 사용 가능 여부 확인
      if (navigator && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(text);
      } else {
        // Clipboard API 지원하지 않을 경우 fallback 방식 적용
        const textArea = document.createElement("textarea");
        textArea.value = text;
        // 화면에 보이지 않도록 설정
        textArea.style.position = "fixed";
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (!successful) {
          throw new Error("Fallback: 복사 명령이 실패했습니다.");
        }
      }
      toast.success("SHA2가 클립보드에 복사되었습니다.", { style: { whiteSpace: "nowrap" } });
    } catch (copyError) {
      console.error("클립보드 복사 실패:", copyError);
      toast.error("클립보드 복사에 실패했습니다.");
      return;
    }

    try {
      // 복사 기록을 남기기 위한 HTTP 요청 (필요에 따라 사용)
      await axios.post(`${API_BASE_URL}/clipboard`, { sha2: text });
    } catch (httpError) {
      console.error("HTTP 요청 실패:", httpError);
    }
  }, []);

  /**
   * 고객 클릭 시 모달 열기
   * 
   * @param customer 클릭한 고객 데이터
   * @returns 고객 클릭 시 모달 열기 함수
   */
  const handleRowClick = (customer: Customer) => {
    // 선택된 고객 데이터 초기화
    setSelectedCustomer(null);
    // 고객 상세 정보 모달 열기
    setIsModalOpen(true);
    // 약간의 지연 후 고객 데이터 설정
    setTimeout(() => {
      setSelectedCustomer(customer);
    }, 100);
  };

  return (
    <Card className="border-[#ED174D] border-2">
      <CardHeader>
        <CardTitle>고객 목록</CardTitle>
      </CardHeader>
      <CardContent>
        <Toaster />
        <div className="space-y-4">
          <div className="flex space-x-4">
            {/* 검색 입력 필드 */}
            <Input
              type="text"
              placeholder="고객 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />

            {/* 이탈 위험도 필터 */}
            <Select value={riskFilter} onValueChange={(value) => setRiskFilter(value as Customer["customer_category"] | "이탈 위험도")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="이탈 위험도 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="이탈 위험도">이탈 위험도</SelectItem>
                <SelectItem value="매우 위험">매우 위험</SelectItem>
                <SelectItem value="위험">위험</SelectItem>
                <SelectItem value="주의">주의</SelectItem>
                <SelectItem value="양호">양호</SelectItem>
                <SelectItem value="안정">안정</SelectItem>
              </SelectContent>
            </Select>

            {/* 상품 필터 */}
            <Select value={prodNmFilter} onValueChange={(value) => setProdNmFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="상품 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">상품</SelectItem>
                <SelectItem value="이코노미">이코노미</SelectItem>
                <SelectItem value="프리미엄">프리미엄</SelectItem>
                <SelectItem value="베이직">베이직</SelectItem>
                <SelectItem value="스탠다드">스탠다드</SelectItem>
                <SelectItem value="세이버">세이버</SelectItem>
                <SelectItem value="기타">기타</SelectItem>
              </SelectContent>
            </Select>

            {/* 가입 경로 필터 */}
            <Select value={scrbPathFilter} onValueChange={(value) => setScrbPathFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="가입 경로 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">가입 경로</SelectItem>
                <SelectItem value="I/B">I/B</SelectItem>
                <SelectItem value="일반상담">일반상담</SelectItem>
                <SelectItem value="현장경로">현장경로</SelectItem>
                <SelectItem value="O/B">O/B</SelectItem>
                <SelectItem value="기타">기타</SelectItem>
                <SelectItem value="임직원">임직원</SelectItem>
                <SelectItem value="직영몰">직영몰</SelectItem>
                <SelectItem value="정보없음">정보없음</SelectItem>
                <SelectItem value="전략채널">전략채널</SelectItem>
                <SelectItem value="렌탈제휴">렌탈제휴</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SHA2</TableHead>
                <TableHead>미디어 그룹</TableHead>
                <TableHead>상품</TableHead>
                <TableHead>가입 경로</TableHead>
                <TableHead>계약 종료일</TableHead>
                <TableHead>해지 확률</TableHead>
                <TableHead>이탈 위험도</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow
                  key={customer.sha2_hash}
                  onClick={() => handleRowClick(customer)}
                  className="cursor-pointer hover:bg-gray-100"
                >
                  {/* SHA2 셀에 클립보드 복사 기능 추가 */}
                  <TableCell
                    onClick={(e) => copyToClipboard(e, customer.sha2_hash)}
                    className="cursor-pointer hover:underline"
                  >
                    {customer.sha2_hash.slice(0, 6)}...
                  </TableCell>
                  <TableCell>{customer.MEDIA_NM_GRP}</TableCell>
                  <TableCell>{customer.PROD_NM_GRP}</TableCell>
                  <TableCell>{customer.SCRB_PATH_NM_GRP}</TableCell>
                  <TableCell>{customer.AGMT_END_YMD}</TableCell>
                  <TableCell>{(customer.churn_probability * 100).toFixed(2)}%</TableCell>
                  {/* 이탈 위험도에 getRiskColor()로 동적 색상 적용 */}
                  <TableCell
                    className="font-bold text-center"
                    style={{ color: getRiskColor(customer.customer_category) }}
                  >
                    {customer.customer_category}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {/* 무한 스크롤을 위한 감시 요소 */}
          <div ref={observerRef} className="h-4"></div>
        </div>
      </CardContent>
      <CustomerDetailModal
        customer={selectedCustomer}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </Card>
  );
}