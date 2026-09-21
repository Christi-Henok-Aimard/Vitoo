export interface CityPoint {
  name: string;
  lat: number;
  lon: number;
}

export const CITIES: CityPoint[] = [
  { name: 'Abidjan', lat: 5.3599, lon: -4.0083 },
  { name: 'Abobo', lat: 5.4161, lon: -4.0167 },
  { name: 'Yopougon', lat: 5.3294, lon: -4.0785 },
  { name: 'Cocody', lat: 5.3488, lon: -3.9809 },
  { name: 'Daloa', lat: 6.8774, lon: -6.4502 },
  { name: 'Bouake', lat: 7.6932, lon: -5.0332 },
  { name: 'Yamoussoukro', lat: 6.8276, lon: -5.2893 },
  { name: 'San-Pedro', lat: 4.7485, lon: -6.6363 },
  { name: 'Korhogo', lat: 9.4576, lon: -5.6296 },
  { name: 'Abengourou', lat: 6.7298, lon: -3.4966 },
  { name: 'Gagnoa', lat: 6.1314, lon: -5.9507 },
  { name: 'Man', lat: 7.4125, lon: -7.5539 },
  { name: 'Divo', lat: 5.8374, lon: -5.3574 },
  { name: 'Duekoue', lat: 6.7423, lon: -7.3492 },
  { name: 'Odienne', lat: 9.505, lon: -7.5659 },
  { name: 'Bondoukou', lat: 8.0331, lon: -2.8 },
  { name: 'Agboville', lat: 5.9286, lon: -4.2133 },
  { name: 'Grand-Bassam', lat: 5.211, lon: -3.7388 },
  { name: 'Adzope', lat: 6.1067, lon: -3.8611 },
  { name: 'Aboisso', lat: 5.4676, lon: -3.2071 },
  { name: 'Sassandra', lat: 4.9505, lon: -6.0859 },
  { name: 'Katiola', lat: 8.1372, lon: -5.1012 },
  { name: 'Ferkessedougou', lat: 9.5907, lon: -5.1939 },
  { name: 'Jacqueville', lat: 5.3151, lon: -4.4827 },
  { name: 'Dabou', lat: 5.3247, lon: -4.3762 },
  { name: 'Beoumi', lat: 7.6833, lon: -5.5783 },
  { name: 'Tanda', lat: 7.8006, lon: -3.161 },
  { name: 'Boundiali', lat: 9.5197, lon: -6.4875 },
  { name: 'Guiglo', lat: 6.5454, lon: -7.493 },
  { name: 'Issia', lat: 6.4922, lon: -6.5862 },
  { name: 'Soubre', lat: 5.7841, lon: -6.5951 },
  { name: 'Seguela', lat: 7.9611, lon: -6.672 },
  { name: 'Mankono', lat: 8.0588, lon: -6.1891 },
  { name: 'Touba', lat: 8.2841, lon: -7.6799 },
  { name: 'Banga-Boagnon', lat: 7.3198, lon: -5.729 },
];

const reduce = (raw: string): string =>
  (raw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-().']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const CITY_MAP = new Map<string, CityPoint>(
  CITIES.map((city) => [reduce(city.name), city]),
);

export const resolveCity = (name: string | undefined | null): CityPoint | null => {
  if (!name) return null;
  return CITY_MAP.get(reduce(name)) || null;
};

export const DEFAULT_CENTER: [number, number] = [6.8276, -5.2893];