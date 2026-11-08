const message = ref('')
const toastText = ref('')
let toastTimer: ReturnType<typeof setTimeout> | undefined

/** Screen-reader announcements (polite live region) and transient toasts. */
export function useFeedback() {
  const announce = (m: string) => {
    message.value = ''
    setTimeout(() => {
      message.value = m
    }, 30)
  }
  const toast = (m: string) => {
    toastText.value = m
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      toastText.value = ''
    }, 2800)
  }
  return { message, toastText, announce, toast }
}
