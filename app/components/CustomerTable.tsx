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

export default function CustomerTable() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState<Customer["customer_category"] | "이탈 위험도">("이탈 위험도");
  const [scrbPathFilter, setScrbPathFilter] = useState<string>("ALL");
  const [prodNmFilter, setProdNmFilter] = useState<string>("ALL");
  const [isFetching, setIsFetching] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const itemsPerPage = 20;
  const offsetRef = useRef(0);

  // 고객 데이터 불러오기
  const fetchCustomers = useCallback(async () => {
    if (isFetching || !hasMore) return;

    setIsFetching(true);
    try {
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

      if (response.data.length > 0) {
        setCustomers((prev) => [...prev, ...response.data]);
        offsetRef.current += itemsPerPage;
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("API 요청 오류:", error);
      toast.error("고객 데이터를 불러오는 데 실패했습니다.");
    }
    setIsFetching(false);
  }, [searchTerm, riskFilter, scrbPathFilter, prodNmFilter, isFetching, hasMore]);

  // 필터 변경 시 고객 데이터 초기화 후 새로 불러오기
  useEffect(() => {
    setCustomers([]);
    offsetRef.current = 0;
    setHasMore(true);
    fetchCustomers();
  }, [searchTerm, riskFilter, scrbPathFilter, prodNmFilter]);

  // 무한 스크롤 감지
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore) {
          fetchCustomers();
        }
      },
      { threshold: 1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [fetchCustomers, hasMore]);

  // SHA2 클립보드 복사 기능 (클립보드 복사와 HTTP 요청을 별도로 분리)
  const copyToClipboard = useCallback(async (event: React.MouseEvent, text: string) => {
    event.stopPropagation();

    try {
      // 클립보드에 텍스트 복사 시도
      await navigator.clipboard.writeText(text);
      toast.success("SHA2가 클립보드에 복사되었습니다.", { style: { whiteSpace: "nowrap" } });
    } catch (copyError) {
      console.error("클립보드 복사 실패:", copyError);
      toast.error("클립보드 복사에 실패했습니다.");
      return;
    }

    try {
      // HTTP 요청 실행 (예시: 복사 기록을 남기기 위한 POST 요청)
      await axios.post(`${API_BASE_URL}/clipboard`, { sha2: text });
    } catch (httpError) {
      console.error("HTTP 요청 실패:", httpError);
      // HTTP 요청 실패에 따른 별도 처리가 필요하면 여기서 처리합니다.
    }
  }, []);

  // 고객 클릭 시 모달 열기
  const handleRowClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
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