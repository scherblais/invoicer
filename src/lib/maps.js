import { googleMapsApiKey, isMapsConfigured } from '../config'

// Loads the Google Maps JavaScript API once and reuses the same promise.
let loaderPromise = null

export function loadGoogleMaps() {
  if (!isMapsConfigured) {
    return Promise.reject(new Error('Google Maps API key is not configured.'))
  }
  if (window.google && window.google.maps) {
    return Promise.resolve(window.google.maps)
  }
  if (loaderPromise) return loaderPromise

  loaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    const params = new URLSearchParams({
      key: googleMapsApiKey,
      libraries: 'places',
      v: 'weekly'
    })
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google && window.google.maps) resolve(window.google.maps)
      else reject(new Error('Google Maps failed to load.'))
    }
    script.onerror = () => reject(new Error('Google Maps failed to load.'))
    document.head.appendChild(script)
  })
  return loaderPromise
}

// Returns one-way driving distance in kilometres between two addresses.
export async function getDrivingDistanceKm(origin, destination) {
  const maps = await loadGoogleMaps()
  const service = new maps.DistanceMatrixService()

  const response = await service.getDistanceMatrix({
    origins: [origin],
    destinations: [destination],
    travelMode: maps.TravelMode.DRIVING,
    unitSystem: maps.UnitSystem.METRIC
  })

  const element = response?.rows?.[0]?.elements?.[0]
  if (!element || element.status !== 'OK') {
    throw new Error('Could not determine the driving distance for that address.')
  }
  return element.distance.value / 1000 // metres -> km
}

// Attaches Google Places Autocomplete to an <input> element.
// Returns a cleanup function, or null if Maps is unavailable.
export async function attachAddressAutocomplete(inputEl, onSelect) {
  if (!inputEl) return null
  const maps = await loadGoogleMaps()
  const autocomplete = new maps.places.Autocomplete(inputEl, {
    fields: ['formatted_address', 'geometry'],
    types: ['address']
  })
  const listener = autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace()
    if (place && place.formatted_address) {
      onSelect(place.formatted_address)
    }
  })
  return () => {
    maps.event.removeListener(listener)
  }
}
