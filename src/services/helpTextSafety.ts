export function containsHelpContactDetails(message: string): boolean {
  return /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(message)
    || /(https?:\/\/|www\.)/i.test(message)
    || message.replace(/\D/g, '').length >= 8
}
