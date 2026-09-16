import { ref } from 'vue';

export type ToastType = 'success' | 'danger';

export interface ToastState {
  type: ToastType;
  message: string;
}

const toast = ref<ToastState | null>(null);
let toastTimeout: ReturnType<typeof setTimeout> | null = null;

export function useToast(defaultDuration = 3500) {
  const showToast = (type: ToastType, message: string, duration = defaultDuration) => {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
      toastTimeout = null;
    }

    toast.value = { type, message };

    toastTimeout = setTimeout(() => {
      toast.value = null;
      toastTimeout = null;
    }, duration);
  };

  const clearToast = () => {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
      toastTimeout = null;
    }
    toast.value = null;
  };

  return {
    toast,
    showToast,
    clearToast,
  };
}
