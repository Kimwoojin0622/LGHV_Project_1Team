"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

// 더미 데이터
const riskFactors = [
  { factor: "계약 만료 임박", score: 0.8 },
  { factor: "최근 불만 접수", score: 0.7 },
  { factor: "서비스 이용 감소", score: 0.6 },
  { factor: "경쟁사 프로모션 참여", score: 0.5 },
  { factor: "요금제 변경 요청", score: 0.4 },
]

const highRiskCustomers = [
  { id: 1, name: "고객A", riskScore: 0.9, lastContact: "2023-06-15", nextAction: "긴급 연락" },
  { id: 2, name: "고객B", riskScore: 0.85, lastContact: "2023-06-10", nextAction: "특별 할인 제안" },
  { id: 3, name: "고객C", riskScore: 0.8, lastContact: "2023-06-05", nextAction: "서비스 개선 안내" },
  { id: 4, name: "고객D", riskScore: 0.75, lastContact: "2023-06-01", nextAction: "만족도 조사" },
  { id: 5, name: "고객E", riskScore: 0.7, lastContact: "2023-05-28", nextAction: "업그레이드 제안" },
]

export default function RiskAnalysis() {
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#53565A]">위험군 분석</h1>
      <Card>
        <CardHeader>
          <CardTitle>위험군 분석 페이지</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg text-center">여기는 위험군 분석을 나타낼 페이지입니다.</p>
        </CardContent>
      </Card>

      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>주요 위험 요인</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={riskFactors}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="factor" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="score" fill="#A50034" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>고위험 고객 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>고객명</TableHead>
                  <TableHead>위험 점수</TableHead>
                  <TableHead>최근 접촉일</TableHead>
                  <TableHead>다음 조치</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {highRiskCustomers.map((customer) => (
                  <TableRow key={customer.id} onClick={() => setSelectedCustomer(customer)} className="cursor-pointer">
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>{customer.riskScore.toFixed(2)}</TableCell>
                    <TableCell>{customer.lastContact}</TableCell>
                    <TableCell>{customer.nextAction}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {selectedCustomer && (
        <Card>
          <CardHeader>
            <CardTitle>고객 상세 정보: {selectedCustomer.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>위험 점수: {selectedCustomer.riskScore.toFixed(2)}</p>
            <p>최근 접촉일: {selectedCustomer.lastContact}</p>
            <p>다음 조치: {selectedCustomer.nextAction}</p>
            <Button className="mt-4" onClick={() => alert("고객 관리 작업 시작")}>
              고객 관리 시작
            </Button>
          </CardContent>
        </Card>
      )} */}
    </div>
  )
}

