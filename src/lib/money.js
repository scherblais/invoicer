// Money helpers. All amounts are stored as plain numbers (dollars).

export function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}

export function formatMoney(amount, currency = 'CAD') {
  const value = Number.isFinite(Number(amount)) ? Number(amount) : 0
  try {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency
    }).format(value)
  } catch {
    return `$${value.toFixed(2)}`
  }
}

export function parseMoney(input) {
  if (typeof input === 'number') return input
  const n = parseFloat(String(input).replace(/[^0-9.\-]/g, ''))
  return Number.isFinite(n) ? n : 0
}
