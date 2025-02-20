/**
 * HelpModal.tsx
 * 월별 해지율 차트에 대한 도움말 모달 컴포넌트
 * 
 * 기능:
 * 1. 해지율 차트 설명
 *    - 차트의 목적과 의미
 *    - 해지율 계산 방식 설명
 * 2. 주요 기능 안내
 *    - 그래프 유형 전환 기능
 *    - 데이터 확인 방법
 *    - 추세 분석 방법
 * 
 * Props:
 * - isOpen: 모달 표시 여부
 * - onClose: 모달 닫기 함수
 * 
 * 스타일:
 * - 최대 너비 425px (sm:max-w-[425px])
 * - 계층적 정보 구조 (제목 > 설명 > 기능 목록 > 공식)
 * - 불릿 포인트로 구분된 기능 목록
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>월별 해지율 차트</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>
            이 차트는 월별 고객 해지율을 시각화하여 보여줍니다. 해지율은 전체 고객 수 대비 해지 고객 수의 비율로 계산됩니다.
          </p>
          <div className="space-y-2">
            <p className="font-medium">주요 기능:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>선 그래프/막대 그래프 전환 가능</li>
              <li>각 월의 정확한 해지율 확인 가능</li>
              <li>월별 추세 분석 용이</li>
            </ul>
          </div>
          <p className="text-sm text-gray-500">
            * 해지율(%) = (해지 고객 수 / 전체 고객 수) × 100
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}