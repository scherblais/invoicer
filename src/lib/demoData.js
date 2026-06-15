// Sample data used only in demo mode (VITE_DEMO=1). Everything here lives in
// memory and resets on reload — it exists purely so the app feels real to tap
// through without any cloud setup.

export function seedData() {
  const now = Date.now()
  const day = 86400000

  const catalog = [
    { id: 'c1', kind: 'service', name: 'HDR Photos (25)', price: 199, description: '25 professionally edited HDR photos' },
    { id: 'c2', kind: 'service', name: 'Twilight Photos (5)', price: 129, description: 'Dusk exterior shots' },
    { id: 'c3', kind: 'service', name: 'Floor Plan (2D)', price: 89, description: 'Measured 2D floor plan' },
    { id: 'c4', kind: 'package', name: 'Standard Listing Package', price: 349, description: 'HDR photos + floor plan + 1 social reel' },
    { id: 'c5', kind: 'package', name: 'Premium Listing Package', price: 549, description: 'Everything in Standard + drone + twilight' },
    { id: 'c6', kind: 'addon', name: 'Drone Aerials', price: 149, description: '8–10 aerial photos' },
    { id: 'c7', kind: 'addon', name: 'Cinematic Video Tour', price: 279, description: '60–90s walkthrough video' }
  ]

  const clients = [
    {
      id: 'cl1',
      name: 'Sophie Tremblay',
      company: 'RE/MAX Élite',
      email: 'sophie@remax-elite.ca',
      phone: '(514) 555-0142',
      address: 'Westmount, QC',
      // Volume client: custom prices + a larger free radius and lower rate.
      customRadiusKm: 40,
      customTravelRatePerKm: 0.5,
      customPrices: { c1: 169, c4: 299 },
      createdAt: new Date(now - day * 30)
    },
    {
      id: 'cl2',
      name: 'Marc Bélanger',
      company: 'Sutton Group',
      email: 'marc.belanger@sutton.com',
      phone: '(450) 555-0199',
      address: 'Laval, QC',
      customPrices: {},
      createdAt: new Date(now - day * 12)
    }
  ]

  const settings = {
    businessName: 'Lumeria Real Estate Media',
    businessEmail: 'pascal@lumeriamedia.com',
    businessPhone: '(514) 555-0188',
    businessAddress: 'Montréal, QC',
    baseAddress: 'Montréal, QC, Canada',
    defaultRadiusKm: 25,
    defaultTravelRatePerKm: 0.65,
    travelMode: 'beyond',
    travelRoundTrip: true,
    taxLabel: 'GST/QST',
    taxRate: 14.975,
    currency: 'CAD',
    nextInvoiceNumber: 1043
  }

  const invoices = [
    {
      id: 'inv1',
      number: 1041,
      clientId: 'cl1',
      clientName: 'Sophie Tremblay',
      date: new Date(now - day * 3).toISOString().slice(0, 10),
      status: 'sent',
      listingAddress: '218 Av. Clarke, Westmount, QC',
      distanceKm: 9.4,
      items: [
        { lid: 'l1', catalogId: 'c4', name: 'Standard Listing Package', unitPrice: 299, qty: 1 },
        { lid: 'l2', catalogId: 'c6', name: 'Drone Aerials', unitPrice: 149, qty: 1 }
      ],
      travelEnabled: true,
      travelFeeOverride: null,
      taxRate: 14.975,
      notes: 'Photos delivered within 24h.',
      currency: 'CAD',
      createdAt: new Date(now - day * 3)
    },
    {
      id: 'inv2',
      number: 1042,
      clientId: 'cl2',
      clientName: 'Marc Bélanger',
      date: new Date(now - day * 1).toISOString().slice(0, 10),
      status: 'draft',
      listingAddress: '1450 Boul. des Laurentides, Laval, QC',
      distanceKm: 38.2,
      items: [
        { lid: 'l3', catalogId: 'c1', name: 'HDR Photos (25)', unitPrice: 199, qty: 1 },
        { lid: 'l4', catalogId: 'c2', name: 'Twilight Photos (5)', unitPrice: 129, qty: 1 },
        { lid: 'l5', catalogId: 'c7', name: 'Cinematic Video Tour', unitPrice: 279, qty: 1 }
      ],
      travelEnabled: true,
      travelFeeOverride: null,
      taxRate: 14.975,
      notes: '',
      currency: 'CAD',
      createdAt: new Date(now - day * 1)
    }
  ]

  return { catalog, clients, settings, invoices }
}
