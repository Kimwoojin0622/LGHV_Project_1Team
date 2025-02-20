/**
 * Header.tsx
 * 웹사이트의 상단 헤더를 표시하는 컴포넌트
 * 
 * 기능:
 * 1. LG HelloVision 로고 표시 및 홈페이지 링크
 *    - SVG 이미지 사용으로 고품질 로고 유지
 *    - priority 속성으로 빠른 로딩 구현
 * 2. 현재 날짜/시간 표시 (DateTimeDisplay 컴포넌트 통합)
 * 
 * 스타일:
 * - 고정 위치 (fixed) 헤더로 항상 상단에 표시
 * - 높이 64px (h-16)
 * - 흰색 배경과 하단 테두리
 * - 반응형 패딩 적용 (px-6)
 * - z-index 50으로 다른 요소들 위에 표시
 */

import Image from "next/image"
import Link from "next/link"
import DateTimeDisplay from "./DateTimeDisplay"

export default function Header() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="h-full px-6 flex items-center justify-between">
        <Link href="/">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LG_HELLOVISON-C5xQgqHUbxf9TYQIFAKR295d8QeFOl.svg"
            alt="LG헬로비전 로고"
            width={150}
            height={22}
            priority
          />
        </Link>
        <DateTimeDisplay />
      </div>
    </header>
  )
}