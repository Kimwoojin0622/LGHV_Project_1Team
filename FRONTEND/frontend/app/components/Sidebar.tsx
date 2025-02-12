/**
 * Sidebar.tsx
 * 웹사이트의 주요 네비게이션을 제공하는 사이드바 컴포넌트
 * 
 * 기능:
 * 1. 메인 네비게이션
 *    - 대시보드 (/): 전체 현황 보기
 *    - 고객 조회 (/customer-search): 고객 정보 검색
 *    - 위험군 분석 (/risk-analysis): 해지 위험 분석
 * 
 * 2. 인터랙션
 *    - 현재 페이지 하이라이트
 *    - 호버 시 스케일 및 그림자 효과
 *    - 아이콘 호버 시 확대 애니메이션
 * 
 * 3. 레이아웃
 *    - 고정 위치 (fixed)
 *    - 상단 헤더 아래부터 시작 (top-16)
 *    - 너비 256px (w-64)
 * 
 * 스타일:
 * - LG HelloVision 브랜드 컬러
 *   - 기본: #A50034 (진한 빨간색)
 *   - 호버: #8A002C (더 진한 빨간색)
 *   - 활성: 흰색 배경, #6B6B6B 텍스트
 * - Lucide 아이콘 사용
 * - 부드러운 전환 효과 (0.2초)
 * - z-index 40으로 다른 요소 위에 표시
 */

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, AlertTriangle } from "lucide-react"
import ExportPDFButton from "./ExportPDFButton"

interface MenuItem {
  name: string
  href: string
  icon: React.ElementType
}

const menuItems: MenuItem[] = [
  {
    name: "대시보드",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "고객 조회",
    href: "/customer-search",
    icon: Users,
  },
  {
    name: "위험군 분석",
    href: "/risk-analysis",
    icon: AlertTriangle,
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-[#A50034] fixed top-16 bottom-0 left-0 z-40">
      <nav className="h-full flex flex-col p-4">
        <ul className="space-y-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <li key={item.href}>
                <div className="group">
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out ${
                      pathname === item.href
                        ? "bg-white text-[#6B6B6B] font-bold shadow-md"
                        : "text-white hover:bg-[#8A002C] hover:scale-105 hover:shadow-md font-bold"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 transition-transform duration-200 ${
                        pathname === item.href ? "text-[#6B6B6B]" : "text-white group-hover:scale-110"
                      }`}
                    />
                    <span>{item.name}</span>
                  </Link>
                </div>
                {index === menuItems.length - 1 && (
                  <div className="mt-4">
                    <ExportPDFButton />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}