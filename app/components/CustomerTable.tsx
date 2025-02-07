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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function CustomerTable() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState<Customer["customer_category"] | "이탈 위험도">("이탈 위험도");
  const [ageGroupFilter, setAgeGroupFilter] = useState<string>("ALL");
  const [isFetching, setIsFetching] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const itemsPerPage = 20;
  const offsetRef = useRef(0);

  // ✅ 고객 데이터 불러오기
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
          age_group: ageGroupFilter !== "ALL" ? ageGroupFilter : undefined,
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
  }, [searchTerm, riskFilter, ageGroupFilter, isFetching, hasMore]);

  useEffect(() => {
    setCustomers([]);
    offsetRef.current = 0;
    setHasMore(true);
    fetchCustomers();
  }, [searchTerm, riskFilter, ageGroupFilter]);

  // ✅ 무한 스크롤 감지
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

  // ✅ SHA2 클릭 시 클립보드 복사 기능
  const copyToClipboard = useCallback((event: React.MouseEvent, text: string) => {
    event.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      toast.success("SHA2가 클립보드에 복사되었습니다.", { style: { whiteSpace: "nowrap" } });
    }).catch(() => {
      toast.error("복사에 실패했습니다.");
    });
  }, []);

  // ✅ 고객 클릭 시 모달 열기
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
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="이탈 위험도 필터" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="이탈 위험도">이탈 위험도</SelectItem>
                <SelectItem value="매우 위험">매우 위험</SelectItem>
                <SelectItem value="위험">위험</SelectItem>
                <SelectItem value="주의">주의</SelectItem>
                <SelectItem value="양호">양호</SelectItem>
                <SelectItem value="안정">안정</SelectItem>
              </SelectContent>
            </Select>

            {/* 연령대 필터 */}
            <Select value={ageGroupFilter} onValueChange={(value) => setAgeGroupFilter(value)}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="연령대 필터" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">연령대</SelectItem>
                <SelectItem value="10대">10대</SelectItem>
                <SelectItem value="20대">20대</SelectItem>
                <SelectItem value="30대">30대</SelectItem>
                <SelectItem value="40대">40대</SelectItem>
                <SelectItem value="50대">50대</SelectItem>
                <SelectItem value="60대">60대</SelectItem>
                <SelectItem value="70대">70대</SelectItem>
                <SelectItem value="80대">80대</SelectItem>
                <SelectItem value="90대이상">90대이상</SelectItem>
                <SelectItem value="연령없음">연령없음</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SHA2</TableHead>
                <TableHead>연령대</TableHead>
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
                <TableRow key={customer.sha2_hash} onClick={() => handleRowClick(customer)} className="cursor-pointer hover:bg-gray-100">
                  <TableCell 
                    onClick={(e) => copyToClipboard(e, customer.sha2_hash)} 
                    className="cursor-pointer hover:underline"
                  >
                    {customer.sha2_hash.slice(0, 6)}...
                  </TableCell>
                  <TableCell>{customer.AGE_GRP10}</TableCell>
                  <TableCell>{customer.MEDIA_NM_GRP}</TableCell>
                  <TableCell>{customer.PROD_NM_GRP}</TableCell>
                  <TableCell>{customer.SCRB_PATH_NM_GRP}</TableCell>
                  <TableCell>{customer.AGMT_END_YMD}</TableCell>
                  <TableCell>{(customer.churn_probability * 100).toFixed(2)}%</TableCell>
                  <TableCell 
                    className="font-bold text-center"
                    style={{ color: getRiskColor(customer.customer_category) }} // ✅ 글자 색상만 변경
                  >
                    {customer.customer_category}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div ref={observerRef} className="h-4"></div>
        </div>
      </CardContent>
      <CustomerDetailModal customer={selectedCustomer} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </Card>
  );
}
