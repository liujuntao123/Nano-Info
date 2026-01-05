import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/stores/useAppStore'

export function ImageCountInput() {
  const { splitCount, setSplitCount } = useAppStore()

  return (
    <div className="space-y-2">
      <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        生成数量
      </label>
      <Select value={String(splitCount)} onValueChange={(v) => setSplitCount(Number(v))}>
        <SelectTrigger className="w-full bg-muted/30 border-border/60 rounded-lg">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <SelectItem key={n} value={String(n)}>
              {n} 张
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
