import { format } from "date-fns";

export function formatDate(date: string | Date | undefined) {
  if (!date) {
    return "unknown";
  }
  const value = new Date(date);
  value.setMinutes(value.getMinutes() - value.getTimezoneOffset());
  return format(value, "yyyy-MM-dd");
}
