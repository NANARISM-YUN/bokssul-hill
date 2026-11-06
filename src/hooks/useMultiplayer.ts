import { useState, useRef, useEffect, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import type {
  RemotePlayer,
  RollingOrb,
  Wish,
  PlayerAction,
} from '../types/wish';

interface UseMultiplayerProps {
  myNickname: string;
  myColor: string;
  myAction: PlayerAction;
  myEmote: string | null;
  orbsRef: React.MutableRefObject<RollingOrb[]>;
  setCollectedCount: (count: number) => void;
  onMeteorTriggered: () => void;
  setWishes: React.Dispatch<React.SetStateAction<Wish[]>>;
  setBannerMessage: (msg: string | null) => void;
  setIsNightMode: (night: boolean) => void;
}

export const useMultiplayer = ({
  myNickname,
  myColor,
  myAction,
  myEmote,
  orbsRef,
  setCollectedCount,
  onMeteorTriggered,
  setWishes,
  setBannerMessage,
  setIsNightMode,
}: UseMultiplayerProps) => {
  const myIdRef = useRef<string>(
    'user_' + Math.random().toString(36).substring(2, 9)
  );
  const [remotePlayers, setRemotePlayers] = useState<
    Record<string, RemotePlayer>
  >({});
  const channelRef = useRef<RealtimeChannel | null>(null);
  const myLatestCoordsRef = useRef({
    x: 0,
    z: 8.5,
    rot: Math.PI,
    isMoving: false,
  });

  useEffect(() => {
    const myId = myIdRef.current;
    const channel = supabase.channel('bokssul-hill-room', {
      config: {
        presence: { key: myId },
        broadcast: { self: false },
      },
    });

    channelRef.current = channel;

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      setRemotePlayers((prev) => {
        const next: Record<string, RemotePlayer> = {};
        Object.entries(state).forEach(([key, list]) => {
          if (key === myId || !list || list.length === 0) return;
          const info = list[0] as unknown as Partial<RemotePlayer>;
          const existing = prev[key];
          next[key] = {
            id: key,
            nickname: info.nickname || existing?.nickname || '복쓸이',
            color: info.color || existing?.color || '#e53935',
            x: existing?.x ?? info.x ?? 0,
            z: existing?.z ?? info.z ?? 8.5,
            rot: existing?.rot ?? info.rot ?? Math.PI,
            isMoving: existing?.isMoving ?? false,
            action: existing?.action ?? 'idle',
            emote: existing?.emote ?? null,
            lastSeen: Date.now(),
          };
        });
        return next;
      });
    });

    channel.on('broadcast', { event: 'player-move' }, ({ payload }) => {
      if (!payload || payload.id === myId) return;
      setRemotePlayers((prev) => ({
        ...prev,
        [payload.id]: {
          ...(prev[payload.id] || {}),
          id: payload.id,
          nickname: payload.nickname,
          color: payload.color,
          x: payload.x,
          z: payload.z,
          rot: payload.rot,
          isMoving: payload.isMoving,
          action: payload.action ?? prev[payload.id]?.action ?? 'idle',
          emote: payload.emote ?? prev[payload.id]?.emote ?? null,
          lastSeen: Date.now(),
        },
      }));
    });

    // 다른 유저가 굴린 구슬 좌표를 React 리렌더링 없이 orbsRef에 직접 반영
    channel.on('broadcast', { event: 'orb-sync' }, ({ payload }) => {
      if (!payload || !payload.orbs) return;
      const incoming = payload.orbs as RollingOrb[];
      orbsRef.current = incoming;
      setCollectedCount(incoming.filter((o) => o.collected).length);
      if (payload.meteorTriggered) {
        onMeteorTriggered();
      }
    });

    channel.on('broadcast', { event: 'wish-sync' }, ({ payload }) => {
      if (!payload || !payload.wishes) return;
      const incoming = (payload.wishes as Wish[]).map((w) => ({
        ...w,
        isMine: false,
      }));
      setWishes(incoming);
      if (payload.banner) setBannerMessage(payload.banner);
      if (payload.nightMode !== undefined) setIsNightMode(payload.nightMode);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          id: myId,
          nickname: myNickname,
          color: myColor,
          x: myLatestCoordsRef.current.x,
          z: myLatestCoordsRef.current.z,
          rot: myLatestCoordsRef.current.rot,
        });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    myNickname,
    myColor,
    orbsRef,
    setCollectedCount,
    onMeteorTriggered,
    setWishes,
    setBannerMessage,
    setIsNightMode,
  ]);

  const broadcastPosition = useCallback(
    (coords: { x: number; z: number; rot: number; isMoving: boolean }) => {
      myLatestCoordsRef.current = coords;
      if (!channelRef.current) return;
      channelRef.current.send({
        type: 'broadcast',
        event: 'player-move',
        payload: {
          id: myIdRef.current,
          nickname: myNickname,
          color: myColor,
          ...coords,
          action: myAction,
          emote: myEmote,
        },
      });
    },
    [myNickname, myColor, myAction, myEmote]
  );

  const broadcastAction = useCallback(
    (action: PlayerAction, emote: string | null) => {
      if (!channelRef.current) return;
      channelRef.current.send({
        type: 'broadcast',
        event: 'player-move',
        payload: {
          id: myIdRef.current,
          nickname: myNickname,
          color: myColor,
          ...myLatestCoordsRef.current,
          action,
          emote,
        },
      });
    },
    [myNickname, myColor]
  );

  const broadcastOrbs = useCallback(
    (orbs: RollingOrb[], meteorTriggered: boolean) => {
      if (!channelRef.current) return;
      channelRef.current.send({
        type: 'broadcast',
        event: 'orb-sync',
        payload: {
          orbs: orbs.map((o) => ({
            ...o,
            x: Number(o.x.toFixed(2)),
            z: Number(o.z.toFixed(2)),
            vx: Number(o.vx.toFixed(2)),
            vz: Number(o.vz.toFixed(2)),
          })),
          meteorTriggered,
        },
      });
    },
    []
  );

  const broadcastWishes = useCallback(
    (nextWishes: Wish[], banner?: string, nightMode?: boolean) => {
      if (!channelRef.current) return;
      channelRef.current.send({
        type: 'broadcast',
        event: 'wish-sync',
        payload: {
          wishes: nextWishes,
          banner,
          nightMode,
        },
      });
    },
    []
  );

  return {
    remotePlayers,
    broadcastPosition,
    broadcastAction,
    broadcastOrbs,
    broadcastWishes,
  };
};