"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Tournament, Player } from "@/types/game";

interface UseGameSyncOptions {
  tournamentId: string | null;
  playerId?: string | null;
}

export function useGameSync({ tournamentId, playerId }: UseGameSyncOptions) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);

  // Fetch initial data
  useEffect(() => {
    if (!tournamentId) return;

    const fetchData = async () => {
      const [tournamentRes, playersRes] = await Promise.all([
        supabase.from("tournaments").select().eq("id", tournamentId).single(),
        supabase
          .from("players")
          .select()
          .eq("tournament_id", tournamentId)
          .order("score", { ascending: false }),
      ]);

      if (tournamentRes.data) setTournament(tournamentRes.data);
      if (playersRes.data) {
        setPlayers(playersRes.data);
        if (playerId) {
          const me = playersRes.data.find((p) => p.id === playerId);
          if (me) setMyPlayer(me);
        }
      }
    };

    fetchData();
  }, [tournamentId, playerId]);

  // Realtime subscription for tournament changes
  useEffect(() => {
    if (!tournamentId) return;

    const channel = supabase
      .channel(`tournament-${tournamentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tournaments",
          filter: `id=eq.${tournamentId}`,
        },
        (payload) => {
          if (payload.new) {
            setTournament(payload.new as Tournament);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `tournament_id=eq.${tournamentId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setPlayers((prev) => [...prev, payload.new as Player]);
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Player;
            setPlayers((prev) =>
              prev
                .map((p) => (p.id === updated.id ? updated : p))
                .sort((a, b) => b.score - a.score)
            );
            if (playerId && updated.id === playerId) {
              setMyPlayer(updated);
            }
          } else if (payload.eventType === "DELETE") {
            const old = payload.old as { id: string };
            setPlayers((prev) => prev.filter((p) => p.id !== old.id));
          }
        }
      )
      .subscribe(async (status) => {
        // Re-fetch tournament immediately after subscribing to close the
        // race-condition window where status changes could be missed
        if (status === "SUBSCRIBED") {
          const { data } = await supabase
            .from("tournaments")
            .select()
            .eq("id", tournamentId)
            .single();
          if (data) setTournament(data);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId, playerId]);

  const refreshPlayers = useCallback(async () => {
    if (!tournamentId) return;
    const { data } = await supabase
      .from("players")
      .select()
      .eq("tournament_id", tournamentId)
      .order("score", { ascending: false });
    if (data) setPlayers(data);
  }, [tournamentId]);

  return {
    tournament,
    players,
    myPlayer,
    refreshPlayers,
  };
}
