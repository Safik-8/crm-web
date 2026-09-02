// crm-web/src/shared/utils/formatters.js

/**
 * Default fallback configuration (Indian Rupee / IST timezone)
 */
export const DEFAULT_FORMAT_CONFIG = {
  currency: "INR",
  currencySymbol: "₹",
  dateFormat: "DD/MM/YYYY",
  timeZone: "Asia/Kolkata",
  timeFormat: "24H",
  language: "en-IN",
}

/**
 * Universal Currency Formatter
 * Dynamically formats numeric values with the specified or default currency symbol.
 * @param {number|string} value - The numeric value to format
 * @param {string} [symbol="₹"] - Currency symbol override
 * @param {string} [locale="en-IN"] - Number locale
 * @returns {string} Formatted currency string (e.g. "₹1,50,000.00" or "$150,000.00")
 */
export const formatCurrency = (value, symbol = "₹", locale = "en-IN") => {
  if (value === null || value === undefined || value === "") return "—"
  const num = Number(value)
  if (isNaN(num)) return "—"

  const sym = symbol || "₹"
  const formattedNumber = num.toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  return `${sym}${formattedNumber}`
}

/**
 * Compact Currency Formatter for KPI badges and charts
 * (e.g. ₹1.2Cr, ₹5L, ₹10k, or $1.2M, $500k)
 * @param {number|string} value 
 * @param {string} [symbol="₹"] 
 * @returns {string} Compact formatted string
 */
export const formatCurrencyShort = (value, symbol = "₹") => {
  if (value === null || value === undefined || value === "") return "—"
  const num = Number(value)
  if (isNaN(num)) return "—"
  const sym = symbol || "₹"

  if (sym === "₹") {
    // Indian numbering system (Lakh / Crore)
    if (num >= 10000000) return `${sym}${(num / 10000000).toFixed(1)}Cr`
    if (num >= 100000) return `${sym}${(num / 100000).toFixed(1)}L`
    if (num >= 1000) return `${sym}${(num / 1000).toFixed(0)}k`
    return `${sym}${num}`
  } else {
    // Standard International numbering system (k / M / B)
    if (num >= 1000000000) return `${sym}${(num / 1000000000).toFixed(1)}B`
    if (num >= 1000000) return `${sym}${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${sym}${(num / 1000).toFixed(0)}k`
    return `${sym}${num}`
  }
}

/**
 * Universal Date Formatter
 * Formats date according to company configured pattern (e.g. DD/MM/YYYY, YYYY-MM-DD)
 * @param {string|Date} dateInput 
 * @param {string} [pattern="DD/MM/YYYY"] 
 * @returns {string} Formatted date string
 */
export const formatDate = (dateInput, pattern = "DD/MM/YYYY") => {
  if (!dateInput) return "—"
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return "—"

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const shortMonth = monthNames[date.getMonth()]

  switch (pattern) {
    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`
    case "MM/DD/YYYY":
      return `${month}/${day}/${year}`
    case "DD-MMM-YYYY":
      return `${day}-${shortMonth}-${year}`
    case "DD/MM/YYYY":
    default:
      return `${day}/${month}/${year}`
  }
}

/**
 * Universal Date & Time Formatter with Timezone support
 * @param {string|Date} dateInput 
 * @param {string} [pattern="DD/MM/YYYY"] 
 * @param {string} [timeZone="Asia/Kolkata"] 
 * @param {string} [timeFormat="24H"] 
 * @returns {string} Formatted date-time string
 */
export const formatDateTime = (
  dateInput,
  pattern = "DD/MM/YYYY",
  timeZone = "Asia/Kolkata",
  timeFormat = "24H"
) => {
  if (!dateInput) return "—"
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return "—"

  const datePart = formatDate(date, pattern)
  const is12H = timeFormat === "12H"

  try {
    const timeFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone || "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: is12H,
    })
    return `${datePart} ${timeFormatter.format(date)}`
  } catch {
    return datePart
  }
}
