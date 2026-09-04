import type { Address } from './types';

export interface AddressSuggestion {
  id: string;
  label: string;
  secondary: string;
  address: Address;
}

// Smart mailing: Google Places when a key is present, Photon (OpenStreetMap) otherwise.
export async function suggestAddresses(query: string, signal?: AbortSignal): Promise<AddressSuggestion[]> {
  const q = query.trim();
  if (q.length < 4) return [];
  const key = import.meta.env.VITE_GOOGLE_PLACES_KEY as string | undefined;
  if (key) return googleSuggest(q, key, signal);
  return photonSuggest(q, signal);
}

async function photonSuggest(q: string, signal?: AbortSignal): Promise<AddressSuggestion[]> {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en&osm_tag=place&osm_tag=building&osm_tag=highway&bbox=-179,17,-65,72`;
  const res = await fetch(url, { signal });
  if (!res.ok) return [];
  const json = (await res.json()) as { features: Array<{ properties: Record<string, string>; geometry: { coordinates: [number, number] } }> };
  return json.features
    .filter((f) => f.properties.country === 'United States' || f.properties.countrycode === 'US')
    .map((f) => {
      const p = f.properties;
      const line1 = [p.housenumber, p.street ?? p.name].filter(Boolean).join(' ');
      const city = p.city ?? p.town ?? p.village ?? p.county ?? '';
      const state = stateAbbr(p.state ?? '');
      const postalCode = p.postcode ?? '';
      const address: Address = { line1, city, state, postalCode, country: 'US', lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] };
      address.formatted = formatAddress(address);
      return { id: `${p.osm_id ?? line1}-${postalCode}`, label: line1 || p.name || '', secondary: [city, state, postalCode].filter(Boolean).join(', '), address };
    })
    .filter((s) => s.label);
}

async function googleSuggest(q: string, key: string, signal?: AbortSignal): Promise<AddressSuggestion[]> {
  const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key },
    body: JSON.stringify({ input: q, includedRegionCodes: ['us'] }),
    signal,
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { suggestions?: Array<{ placePrediction: { placeId: string; structuredFormat: { mainText: { text: string }; secondaryText?: { text: string } } } }> };
  return (json.suggestions ?? []).map((s) => {
    const pp = s.placePrediction;
    const main = pp.structuredFormat.mainText.text;
    const secondary = pp.structuredFormat.secondaryText?.text ?? '';
    const [city = '', stateZip = ''] = secondary.split(',').map((x) => x.trim());
    const [state = '', postalCode = ''] = stateZip.split(' ');
    const address: Address = { line1: main, city, state, postalCode, country: 'US' };
    address.formatted = formatAddress(address);
    return { id: pp.placeId, label: main, secondary, address };
  });
}

export function formatAddress(a?: Address | null) {
  if (!a) return '';
  return [a.line1, a.line2, [a.city, a.state].filter(Boolean).join(', ') + (a.postalCode ? ` ${a.postalCode}` : '')].filter(Boolean).join(', ');
}

const STATES: Record<string, string> = { Alabama:'AL',Alaska:'AK',Arizona:'AZ',Arkansas:'AR',California:'CA',Colorado:'CO',Connecticut:'CT',Delaware:'DE','District of Columbia':'DC',Florida:'FL',Georgia:'GA',Hawaii:'HI',Idaho:'ID',Illinois:'IL',Indiana:'IN',Iowa:'IA',Kansas:'KS',Kentucky:'KY',Louisiana:'LA',Maine:'ME',Maryland:'MD',Massachusetts:'MA',Michigan:'MI',Minnesota:'MN',Mississippi:'MS',Missouri:'MO',Montana:'MT',Nebraska:'NE',Nevada:'NV','New Hampshire':'NH','New Jersey':'NJ','New Mexico':'NM','New York':'NY','North Carolina':'NC','North Dakota':'ND',Ohio:'OH',Oklahoma:'OK',Oregon:'OR',Pennsylvania:'PA','Rhode Island':'RI','South Carolina':'SC','South Dakota':'SD',Tennessee:'TN',Texas:'TX',Utah:'UT',Vermont:'VT',Virginia:'VA',Washington:'WA','West Virginia':'WV',Wisconsin:'WI',Wyoming:'WY' };
export function stateAbbr(s: string) {
  if (s.length === 2) return s.toUpperCase();
  return STATES[s] ?? s;
}
