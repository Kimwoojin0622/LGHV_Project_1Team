/**
 * RecentChurnsTable.tsx
 * 최근 해지 위험이 높은 고객들의 정보를 테이블 형태로 표시하는 컴포넌트
 * 
 * 기능:
 * 1. 고객 데이터 표시
 *    - SHA2 해시로 암호화된 고객 식별자
 *    - 마지막 접속 일시
 *    - 해지 문의 여부 (배지로 시각화)
 *    - 해지 위험도 점수 (소수점 2자리)
 *    - 남은 계약 기간 (월 단위)
 * 
 * 2. 데이터 처리
 *    - 해지 위험도 기준 내림차순 정렬
 *    - 계약 만료일 기준 남은 개월 수 계산
 *    - 데이터 없음 상태 처리
 * 
 * Props:
 * - customers: 고객 데이터 배열 (Customer[])
 * - referenceDate: 기준 날짜 (남은 계약 기간 계산용)
 * 
 * 스타일:
 * - shadcn/ui Card, Table 컴포넌트 사용
 * - 해지 문의 여부에 따른 배지 색상 구분
 *   - Yes: destructive (빨간색)
 *   - No: default (회색)
 * - 반응형 테이블 레이아웃
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Customer {
  sha2_hash: string;
  last_access: string;
  churn_call: "Y" | "N";
  churn_risk: number;
  contract_expiration: string;
}

interface RecentChurnsTableProps {
  customers: Customer[];
  referenceDate: string;
}

export default function RecentChurnsTable({ customers, referenceDate }: RecentChurnsTableProps) {
  const [clientCustomers, setClientCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    if (Array.isArray(customers)) {
      const sorted = [...customers].sort((a, b) => b.churn_risk - a.churn_risk);
      setClientCustomers(sorted);
    } else {
      console.error("🚨 customers 데이터가 배열이 아닙니다:", customers);
      setClientCustomers([]);
    }
  }, [customers]);

  function calculateRemainingMonths(expirationDate: string): string {
    if (!expirationDate) return "0";
    const reference = new Date(referenceDate);
    const expiration = new Date(expirationDate);
    if (isNaN(expiration.getTime())) return "0"; // 날짜 형식이 올바르지 않으면 처리
    const diffTime = expiration.getTime() - reference.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24 * 30)).toString();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>최근 해지 위험 고객</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SHA2 Hash</TableHead>
              <TableHead>마지막 접속</TableHead>
              <TableHead>해지 문의 여부</TableHead>
              <TableHead>해지 위험도</TableHead>
              <TableHead>남은 계약 개월 수</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientCustomers.length > 0 ? (
              clientCustomers.map((customer, index) => (
                <TableRow key={index}>
                  <TableCell suppressHydrationWarning>{customer.sha2_hash}</TableCell>
                  <TableCell>{customer.last_access}</TableCell>
                  <TableCell>
                    <Badge variant={customer.churn_call === "Y" ? "destructive" : "default"}>
                      {customer.churn_call === "Y" ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell>{customer.churn_risk.toFixed(2)}</TableCell>
                  <TableCell>{calculateRemainingMonths(customer.contract_expiration)} 개월</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500">
                  데이터 없음
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
