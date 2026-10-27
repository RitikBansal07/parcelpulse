import AsyncStorage from '@react-native-async-storage/async-storage';
import { IParcelPulseApi } from './client';
import { Order, TransitionEvent, DriverShift } from '../types/domain';
import { INITIAL_ORDERS, INITIAL_DRIVER_SHIFT } from './mockSeedData';
import { applyTransition } from '../domain/orderStateMachine';

const STORAGE_KEY_ORDERS = '@parcelpulse_orders_v1';
const STORAGE_KEY_SHIFT = '@parcelpulse_shift_v1';

export class MockParcelPulseApi implements IParcelPulseApi {
  private orders: Order[] = [];
  private shift: DriverShift = { ...INITIAL_DRIVER_SHIFT };
  private initialized: boolean = false;
  private latencyMs: number = 180;

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    try {
      const storedOrders = await AsyncStorage.getItem(STORAGE_KEY_ORDERS);
      if (storedOrders) {
        this.orders = JSON.parse(storedOrders);
      } else {
        this.orders = JSON.parse(JSON.stringify(INITIAL_ORDERS));
        await AsyncStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(this.orders));
      }

      const storedShift = await AsyncStorage.getItem(STORAGE_KEY_SHIFT);
      if (storedShift) {
        this.shift = JSON.parse(storedShift);
      } else {
        this.shift = { ...INITIAL_DRIVER_SHIFT };
        await AsyncStorage.setItem(STORAGE_KEY_SHIFT, JSON.stringify(this.shift));
      }
    } catch {
      this.orders = JSON.parse(JSON.stringify(INITIAL_ORDERS));
      this.shift = { ...INITIAL_DRIVER_SHIFT };
    }

    this.initialized = true;
  }

  private async delay(ms: number = this.latencyMs): Promise<void> {
    if (ms <= 0) return;
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getOrders(): Promise<Order[]> {
    await this.ensureInitialized();
    await this.delay();
    return JSON.parse(JSON.stringify(this.orders));
  }

  async getOrderById(id: string): Promise<Order> {
    await this.ensureInitialized();
    await this.delay();
    const order = this.orders.find((o) => o.id === id);
    if (!order) {
      throw new Error(`Order with ID '${id}' was not found in manifest.`);
    }
    return JSON.parse(JSON.stringify(order));
  }

  async transitionOrder(event: TransitionEvent): Promise<Order> {
    await this.ensureInitialized();
    await this.delay();

    const index = this.orders.findIndex((o) => o.id === event.orderId);
    if (index === -1) {
      throw new Error(`Order ${event.orderId} not found.`);
    }

    const currentOrder = this.orders[index];
    const updatedOrder = applyTransition(currentOrder, event);

    this.orders[index] = updatedOrder;

    // Recalculate completed stops
    const completedCount = this.orders.filter(
      (o) => o.status === 'DELIVERED' || o.status === 'RETURNED_TO_HUB'
    ).length;
    this.shift.completedStops = completedCount;

    try {
      await AsyncStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(this.orders));
      await AsyncStorage.setItem(STORAGE_KEY_SHIFT, JSON.stringify(this.shift));
    } catch {
      // Fallback in-memory
    }

    return JSON.parse(JSON.stringify(updatedOrder));
  }

  async getDriverShift(): Promise<DriverShift> {
    await this.ensureInitialized();
    await this.delay(50);
    return { ...this.shift };
  }

  async toggleShift(): Promise<DriverShift> {
    await this.ensureInitialized();
    await this.delay(80);
    this.shift.activeShift = !this.shift.activeShift;
    try {
      await AsyncStorage.setItem(STORAGE_KEY_SHIFT, JSON.stringify(this.shift));
    } catch {
      // Fallback
    }
    return { ...this.shift };
  }

  async resetDemoData(): Promise<void> {
    this.orders = JSON.parse(JSON.stringify(INITIAL_ORDERS));
    this.shift = { ...INITIAL_DRIVER_SHIFT };
    try {
      await AsyncStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(this.orders));
      await AsyncStorage.setItem(STORAGE_KEY_SHIFT, JSON.stringify(this.shift));
    } catch {
      // Fallback
    }
    this.initialized = true;
  }
}

export const mockApi = new MockParcelPulseApi();

