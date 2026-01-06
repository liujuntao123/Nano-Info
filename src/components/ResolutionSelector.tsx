import { useAppStore } from '@/stores/useAppStore'
import type { Resolution } from '@/types'
import { cn } from '@/lib/utils'

const resolutions: { value: Resolution; label: string }[] = [
  { value: '1K', label: '1K' },
  { value: '2K', label: '2K' },
  { value: '4K', label: '4K' },
]

export function ResolutionSelector() {
  const { resolution, setResolution } = useAppStore()

  return (
    <div className="space-y-2">
      <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        输出分辨率
      </label>
      <div className="flex gap-2">
        {resolutions.map((res) => (
          <button
            key={res.value}
            onClick={() => setResolution(res.value)}
            className={cn(
              'flex-1 py-1.5 rounded-md text-xs font-medium transition-all',
              resolution === res.value
                ? 'border border-primary text-primary bg-primary/5'
                : 'border border-border/60 text-muted-foreground hover:bg-muted/50'
            )}
          >
            {res.label}
          </button>
        ))}
      </div>
    </div>
  )
}
