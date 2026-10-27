import { IParcelPulseApi } from './client';
import { Order, TransitionEvent, DriverShift } from '../types/domain';

export class HttpParcelPulseApi implements IParcelPulseApi {
  constructor(private baseUrl: string = 'https://api.parcelpulse.internal/v1') {}

  async getOrders(): Promise<Order[]> {
    throw new Error('HttpParcelPulseApi: REST backend endpoint not connected. Use MockParcelPulseApi for client demo.');
  }

  async getOrderById(_id: string): Promise<Order> {
    throw new Error('HttpParcelPulseApi: REST backend endpoint not connected.');
  }

  async transitionOrder(_event: TransitionEvent): Promise<Order> {
    throw new Error('HttpParcelPulseApi: REST backend endpoint not connected.');
  }

  async getDriverShift(): Promise<DriverShift> {
    throw new Error('HttpParcelPulseApi: REST backend endpoint not connected.');
  }

  async toggleShift(): Promise<DriverShift> {
    throw new Error('HttpParcelPulseApi: REST backend endpoint not connected.');
  }

  async resetDemoData(): Promise<void> {
    // No-op
  }
}

