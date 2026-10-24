import { useState, useEffect, useCallback } from 'react';
import { Connection, Profile } from '../types';
import { DEMO_CONNECTIONS, DEMO_PROFILES } from './seed/demoData';
import {
  getPendingIncomingRequests,
  getPendingOutgoingRequests,
  getAcceptedConnections,
  acceptConnectionRequest,
  declineConnectionRequest,
  withdrawConnectionRequest,
  sendConnectionRequest,
  removeConnection,
  getRecommendedPeople,
  calculateMutualConnections,
} from '../features/network/networkUtils';
import { useAuth } from './clerk/useAuth';

const STORAGE_KEY = 'nextstep_v2_pk_connections_store';
const DISMISSED_KEY = 'nextstep_v2_pk_dismissed_recommendations';
const EVENT_KEY = 'nextstep_v2_pk_connections_updated';

export function useNetwork() {
  const { profile } = useAuth();
  const currentUserId = profile?.id || 'usr_candidate_john';

  const [connections, setConnections] = useState<Connection[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEMO_CONNECTIONS;
  });

  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(DISMISSED_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  // Listen to cross-component sync
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setConnections(JSON.parse(saved));
        const savedDismissed = localStorage.getItem(DISMISSED_KEY);
        if (savedDismissed) setDismissedIds(JSON.parse(savedDismissed));
      } catch {
        // ignore
      }
    };
    window.addEventListener(EVENT_KEY, handleSync);
    return () => window.removeEventListener(EVENT_KEY, handleSync);
  }, []);

  const saveConnections = useCallback((newConns: Connection[]) => {
    setConnections(newConns);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConns));
    window.dispatchEvent(new CustomEvent(EVENT_KEY));
  }, []);

  const saveDismissed = useCallback((newDismissed: string[]) => {
    setDismissedIds(newDismissed);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(newDismissed));
    window.dispatchEvent(new CustomEvent(EVENT_KEY));
  }, []);

  const accept = useCallback(
    (connId: string) => {
      const updated = acceptConnectionRequest(connections, connId);
      saveConnections(updated);
    },
    [connections, saveConnections]
  );

  const decline = useCallback(
    (connId: string) => {
      const updated = declineConnectionRequest(connections, connId);
      saveConnections(updated);
    },
    [connections, saveConnections]
  );

  const withdraw = useCallback(
    (connId: string) => {
      const updated = withdrawConnectionRequest(connections, connId);
      saveConnections(updated);
    },
    [connections, saveConnections]
  );

  const connect = useCallback(
    (targetProfile: Profile) => {
      const { newConnections } = sendConnectionRequest(
        connections,
        currentUserId,
        targetProfile
      );
      saveConnections(newConnections);
    },
    [connections, currentUserId, saveConnections]
  );

  const remove = useCallback(
    (connId: string) => {
      const updated = removeConnection(connections, connId);
      saveConnections(updated);
    },
    [connections, saveConnections]
  );

  const dismissRecommendation = useCallback(
    (targetId: string) => {
      const updated = [...dismissedIds, targetId];
      saveDismissed(updated);
    },
    [dismissedIds, saveDismissed]
  );

  const incomingRequests = getPendingIncomingRequests(connections, currentUserId);
  const outgoingRequests = getPendingOutgoingRequests(connections, currentUserId);
  const acceptedConnections = getAcceptedConnections(connections, currentUserId);
  const recommendedPeople = getRecommendedPeople(
    currentUserId,
    DEMO_PROFILES,
    connections,
    dismissedIds
  );

  // Helper to check connection status with a specific user
  const getConnectionStatus = useCallback(
    (targetUserId: string): 'none' | 'connected' | 'pending_incoming' | 'pending_outgoing' => {
      const conn = connections.find(
        (c) =>
          (c.requester_id === currentUserId && c.addressee_id === targetUserId) ||
          (c.requester_id === targetUserId && c.addressee_id === currentUserId)
      );
      if (!conn) return 'none';
      if (conn.status === 'accepted') return 'connected';
      if (conn.status === 'pending') {
        return conn.requester_id === currentUserId ? 'pending_outgoing' : 'pending_incoming';
      }
      return 'none';
    },
    [connections, currentUserId]
  );

  return {
    connections,
    incomingRequests,
    outgoingRequests,
    acceptedConnections,
    recommendedPeople,
    dismissedIds,
    accept,
    decline,
    withdraw,
    connect,
    remove,
    dismissRecommendation,
    getConnectionStatus,
    getMutualInfo: (targetId: string) =>
      calculateMutualConnections(currentUserId, targetId, connections, DEMO_PROFILES),
  };
}
