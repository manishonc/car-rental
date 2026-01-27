export interface AuthResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface VehicleColor {
  title: string;
  code: string;
}

export interface VehicleLocation {
  id: number;
  name: string;
  adess?: string;
}

export interface VehicleOption {
  id: string;
  name: string;
  icon?: string;
}

export interface Vehicle {
  id: string;
  year: number;
  number_seats: number;
  number_doors: number;
  large_bags: number;
  small_bags: number;
  odometer: string;
  brand: string;
  mark: string;
  group: string;
  color: VehicleColor;
  type: string;
  body_type: string;
  min_price: number;
  price: number;
  price_tariff: {
    day: string;
  };
  status: string;
  currency: string;
  consumption: string | null;
  fuel: string;
  volume_tank: string | null;
  volume_engine: string | null;
  transmission: string;
  locations: VehicleLocation[];
  options: VehicleOption[];
  thumbnail: string;
  thumbnails: string[];
  photos: string[];
  wheel_drive: string;
  registration_number: string;
  total_price: string;
  price_before_discount: string | null;
  count_days: number;
  refill: string;
  mileage_limit: string;
}

export interface Pagination {
  total_count: number;
  per_page: number;
  page: number;
  count_pages: number;
  begin: number;
  end: number;
}

export interface SearchResponse {
  vehicles: Vehicle[];
  pagination: Pagination;
}

export interface SearchParams {
  date_from: string;
  date_to: string;
  pickup_location?: string;
  return_location?: string;
  page?: number;
  per_page?: number;
}

export interface Location {
  id: number;
  name: string;
  address: string;
  longitude: string;
  latitude: string;
}

export interface CompanySettings {
  currency: string;
  locations: Location[];
  metric_system: string;
  date_format: string;
  currency_position: string;
  isDifferentLocationEnabled: boolean;
}

export interface CreateOrderParams {
  vehicle_id: number;
  date_from: string; // Format: "YYYY-MM-DD HH:mm:ss"
  date_to: string; // Format: "YYYY-MM-DD HH:mm:ss"
  pickup_location: number;
  return_location: number;
  insurances?: Array<{
    id: number;
    custom_price?: number;
  }>;
  extras?: Record<string, number>;
}

export interface CreateOrderResponse {
  id?: string;
  order_id?: string;
  [key: string]: any; // Allow for other fields in the response
}

export interface Driver {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country: string;
  zip: string;
  state: string;
  city: string;
  address: string;
  building?: string;
  birthday: string; // Format: "YYYY-MM-DD"
  notes?: string;
  license_num: string;
  license_from: string; // Format: "YYYY-MM-DD"
  license_to: string; // Format: "YYYY-MM-DD"
  code?: string;
  license_photo?: string[]; // Array of photo IDs
}

export interface ConfirmOrderParams {
  drivers: Driver[];
  payment_method: string;
  comment?: string;
}

export interface ConfirmOrderResponse {
  payment_link: string;
  status: string;
  payment_id: string;
  unique_number: string;
}

export interface FileUploadResponse {
  status: string;
  id: number;
  url: string;
}

export interface InsuranceOption {
  id: number;
  title: string;
  type: 'Fix' | 'Price' | 'Percent';
  value: string;
  price: string;
  price_title: string;
  icon: string;
  deposit: number;
  deposit_price: string;
  damage: number;
  damage_access: string;
  checked?: boolean;
}

export interface UpdateOrderParams {
  insurance: number;
}

export interface UpdateOrderResponse {
  [key: string]: any; // Response structure may vary
}

export interface CancelOrderResponse {
  status: string;
}

export interface Country {
  name: string;
  id: string;
  iso_code: string;
}

export interface SendPassResponse {
  status: string;
  send: boolean;
}

export interface ContactDriver {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  country: string;
  country_id: string;
  city: string;
  address: string;
  birthday: string;
  documents: unknown[];
}

export interface VerifyContactResponse {
  status: string;
  driver: ContactDriver;
}
