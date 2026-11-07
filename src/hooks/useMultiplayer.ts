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
  GardenDecorMap,
} from '../types/wish';

interface UseMultiplayerProps {
  roomName: string;
  myNickname: string;
  myColor: string;
  myAction: PlayerAction;
  myEmote: string | null;
  myKarma: number;
  myFlowerType: FlowerType;
  orbsRef: React.MutableRefObject<RollingOrb[]>;
  spiritsRef: React.MutableRefObject<MisfortuneSpirit[]>;
  wishesRef: React.MutableRefObject<Wish[]>;
  decorLayoutRef: React.MutableRefObject<GardenDecorMap>;
  setSpirits: React.Dispatch<React.SetStateAction<MisfortuneSpirit[]>>;
  setCollectedCount: (count: number) => void;
  onMeteorTriggered: () => void;
  onRemoteAscension?: (nickname: string) => void;
  onRemoteDecorSync?: (layout: GardenDecorMap) => void;
  setWishes: React.Dispatch<React.SetStateAction<Wish[]>>;
  setBannerMessage: (msg: string | null) => void;
  setIsNightMode: (night: boolean) => void;
  onSpiritReward?: (contributors: string[], reward: number, isBoss: boolean) => void;
}

export const useMultiplayer = ({
  roomName,
  myNickname,
  myColor,
  myAction,
  myEmote,
  myKarma,
  myFlowerType,
  orbsRef,
  spiritsRef,
  wishesRef,
  decorLayoutRef,
  setSpirits,
  setCollectedCount,
  onMeteorTriggered,
  onRemoteAscension,
  onRemoteDecorSync,
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

  const latestProfileRef = useRef({
    nickname: myNickname,
    color: myColor,
    action: myAction,
    emote: myEmote,
    karma: myKarma,
    flowerType: myFlowerType,
  });

  useEffect(() => {
    latestProfileRef.current = {
      nickname: myNickname,
      color: myColor,
      action: myAction,
      emote: myEmote,
      karma: myKarma,
      flowerType: myFlowerType,
    };
  }, [myNickname, myColor, myAction, myEmote, myKarma, myFlowerType]);

  useEffect(() => {
    const myId = myIdRef.current;
    setRemotePlayers({});

    const channel = supabase.channel(roomName, {
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

    channel.on('broadcast', { event: 'request-world-sync' }, () => {
      channel.send({
        type: 'broadcast',
        event: 'world-sync-response',
        payload: {
          orbs: orbsRef.current,
          spirits: spiritsRef.current,
          wishes: wishesRef.current,
          decorLayout: decorLayoutRef.current,
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
      if (payload.decorLayout && onRemoteDecorSync) {
        onRemoteDecorSync(payload.decorLayout);
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
          emote:
            payload.emote !== undefined
              ? payload.emote
              : prev[payload.id]?.emote ?? null,
          karma: payload.karma ?? prev[payload.id]?.karma ?? 0,
          flowerType:
            payload.flowerType ?? prev[payload.id]?.flowerType ?? 'pink_lotus',
          lastSeen: Date.now(),
        },
      }));
    });

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
      if (payload.rewardContributors && onSpiritReward) {
        onSpiritReward(
          payload.rewardContributors,
          payload.rewardAmount || 1,
          Boolean(payload.bossDefeated)
        );
      }
      if (payload.bossDefeated) {
        onMeteorTriggered();
      }
    });

    channel.on('broadcast', { event: 'garden-decor-sync' }, ({ payload }) => {
      if (!payload || !payload.decorLayout || !onRemoteDecorSync) return;
      onRemoteDecorSync(payload.decorLayout);
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
      if (payload.ascendingNickname && onRemoteAscension) {
        onRemoteAscension(payload.ascendingNickname);
      }
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const prof = latestProfileRef.current;
        await channel.track({
          id: myId,
          nickname: prof.nickname,
          color: prof.color,
          karma: prof.karma,
          flowerType: prof.flowerType,
          x: myLatestCoordsRef.current.x,
          z: myLatestCoordsRef.current.z,
          rot: myLatestCoordsRef.current.rot,
        });
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
    roomName,
    myNickname,
    myColor,
    orbsRef,
    spiritsRef,
    wishesRef,
    decorLayoutRef,
    setSpirits,
    setCollectedCount,
    onMeteorTriggered,
    onRemoteAscension,
    onRemoteDecorSync,
    setWishes,
    setBannerMessage,
    setIsNightMode,
  ]);

  const broadcastPosition = useCallback(
    (coords: { x: number; z: number; rot: number; isMoving: boolean }) => {
      myLatestCoordsRef.current = coords;
      if (!channelRef.current) return;
      const prof = latestProfileRef.current;
      channelRef.current.send({
        type: 'broadcast',
        event: 'player-move',
        payload: {
          id: myIdRef.current,
          nickname: prof.nickname,
          color: prof.color,
          ...coords,
          action: prof.action,
          emote: prof.emote,
          karma: prof.karma,
          flowerType: prof.flowerType,
        },
      });
    },
    []
  );

  const broadcastAction = useCallback(
    (action: PlayerAction, emote: string | null, nextKarma?: number) => {
      if (!channelRef.current) return;
      const prof = latestProfileRef.current;
      channelRef.current.send({
        type: 'broadcast',
        event: 'player-move',
        payload: {
          id: myIdRef.current,
          nickname: prof.nickname,
          color: prof.color,
          ...myLatestCoordsRef.current,
          action,
          emote,
          karma: nextKarma ?? prof.karma,
          flowerType: prof.flowerType,
        },
      });
    },
    []
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

const broadcastSpirits = useCallback(
    (
      spirits: MisfortuneSpirit[],
      bossDefeated = false,
      rewardContributors?: string[],
      rewardAmount?: number
    ) => {
      if (!channelRef.current) return;
      channelRef.current.send({
        type: 'broadcast',
        event: 'spirit-sync',
        payload: {
          spirits,
          bossDefeated,
          rewardContributors,
          rewardAmount,
        },
      });
    },
    []
  );

  const broadcastGardenDecor = useCallback((decorLayout: GardenDecorMap) => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'garden-decor-sync',
      payload: { decorLayout },
    });
  }, []);

  const broadcastWishes = useCallback(
    (
      nextWishes: Wish[],
      banner?: string,
      nightMode?: boolean,
      ascendingNickname?: string
    ) => {
      if (!channelRef.current) return;
      channelRef.current.send({
        type: 'broadcast',
        event: 'wish-sync',
        payload: {
          wishes: nextWishes,
          banner,
          nightMode,
          ascendingNickname,
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
    broadcastGardenDecor,
    broadcastWishes,
  };
};