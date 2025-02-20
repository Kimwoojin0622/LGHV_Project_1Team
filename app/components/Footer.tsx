/**
 * Footer.tsx
 * 웹사이트의 하단 푸터를 표시하는 컴포넌트
 * 
 * 기능:
 * 1. 저작권 정보 표시 (현재 연도 자동 업데이트)
 * 2. LG HelloVision 관련 링크 제공
 *    - 개인정보처리방침
 *    - 이용약관
 *    - 고객센터
 * 3. 회사 정보 표시
 *    - 대표이사명
 *    - 회사 주소
 *    - 사업자 등록번호
 *    - 통신판매업 신고번호
 *    - 개인정보보호책임자
 * 
 * 스타일:
 * - 반응형 디자인 (모바일/데스크톱)
 * - LG HelloVision 브랜드 컬러 (#ED174D) 사용
 * - 호버 효과 적용된 네비게이션 링크
 */

import type { FC } from "react"

const Footer: FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-4 mt-8 relative z-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <div className="text-sm text-gray-500">
              {new Date().getFullYear()} LG HelloVision. All rights reserved. by C.P. ⭐
            </div>
            <nav className="flex space-x-4">
              <a href="https://www.lghellovision.net/etcService/privateAdditionPromise.do" 
                className="text-sm text-gray-500 hover:text-[#ED174D]" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                개인정보처리방침
              </a>
              <a href="https://www.lghellovision.net/etcService/additionPromise.do" 
                className="text-sm text-gray-500 hover:text-[#ED174D]" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                이용약관
              </a>
              <a href="https://corp.lghellovision.net/footer/customerService.do" 
                className="text-sm text-gray-500 hover:text-[#ED174D]" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                고객센터
              </a>
            </nav>
          </div>
          <div className="text-sm text-gray-400 text-center whitespace-normal break-words px-4">
            대표이사 : 송구영 | 서울특별시 마포구 월드컵북로 56길 19 상암디지털드림타워 | 사업자등록번호 : 117-81-13423 | 통신판매업 신고번호 : 2017-서울마포구-0254 | 개인정보보호책임자 : 문영식
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer