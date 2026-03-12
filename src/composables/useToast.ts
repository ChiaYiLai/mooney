import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: number
  message: string
  type: ToastType
  duration: number
}

const toasts = ref<Toast[]>([])

export function useToast() {
  const add = (message: string, type: ToastType = 'info', duration = 3500) => {
    const id = Date.now()
    toasts.value.push({ id, message, type, duration })
    setTimeout(() => remove(id), duration)
  }

  const remove = (id: number) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return {
    toasts,
    remove,
    success: (msg: string, duration?: number) => add(msg, 'success', duration),
    error:   (msg: string, duration?: number) => add(msg, 'error',   duration),
    warning: (msg: string, duration?: number) => add(msg, 'warning', duration),
    info:    (msg: string, duration?: number) => add(msg, 'info',    duration),
  }
}
