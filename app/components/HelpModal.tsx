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
        <p>이 그래프는 월별 해지율을 나타내는 차트입니다.</p>
      </DialogContent>
    </Dialog>
  )
}

