import { AuthResponse, CompanySettings, SearchParams, SearchResponse, CreateOrderParams, CreateOrderResponse, ConfirmOrderParams, ConfirmOrderResponse, FileUploadResponse, UpdateOrderParams, UpdateOrderResponse } from './types';
import { getStoredToken, storeToken, getFallbackToken } from './token-store';

// In-memory cache for current process
let memoryToken: string | null = null;
let memoryExpiresAt: number | null = null;

export async function getAccessToken(): Promise<string> {
  // 1. Check in-memory cache first (fastest)
  if (memoryToken && memoryExpiresAt && Date.now() < memoryExpiresAt) {
    console.log('[API] getAccessToken: Using in-memory cached token');
    return memoryToken;
  }

  // 2. Check persistent file storage
  const storedToken = getStoredToken();
  if (storedToken) {
    console.log('[API] getAccessToken: Using persisted token from file');
    memoryToken = storedToken.access_token;
    memoryExpiresAt = storedToken.expires_at;
    return storedToken.access_token;
  }

  // 3. Try to get a new token from API
  const authUrl = process.env.RENTSYST_AUTH_URL;
  const clientId = process.env.RENTSYST_CLIENT_ID;
  const clientSecret = process.env.RENTSYST_CLIENT_SECRET;

  if (!authUrl || !clientId || !clientSecret) {
    // If no credentials, try fallback
    const fallback = getFallbackToken();
    if (fallback) {
      console.log('[API] getAccessToken: Using fallback token (no credentials)');
      return fallback;
    }
    throw new Error('Missing RentSyst API credentials');
  }

  const formData = new FormData();
  formData.append('client_id', clientId);
  formData.append('client_secret', clientSecret);
  formData.append('grant_type', 'client_credentials');

  const startTime = Date.now();
  console.log('[API] getAccessToken: Requesting new token');

  try {
    const response = await fetch(authUrl, {
      method: 'POST',
      body: formData,
    });

    const responseTime = Date.now() - startTime;
    console.log('[API] getAccessToken: Response received', {
      status: response.status,
      statusText: response.statusText,
      responseTime: `${responseTime}ms`,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response');
      console.error('[API] getAccessToken: Error response', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText,
      });

      // 4. If rate limited (429), use fallback token
      if (response.status === 429) {
        const fallback = getFallbackToken();
        if (fallback) {
          console.log('[API] getAccessToken: Rate limited, using fallback token');
          return fallback;
        }
      }

      throw new Error(`Authentication failed: ${response.status}`);
    }

    const data: AuthResponse = await response.json();
    console.log('[API] getAccessToken: Success', {
      tokenType: data.token_type,
      expiresIn: data.expires_in,
      scope: data.scope,
    });

    // Store token in both memory and file
    memoryToken = data.access_token;
    memoryExpiresAt = Date.now() + (data.expires_in * 1000) - 60000;
    storeToken(data.access_token, data.expires_in);

    return data.access_token;
  } catch (error) {
    // Network error or other failure - try fallback
    const fallback = getFallbackToken();
    if (fallback) {
      console.log('[API] getAccessToken: Request failed, using fallback token');
      return fallback;
    }
    throw error;
  }
}

