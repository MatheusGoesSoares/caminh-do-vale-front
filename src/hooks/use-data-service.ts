import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDataService } from '@/services';
import type {
  ShipmentFilters,
  AlertFilters,
  TimeRange,
} from '@/types';
import type { DataService } from '@/services/api/data-service';

const service = getDataService();

export function useDataService(): DataService {
  return service;
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => service.getDashboardSummary(),
    refetchInterval: 30_000,
  });
}

export function useShipments(filters?: ShipmentFilters) {
  return useQuery({
    queryKey: ['shipments', filters],
    queryFn: () => service.getShipments(filters),
    refetchInterval: 30_000,
  });
}

export function useShipment(id: string) {
  return useQuery({
    queryKey: ['shipment', id],
    queryFn: () => service.getShipmentById(id),
    enabled: !!id,
  });
}

export function useLatestReading(shipmentId: string) {
  return useQuery({
    queryKey: ['latest-reading', shipmentId],
    queryFn: () => service.getLatestReadings(shipmentId),
    enabled: !!shipmentId,
    refetchInterval: 15_000,
  });
}

export function useReadingHistory(shipmentId: string, timeRange: TimeRange) {
  return useQuery({
    queryKey: ['reading-history', shipmentId, timeRange],
    queryFn: () => service.getReadingHistory(shipmentId, timeRange),
    enabled: !!shipmentId,
    refetchInterval: 15_000,
  });
}

export function useShipmentPositions(shipmentId: string) {
  return useQuery({
    queryKey: ['shipment-positions', shipmentId],
    queryFn: () => service.getShipmentPositions(shipmentId),
    enabled: !!shipmentId,
  });
}

export function useAlerts(filters?: AlertFilters) {
  return useQuery({
    queryKey: ['alerts', filters],
    queryFn: () => service.getAlerts(filters),
    refetchInterval: 15_000,
  });
}

const AFFECTED_BY_ACTIONS = [
  'alerts',
  'notifications',
  'dashboard-summary',
  'shipments',
  'shipment',
  'latest-reading',
];

function useServiceAction(action: (id: string) => Promise<void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: () => {
      for (const key of AFFECTED_BY_ACTIONS) queryClient.invalidateQueries({ queryKey: [key] });
    },
  });
}

export function useAcknowledgeAlert() {
  return useServiceAction((id) => service.acknowledgeAlert(id));
}

export function useResolveAlert() {
  return useServiceAction((id) => service.resolveAlert(id));
}

export function useStartShipment() {
  return useServiceAction((id) => service.startShipment(id));
}

export function useFinishShipment() {
  return useServiceAction((id) => service.finishShipment(id));
}

export function useFruitProfiles() {
  return useQuery({
    queryKey: ['fruit-profiles'],
    queryFn: () => service.getFruitProfiles(),
    staleTime: Infinity,
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => service.getNotifications(),
    refetchInterval: 15_000,
  });
}
