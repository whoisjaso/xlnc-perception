// NHTSA vPIC decoder. Free, no key. https://vpic.nhtsa.dot.gov/api/
export interface VinDecodeResult {
  vin: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  bodyClass?: string;
  fuelType?: string;
  transmission?: string;
  drive?: string;
  seats?: number;
  engine?: string;
  horsepower?: number;
  plantCountry?: string;
  errorText?: string;
  raw: Record<string, string>;
}

export async function decodeVin(vin: string, signal?: AbortSignal): Promise<VinDecodeResult> {
  const v = vin.trim().toUpperCase();
  const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(v)}?format=json`, { signal });
  if (!res.ok) throw new Error(`Decoder unavailable (${res.status})`);
  const json = (await res.json()) as { Results?: Record<string, string>[] };
  const r = json.Results?.[0] ?? {};
  const n = (s?: string) => (s && s.trim() ? Number(s) : undefined);
  const s = (k: string) => (r[k] && r[k].trim() ? r[k].trim() : undefined);
  const errorCode = s('ErrorCode');
  return {
    vin: v,
    year: n(r.ModelYear),
    make: title(s('Make')),
    model: s('Model'),
    trim: s('Trim') || s('Series'),
    bodyClass: s('BodyClass'),
    fuelType: s('FuelTypePrimary'),
    transmission: s('TransmissionStyle'),
    drive: s('DriveType'),
    seats: n(r.Seats),
    engine: [s('DisplacementL') ? `${s('DisplacementL')}L` : undefined, s('EngineCylinders') ? `${s('EngineCylinders')} cyl` : undefined, s('EngineConfiguration')].filter(Boolean).join(' ') || undefined,
    horsepower: n(r.EngineHP),
    plantCountry: s('PlantCountry'),
    errorText: errorCode && errorCode !== '0' ? s('ErrorText') : undefined,
    raw: r,
  };
}

function title(s?: string) {
  if (!s) return s;
  const keep = new Set(['BMW', 'GMC', 'RAM', 'MINI', 'AMG']);
  return s.split(' ').map((w) => (keep.has(w.toUpperCase()) ? w.toUpperCase() : w[0] + w.slice(1).toLowerCase())).join(' ');
}
