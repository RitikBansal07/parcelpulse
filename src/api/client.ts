import { Order, TransitionEvent, DriverShift } from '../types/domain';

export interface IParcelPulseApi {
  getOrders(): Promise<Order[]>;
  getOrderById(id: string): Promise<Order>;
  transitionOrder(event: TransitionEvent): Promise<Order>;
  getDriverShift(): Promise<DriverShift>;
  toggleShift(): Promise<DriverShift>;
  resetDemoData(): Promise<void>;
}

