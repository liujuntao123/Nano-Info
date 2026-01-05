import { useRef } from 'react'
import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { visualStyles } from '@/data/visualStyles'
import { useAppStore } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'
import { HelpCircle, Check, ZoomIn } from 'lucide-react'

export function StyleSelector() {
  const { selectedStyleId, setSelectedStyleId, useStyleReference, setUseStyleReference } = useAppStore()
  const zoomRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-foreground">选择视觉风格</label>
        <div className="flex items-center gap-2">
          <Checkbox
            id="useStyleReference"
            checked={useStyleReference}
            onCheckedChange={setUseStyleReference}
            className="h-3.5 w-3.5 border-border/60 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <label htmlFor="useStyleReference" className="text-[11px] cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
            应用参考图
          </label>
          <Tooltip content="应用参考图将使图片风格更加稳定和统一">
            <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help hover:text-muted-foreground transition-colors" />
          </Tooltip>
        </div>
      </div>

      {/* 固定高度滚动区域 */}
      <div className="h-64 md:h-[380px] overflow-y-auto overflow-x-hidden">
        <div className="grid grid-cols-2 gap-3">
          {visualStyles.map((style) => (
            <div
              key={style.id}
              className={cn(
                'relative cursor-pointer group rounded-xl overflow-hidden transition-all',
                selectedStyleId === style.id
                  ? 'ring-2 ring-primary ring-offset-1'
                  : 'border-2 border-transparent hover:border-primary/30'
              )}
              onClick={() => setSelectedStyleId(style.id)}
            >
              {/* 图片 - 始终用 Zoom 包裹 */}
              <Zoom>
                <img
                  ref={(el) => {
                    if (el) {
                      const btn = el.closest('[data-rmiz]')?.querySelector('button') as HTMLButtonElement | null
                      if (btn) zoomRefs.current[style.id] = btn
                    }
                  }}
                  src={style.preview}
                  alt={style.name}
                  className="w-full h-24 md:h-28 object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </Zoom>

              {/* 渐变遮罩 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

              {/* 底部信息：名称和tags */}
              <div className="absolute bottom-0 left-0 right-0 px-2 pb-1.5 pt-6">
                <span className="text-[10px] text-white font-medium">{style.name}</span>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {style.tag.split(',').slice(0, 2).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-[8px] px-1 py-0 h-3.5 bg-white/15 text-white/90 border-none"
                    >
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 右上角按钮区域 */}
              {selectedStyleId === style.id && (
                <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      // 直接触发 Zoom 组件内部的按钮点击
                      const zoomBtn = zoomRefs.current[style.id]
                      if (zoomBtn) zoomBtn.click()
                    }}
                    className="bg-white/90 text-slate-700 w-5 h-5 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ZoomIn className="h-2.5 w-2.5" />
                  </button>
                  <div className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center">
                    <Check className="h-2.5 w-2.5" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
