import { round2 } from './money'

// Travel fee rules:
//  - Each client has a free radius (default from settings, e.g. 25 km).
//  - Beyond that radius, a per-km rate applies.
//  - "beyond" mode (default) charges only the distance past the free radius.
//  - "total" mode charges the entire one-way distance once the radius is exceeded.
//  - The "roundTrip" flag doubles the billable distance (there and back).
export function computeTravelFee({
  distanceKm,
  freeRadiusKm = 25,
  ratePerKm = 0,
  mode = 'beyond',
  roundTrip = true
}) {
  const distance = Math.max(0, Number(distanceKm) || 0)
  const radius = Math.max(0, Number(freeRadiusKm) || 0)
  const rate = Math.max(0, Number(ratePerKm) || 0)

  if (distance <= radius) {
    return { billableKm: 0, fee: 0, withinFreeRadius: true }
  }

  const oneWayBillable = mode === 'total' ? distance : distance - radius
  const billableKm = roundTrip ? oneWayBillable * 2 : oneWayBillable
  const fee = round2(billableKm * rate)

  return { billableKm: round2(billableKm), fee, withinFreeRadius: false }
}

// Resolve the effective travel settings for a given client, falling back to the
// business defaults whenever the client has no override.
export function resolveTravelSettings(client, settings) {
  const s = settings || {}
  const c = client || {}
  const num = (v) => (v === '' || v === null || v === undefined ? undefined : Number(v))

  return {
    freeRadiusKm: num(c.customRadiusKm) ?? num(s.defaultRadiusKm) ?? 25,
    ratePerKm: num(c.customTravelRatePerKm) ?? num(s.defaultTravelRatePerKm) ?? 0,
    mode: s.travelMode || 'beyond',
    roundTrip: s.travelRoundTrip !== false
  }
}
