import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppState, AppActions, InputMode, APIConfig, ImageAPIConfig, AspectRatio, Resolution, ContentBlockState } from '@/types'

const initialState: AppState = {
  inputMode: 'input',
  textContent: '',
  fileName: null,
  splitCount: 1,
  aspectRatio: '1:1',
  resolution: '2K',
  isProcessing: false,
  contentBlocks: [],
  error: null,
  selectedStyleId: 'hand-drawn-visual-notes',
  useStyleReference: false,
  apiConfig: {
    baseUrl: '',
    apiKey: '',
    model: '',
  },
  imageApiConfig: {
    baseUrl: '',
    apiKey: '',
    model: 'gemini-3-pro-image',
    provider: 'openai',
  },
  generatedPrompts: [],
}

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set) => ({
      ...initialState,

      // 输入操作
      setInputMode: (mode: InputMode) => set({ inputMode: mode }),
      setTextContent: (content: string) => set({ textContent: content }),
      setFileName: (name: string | null) => set({ fileName: name }),
      setSplitCount: (count: number) => set({ splitCount: count }),
      setAspectRatio: (ratio: AspectRatio) => set({ aspectRatio: ratio }),
      setResolution: (resolution: Resolution) => set({ resolution }),

      // AI 处理操作
      setIsProcessing: (processing: boolean) => set({ isProcessing: processing }),
      setContentBlocks: (blocks: ContentBlockState[]) => set({ contentBlocks: blocks }),
      setError: (error: string | null) => set({ error }),
      updateContentBlockText: (index: number, text: string) =>
        set((state) => {
          const newBlocks = [...state.contentBlocks]
          newBlocks[index] = { ...newBlocks[index], text }
          return { contentBlocks: newBlocks }
        }),
      updateContentBlockTitle: (index: number, title: string) =>
        set((state) => {
          const newBlocks = [...state.contentBlocks]
          newBlocks[index] = { ...newBlocks[index], title }
          return { contentBlocks: newBlocks }
        }),
      setBlockGenerating: (index: number, isGenerating: boolean) =>
        set((state) => {
          const newBlocks = [...state.contentBlocks]
          newBlocks[index] = { ...newBlocks[index], isGenerating }
          return { contentBlocks: newBlocks }
        }),
      setBlockImage: (index: number, image: string | null) =>
        set((state) => {
          const newBlocks = [...state.contentBlocks]
          newBlocks[index] = { ...newBlocks[index], generatedImage: image, showImage: image !== null }
          return { contentBlocks: newBlocks }
        }),
      setBlockShowImage: (index: number, showImage: boolean) =>
        set((state) => {
          const newBlocks = [...state.contentBlocks]
          newBlocks[index] = { ...newBlocks[index], showImage }
          return { contentBlocks: newBlocks }
        }),

      // 风格选择操作
      setSelectedStyleId: (styleId: string | null) => set({ selectedStyleId: styleId }),
      setUseStyleReference: (use: boolean) => set({ useStyleReference: use }),

      // API 配置操作
      setApiConfig: (config: Partial<APIConfig>) =>
        set((state) => ({
          apiConfig: { ...state.apiConfig, ...config },
        })),
      setImageApiConfig: (config: Partial<ImageAPIConfig>) =>
        set((state) => ({
          imageApiConfig: { ...state.imageApiConfig, ...config },
        })),

      // 提示词操作
      setGeneratedPrompts: (prompts: string[]) => set({ generatedPrompts: prompts }),

      // 重置
      reset: () =>
        set({
          textContent: '',
          fileName: null,
          contentBlocks: [],
          error: null,
          generatedPrompts: [],
          isProcessing: false,
        }),
    }),
    {
      name: 'nano-info-prompt-storage',
      partialize: (state) => ({
        apiConfig: state.apiConfig,
        imageApiConfig: state.imageApiConfig,
        splitCount: state.splitCount,
        selectedStyleId: state.selectedStyleId,
        useStyleReference: state.useStyleReference,
        aspectRatio: state.aspectRatio,
        resolution: state.resolution,
      }),
    }
  )
)
