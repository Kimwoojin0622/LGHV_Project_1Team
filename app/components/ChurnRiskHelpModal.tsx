/**
 * ChurnRiskHelpModal.tsx
 * 고객 해지 위험 예측 도움말 모달 컴포넌트
 * 
 * 기능:
 * 1. 해지 위험 예측 차트에 대한 설명을 모달로 표시
 * 2. 위험도 분류 기준 (5단계) 설명
 * 3. 위험도별 색상 코드 표시
 * 4. 활용 방법 안내
 * 
 * 사용:
 * - 해지 위험 예측 차트 화면에서 도움말 버튼 클릭 시 표시
 * - isOpen과 onClose props로 모달 상태 제어
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// 모달 컴포넌트의 props 타입 정의
interface ChurnRiskHelpModalProps {
  isOpen: boolean      // 모달 표시 여부
  onClose: () => void  // 모달 닫기 핸들러
}

export default function ChurnRiskHelpModal({ isOpen, onClose }: ChurnRiskHelpModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>고객 해지 위험 예측 차트</DialogTitle>
        </DialogHeader>
        {/* 차트 설명 섹션 */}
        <div className="space-y-4">
          <p>
            이 차트는 AI 모델이 예측한 고객의 해지 가능성을 시각화한 것입니다.
          </p>
          
          {/* 위험도 분류 기준 섹션 */}
          <div className="space-y-2">
            <p className="font-medium">위험도 분류 기준:</p>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {/* 매우 위험 단계 */}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF0000]"></div>
                <span>매우 위험: 0.8 이상</span>
              </div>
              {/* 위험 단계 */}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FFA500]"></div>
                <span>위험: 0.6 이상 ~ 0.8 미만</span>
              </div>
              {/* 주의 단계 */}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FFFF00]"></div>
                <span>주의: 0.4 이상 ~ 0.6 미만</span>
              </div>
              {/* 양호 단계 */}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#90EE90]"></div>
                <span>양호: 0.25 초과 ~ 0.4 미만</span>
              </div>
              {/* 안정 단계 */}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#0066FF]"></div>
                <span>안정: 0.25 이하</span>
              </div>
            </div>
          </div>

          {/* 활용 방법 섹션 */}
          <div className="space-y-2">
            <p className="font-medium">활용 방법:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>매우 위 고객군에 대한 즉각적인 관리 필요</li>
              <li>위험/주의 고객군에 대한 주기적인 모니터링</li>
            </ul>
          </div>

          {/* 부가 설명 */}
          <p className="text-sm text-gray-500">
            * 위험도 점수는 0~1 사이의 값으로, 1에 가까울수록 해지 위험이 높음을 의미합니다.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}