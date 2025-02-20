/**
 * layout.tsx
 * 전체 애플리케이션의 레이아웃을 정의하는 루트 컴포넌트
 * 
 * 기능:
 * 1. 레이아웃 구성
 *    - 헤더 (상단 고정)
 *    - 사이드바 (좌측 고정)
 *    - 메인 콘텐츠 영역
 *    - 푸터 (하단 고정)
 * 
 * 2. 메타데이터 설정
 *    - 페이지 제목: LG헬로비전 고객 해지 관리 대시보드
 *    - 설명: 고객 해지 현황 및 마케팅 대안 분석
 *    - 파비콘 및 앱 아이콘 설정
 * 
 * 3. 스타일 및 폰트
 *    - Roboto 폰트 적용 (300, 400, 500, 700 웨이트)
 *    - 반응형 레이아웃
 *    - 기본 배경색: gray-50
 *    - 기본 텍스트 색상: gray-900
 * 
 * 4. 레이아웃 구조
 *    - 최소 높이 100vh (min-h-screen)
 *    - 헤더 높이 64px (pt-16)
 *    - 사이드바 너비 256px (ml-64)
 *    - 메인 영역 패딩 32px (p-8)
 * 
 * Props:
 * - children: React.ReactNode (페이지 컴포넌트)
 */

import "./globals.css"
import Header from "./components/Header"
import Sidebar from "./components/Sidebar"
import Footer from "./components/Footer"
import { Roboto } from "next/font/google"

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
})

export const metadata = {
  title: "LG헬로비전 고객 해지 관리 대시보드",
  description: "고객 해지 현황 및 마케팅 대안 분석",
  icons: {
    icon: [
      {
        url: "/lg-hellovision-icon.svg",
        type: "image/svg+xml",
      },
    ],
    shortcut: ["/lg-hellovision-icon.svg"],
    apple: [
      {
        url: "/lg-hellovision-icon.svg",
        type: "image/svg+xml",
        sizes: "any",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={`${roboto.className} bg-gray-50 text-gray-900 flex flex-col min-h-screen`}>
        <Header />
        <div className="flex flex-1 pt-16">
          <Sidebar />
          <main className="flex-1 p-8 bg-gray-50 overflow-auto ml-64">
            <div id="main-content">
              {children}
            </div>
          </main>
        </div>
        <Footer />
      </body>
    </html>
  )
}