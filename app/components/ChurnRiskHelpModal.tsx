import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ChurnRiskHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ChurnRiskHelpModal({ isOpen, onClose }: ChurnRiskHelpModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>고객 해지 위험 예측 차트</DialogTitle>
        </DialogHeader>
        <p>
          이 차트는 고객의 해지 가능성을 모델이 예측한 값을 기반으로 분류한 결과를 시각화한 것입니다. 해지 가능성
          점수(0~1)를 기준으로 위험도를 다섯 단계(안정, 보통, 주의, 위험, 매우 위험)로 나누었습니다. 0.8 이상의 점수는
          '매우 위험'으로 간주하며, 즉각적인 조치가 필요합니다.
        </p>
      </DialogContent>
    </Dialog>
  )
}

