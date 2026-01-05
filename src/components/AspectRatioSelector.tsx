import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/stores/useAppStore'
import type { AspectRatio } from '@/types'

const aspectRatios: { value: AspectRatio; label: string }[] = [
  { value: '16:9', label: '16:9 宽屏' },
  { value: '9:16', label: '9:16 竖版' },
  { value: '1:1', label: '1:1 方形' },
  { value: '4:3', label: '4:3 标准' },
  { value: '3:4', label: '3:4 竖版' },
]

export function AspectRatioSelector() {
  const { aspectRatio, setAspectRatio } = useAppStore()

  return (
    <div className="space-y-2">
      <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        图像比例
      </label>
      <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v as AspectRatio)}>
        <SelectTrigger className="w-full bg-muted/30 border-border/60 rounded-lg">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {aspectRatios.map((ratio) => (
            <SelectItem key={ratio.value} value={ratio.value}>
              {ratio.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
