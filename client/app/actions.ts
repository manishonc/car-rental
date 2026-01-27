'use server';

import { getCompanySettings, searchVehicles, createOrder, uploadFile, updateOrder, confirmOrder, getCountries, cancelOrder } from '@/lib/api/rentsyst';
import { Location, SearchResponse, CreateOrderParams, FileUploadResponse, Driver, ConfirmOrderParams, Country, CancelOrderResponse } from '@/lib/api/types';

export interface SearchFormState {
  vehicles: SearchResponse['vehicles'] | null;
  error: string | null;
}

export async function getLocations(): Promise<Location[]> {
  try {
    const settings = await getCompanySettings();
    return settings.locations;
  } catch (err) {
    console.error('Failed to fetch locations:', err);
    return [];
  }
}

export async function searchCars(
  prevState: SearchFormState,
  formData: FormData
): Promise<SearchFormState> {
  const dateFrom = formData.get('date_from') as string;
  const timeFrom = formData.get('time_from') as string;
  const dateTo = formData.get('date_to') as string;
  const timeTo = formData.get('time_to') as string;
  const pickupLocation = formData.get('pickup_location') as string;

  if (!dateFrom || !dateTo) {
    return {
      vehicles: null,
      error: 'Please select pickup and return dates',
    };
  }

  // Format: yyyy-MM-dd HH:mm:ss
  const dateTimeFrom = `${dateFrom} ${timeFrom || '09:00'}:00`;
  const dateTimeTo = `${dateTo} ${timeTo || '09:00'}:00`;

  try {
    const result = await searchVehicles({
      date_from: dateTimeFrom,
      date_to: dateTimeTo,
      pickup_location: pickupLocation || undefined,
      return_location: pickupLocation || undefined,
    });

    return {
      vehicles: result.vehicles,
      error: null,
    };
  } catch (err) {
    console.error('Search error:', err);
    return {
      vehicles: null,
      error: err instanceof Error ? err.message : 'Failed to search vehicles',
    };
  }
}

export interface CreateOrderResult {
  orderId: string | null;
  error: string | null;
}

export async function createOrderAction(params: CreateOrderParams): Promise<CreateOrderResult> {
  try {
    const orderResponse = await createOrder(params);
    const orderId = orderResponse.id || orderResponse.order_id || null;
    
    if (!orderId) {
      return {
        orderId: null,
        error: 'Order ID not found in response',
      };
    }

    return {
      orderId: orderId.toString(),
      error: null,
    };
  } catch (err) {
    console.error('Order creation error:', err);
    return {
      orderId: null,
      error: err instanceof Error ? err.message : 'Failed to create order',
    };
  }
}

export interface UploadFileResult {
  data: FileUploadResponse | null;
  error: string | null;
}

export async function uploadFileAction(formData: FormData): Promise<UploadFileResult> {
  try {
    const file = formData.get('file') as File;
    
    if (!file) {
      return {
        data: null,
        error: 'No file provided',
      };
    }

    const response = await uploadFile(file);
    return {
      data: response,
      error: null,
    };
  } catch (err) {
    console.error('File upload error:', err);
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Failed to upload file',
    };
  }
}

export interface UpdateOrderResult {
  success: boolean;
  error: string | null;
}

export async function updateOrderAction(orderId: string, insuranceId: number): Promise<UpdateOrderResult> {
  try {
    await updateOrder(orderId, { insurance: insuranceId });
    return {
      success: true,
      error: null,
    };
  } catch (err) {
    console.error('Order update error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update order',
    };
  }
}

export interface ConfirmOrderResult {
  success: boolean;
  error: string | null;
}

export async function confirmOrderAction(
  orderId: string,
  drivers: Driver[],
  paymentMethod: string = 'card'
): Promise<ConfirmOrderResult> {
  try {
    const params: ConfirmOrderParams = {
      drivers,
      payment_method: paymentMethod,
    };
    await confirmOrder(orderId, params);
    return {
      success: true,
      error: null,
    };
  } catch (err) {
    console.error('Order confirmation error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to confirm order',
    };
  }
}

export interface CancelOrderResult {
  success: boolean;
  error: string | null;
}

export async function cancelOrderAction(orderId: string): Promise<CancelOrderResult> {
  try {
    await cancelOrder(orderId);
    return {
      success: true,
      error: null,
    };
  } catch (err) {
    console.error('Order cancellation error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to cancel order',
    };
  }
}

export async function getCountriesAction(): Promise<Country[]> {
  try {
    const countries = await getCountries('EN');
    return countries;
  } catch (err) {
    console.error('Failed to fetch countries:', err);
    return [];
  }
}