export async function searchVehicles(params: SearchParams): Promise<SearchResponse> {
  const token = await getAccessToken();
  const apiUrl = process.env.RENTSYST_API_URL;

  if (!apiUrl) {
    throw new Error('Missing RENTSYST_API_URL');
  }

  const searchParams = new URLSearchParams();
  searchParams.append('date_from', params.date_from);
  searchParams.append('date_to', params.date_to);

  if (params.pickup_location) {
    searchParams.append('pickup_location', params.pickup_location);
  }
  if (params.return_location) {
    searchParams.append('return_location', params.return_location);
  }
  if (params.page) {
    searchParams.append('page', params.page.toString());
  }
  if (params.per_page) {
    searchParams.append('per_page', params.per_page.toString());
  }

  const url = `${apiUrl}/booking/search?${searchParams.toString()}`;
  const startTime = Date.now();
  console.log('[API] searchVehicles: Request started', {
    url: `${apiUrl}/booking/search`,
    method: 'GET',
    params: {
      date_from: params.date_from,
      date_to: params.date_to,
      pickup_location: params.pickup_location,
      return_location: params.return_location,
    },
  });

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const responseTime = Date.now() - startTime;
  console.log('[API] searchVehicles: Response received', {
    status: response.status,
    statusText: response.statusText,
    responseTime: `${responseTime}ms`,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unable to read error response');
    console.error('[API] searchVehicles: Error response', {
      status: response.status,
      statusText: response.statusText,
      errorBody: errorText,
    });
    throw new Error(`Search failed: ${response.status}`);
  }

  const data: SearchResponse = await response.json();
  console.log('[API] searchVehicles: Success', {
    vehiclesCount: data.vehicles?.length || 0,
    pagination: data.pagination,
    responseTime: `${responseTime}ms`,
  });

  return data;
}

export async function getCompanySettings(): Promise<CompanySettings> {
  const token = await getAccessToken();
  const apiUrl = process.env.RENTSYST_API_URL;

  if (!apiUrl) {
    throw new Error('Missing RENTSYST_API_URL');
  }

  const url = `${apiUrl}/company/settings`;
  const startTime = Date.now();
  console.log('[API] getCompanySettings: Request started', {
    url,
    method: 'GET',
  });

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const responseTime = Date.now() - startTime;
  console.log('[API] getCompanySettings: Response received', {
    status: response.status,
    statusText: response.statusText,
    responseTime: `${responseTime}ms`,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unable to read error response');
    console.error('[API] getCompanySettings: Error response', {
      status: response.status,
      statusText: response.statusText,
      errorBody: errorText,
    });
    throw new Error(`Failed to fetch company settings: ${response.status}`);
  }

  const data: CompanySettings = await response.json();
  console.log('[API] getCompanySettings: Success', {
    currency: data.currency,
    locationsCount: data.locations?.length || 0,
    metricSystem: data.metric_system,
    responseTime: `${responseTime}ms`,
  });

  return data;
}

export async function createOrder(params: CreateOrderParams): Promise<CreateOrderResponse> {
  const token = await getAccessToken();
  const apiUrl = process.env.RENTSYST_API_URL;

  if (!apiUrl) {
    throw new Error('Missing RENTSYST_API_URL');
  }

  const requestBody: any = {
    vehicle_id: params.vehicle_id,
    date_from: params.date_from,
    date_to: params.date_to,
    pickup_location: params.pickup_location,
    return_location: params.return_location,
  };

  // Add optional fields if provided
  if (params.insurances) {
    requestBody.insurances = params.insurances;
  }
  if (params.extras) {
    requestBody.extras = params.extras;
  }

  const url = `${apiUrl}/order/create`;
  const startTime = Date.now();
  console.log('[API] createOrder: Request started', {
    url,
    method: 'POST',
    body: requestBody,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  const responseTime = Date.now() - startTime;
  console.log('[API] createOrder: Response received', {
    status: response.status,
    statusText: response.statusText,
    responseTime: `${responseTime}ms`,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unable to read error response');
    console.error('[API] createOrder: Error response', {
      status: response.status,
      statusText: response.statusText,
      errorBody: errorText,
    });
    throw new Error(`Order creation failed: ${response.status}`);
  }

  const data: CreateOrderResponse = await response.json();
  console.log('[API] createOrder: Success', {
    orderId: data.id || data.order_id,
    responseTime: `${responseTime}ms`,
  });

  return data;
}

export async function updateOrder(orderId: string, params: UpdateOrderParams): Promise<UpdateOrderResponse> {
  const token = await getAccessToken();
  const apiUrl = process.env.RENTSYST_API_URL;

  if (!apiUrl) {
    throw new Error('Missing RENTSYST_API_URL');
  }

  const url = `${apiUrl}/v2/order/update/${orderId}`;
  const startTime = Date.now();
  console.log('[API] updateOrder: Request started', {
    url,
    method: 'PUT',
    orderId,
    body: params,
  });

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  const responseTime = Date.now() - startTime;
  console.log('[API] updateOrder: Response received', {
    status: response.status,
    statusText: response.statusText,
    responseTime: `${responseTime}ms`,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unable to read error response');
    console.error('[API] updateOrder: Error response', {
      status: response.status,
      statusText: response.statusText,
      errorBody: errorText,
    });
    throw new Error(`Order update failed: ${response.status}`);
  }

  const data: UpdateOrderResponse = await response.json();
  console.log('[API] updateOrder: Success', {
    orderId,
    responseTime: `${responseTime}ms`,
  });

  return data;
}

export async function confirmOrder(orderId: string, params: ConfirmOrderParams): Promise<ConfirmOrderResponse> {
  const token = await getAccessToken();
  const apiUrl = process.env.RENTSYST_API_URL;

  if (!apiUrl) {
    throw new Error('Missing RENTSYST_API_URL');
  }

  const url = `${apiUrl}/order/confirm/${orderId}`;
  const startTime = Date.now();
  console.log('[API] confirmOrder: Request started', {
    url,
    method: 'POST',
    orderId,
    body: params,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  const responseTime = Date.now() - startTime;
  console.log('[API] confirmOrder: Response received', {
    status: response.status,
    statusText: response.statusText,
    responseTime: `${responseTime}ms`,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unable to read error response');
    console.error('[API] confirmOrder: Error response', {
      status: response.status,
      statusText: response.statusText,
      errorBody: errorText,
    });
    throw new Error(`Order confirmation failed: ${response.status}`);
  }

  const data: ConfirmOrderResponse = await response.json();
  console.log('[API] confirmOrder: Success', {
    orderId,
    responseTime: `${responseTime}ms`,
  });

  return data;
}

export async function uploadFile(file: File): Promise<FileUploadResponse> {
  const token = await getAccessToken();
  const apiUrl = process.env.RENTSYST_API_URL;

  if (!apiUrl) {
    throw new Error('Missing RENTSYST_API_URL');
  }

  const formData = new FormData();
  formData.append('file', file);

  const url = `${apiUrl}/file/upload`;
  const startTime = Date.now();
  console.log('[API] uploadFile: Request started', {
    url,
    method: 'POST',
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  const responseTime = Date.now() - startTime;
  console.log('[API] uploadFile: Response received', {
    status: response.status,
    statusText: response.statusText,
    responseTime: `${responseTime}ms`,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unable to read error response');
    console.error('[API] uploadFile: Error response', {
      status: response.status,
      statusText: response.statusText,
      errorBody: errorText,
    });
    throw new Error(`File upload failed: ${response.status}`);
  }

  const data: FileUploadResponse = await response.json();
  console.log('[API] uploadFile: Success', {
    fileId: data.id,
    fileUrl: data.url,
    status: data.status,
    responseTime: `${responseTime}ms`,
  });

  return data;
}
