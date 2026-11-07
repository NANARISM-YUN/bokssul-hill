import { useState, useRef, useEffect, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import type {
  RemotePlayer,
  RollingOrb,
  Wish,
  PlayerAction,
  FlowerType,
  MisfortuneSpirit,
} from '../types/wish';

interface UseMultiplayerProps {
  myNickname: string;
  myColor: string;
  myAction: PlayerAction;
  myEmote: string | null;
  myKarma: number;
  myFlowerType: FlowerType;
  orbsRef: React.MutableRefObject<RollingOrb[]>;
  spiritsRef: React.MutableRefObject<MisfortuneSpirit[]>;
  wishesRef: React.MutableRefObject<Wish[]>;
  setSpirits: React.Dispatch<React.SetStateAction<MisfortuneSpirit[]>>;
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
  myKarma,
  myFlowerType,
  orbsRef,
  spiritsRef,
  wishesRef,
  setSpirits,
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
            karma: info.karma ?? existing?.karma ?? 0,
            flowerType: info.flowerType ?? existing?.flowerType ?? 'pink_lotus',
            lastSeen: Date.now(),
          };
        });
        return next;
      });
    });

    // 신규 유저가 입장하며 현재 월드 상태를 요청할 때 응답 (State Handshake)
    channel.on('broadcast', { event: 'request-world-sync' }, () => {
      channel.send({
        type: 'broadcast',
        event: 'world-sync-response',
        payload: {
          orbs: orbsRef.current,
          spirits: spiritsRef.current,
          wishes: wishesRef.current,
        },
      });
    });

    channel.on('broadcast', { event: 'world-sync-response' }, ({ payload }) => {
      if (!payload) return;
      if (payload.orbs) {
        orbsRef.current = payload.orbs;
        setCollectedCount(
          (payload.orbs as RollingOrb[]).filter((o) => o.collected).length
        );
      }
      if (payload.spirits) {
        spiritsRef.current = payload.spirits;
        setSpirits(payload.spirits);
      }
      if (payload.wishes) {
        const synced = (payload.wishes as Wish[]).map((w) => ({
          ...w,
          isMine: false,
        }));
        setWishes(synced);
      }
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
          karma: payload.karma ?? prev[payload.id]?.karma ?? 0,
          flowerType:
            payload.flowerType ?? prev[payload.id]?.flowerType ?? 'pink_lotus',
          lastSeen: Date.now(),
        },
      }));
    });

    // 구슬별 주도권(ownerId)을 체크하여 내가 치고 있는 공은 덮어쓰지 않음 (떨림 방지)
    channel.on('broadcast', { event: 'orb-sync' }, ({ payload }) => {
      if (!payload || !payload.orbs) return;
      const incoming = payload.orbs as RollingOrb[];
      const merged = orbsRef.current.map((localOrb, idx) => {
        const remoteOrb = incoming[idx];
        if (!remoteOrb) return localOrb;
        if (
          localOrb.ownerId === myId &&
          Date.now() - (localOrb.updatedAt || 0) < 1200 &&
          !remoteOrb.collected
        ) {
          return localOrb;
        }
        return remoteOrb;
      });
      orbsRef.current = merged;
      setCollectedCount(merged.filter((o) => o.collected).length);
      if (payload.meteorTriggered) {
        onMeteorTriggered();
      }
    });

    channel.on('broadcast', { event: 'spirit-sync' }, ({ payload }) => {
      if (!payload || !payload.spirits) return;
      spiritsRef.current = payload.spirits;
      setSpirits(payload.spirits);
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
          karma: myKarma,
          flowerType: myFlowerType,
          x: myLatestCoordsRef.current.x,
          z: myLatestCoordsRef.current.z,
          rot: myLatestCoordsRef.current.rot,
        });
        // 입장 직후 기존 접속자에게 현재 구슬/액운 위치 요청
        channel.send({
          type: 'broadcast',
          event: 'request-world-sync',
          payload: {},
        });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    myNickname,
    myColor,
    myKarma,
    myFlowerType,
    orbsRef,
    spiritsRef,
    wishesRef,
    setSpirits,
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
          karma: myKarma,
          flowerType: myFlowerType,
        },
      });
    },
    [myNickname, myColor, myAction, myEmote, myKarma, myFlowerType]
  );

  const broadcastAction = useCallback(
    (action: PlayerAction, emote: string | null, nextKarma?: number) => {
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
          karma: nextKarma ?? myKarma,
          flowerType: myFlowerType,
        },
      });
    },
    [myNickname, myColor, myKarma, myFlowerType]
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

  const broadcastSpirits = useCallback((spirits: MisfortuneSpirit[]) => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'spirit-sync',
      payload: { spirits },
    });
  }, []);

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
    myId: myIdRef.current,
    remotePlayers,
    broadcastPosition,
    broadcastAction,
    broadcastOrbs,
    broadcastSpirits,
    broadcastWishes,
  };
};