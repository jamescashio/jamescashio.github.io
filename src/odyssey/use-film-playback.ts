import { useCallback, useEffect, useRef, useState, type RefObject, type VideoHTMLAttributes } from "react";
import type { FilmDefinition } from "./film-catalog";

type Playback = "still" | "loading" | "seeking" | "playing" | "paused" | "ended" | "error";
type SeekMedia = {
  player: HTMLVideoElement;
  source: string;
  controller: AbortController;
  kind: "native" | "blob";
  ranges: "unknown" | "supported" | "unavailable";
  url: string | null;
  loading: Promise<void> | null;
  target: number | null;
};

function canSeekTo(player: HTMLVideoElement, seconds: number) {
  const ranges = player.seekable;
  return Array.from({ length: ranges.length }, (_, index) => index).some(
    (index) => ranges.start(index) <= seconds && ranges.end(index) >= seconds,
  );
}

/** Owns explicit playback, seeking, cancellation and visibility; no ambient autoplay. */
export function useFilmPlayback(dialog: RefObject<HTMLDialogElement | null>, clip: FilmDefinition, motion: boolean) {
  const video = useRef<HTMLVideoElement>(null);
  const request = useRef(0);
  const playbackIntent = useRef<HTMLVideoElement | null>(null);
  const mounted = useRef(false);
  const pendingSeek = useRef<number | null>(null);
  const seekMedia = useRef<SeekMedia | null>(null);
  const [playback, setPlayback] = useState<Playback>("still");
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState<number>(clip.duration);
  const active = playback === "playing" || playback === "loading";
  const releaseSeekMedia = useCallback(() => {
    const previous = seekMedia.current;
    seekMedia.current = null;
    previous?.controller.abort();
    if (previous?.url) URL.revokeObjectURL(previous.url);
  }, []);

  const attachPlayer = useCallback(
    (player: HTMLVideoElement | null) => {
      if (video.current !== player) {
        request.current += 1;
        playbackIntent.current = null;
        video.current?.pause();
        releaseSeekMedia();
        video.current = player;
        pendingSeek.current = null;
      }
    },
    [releaseSeekMedia],
  );

  const pauseFilm = useCallback(() => {
    request.current += 1;
    playbackIntent.current = null;
    video.current?.pause();
    setPlayback((current) => (current === "playing" || current === "loading" ? "paused" : current));
  }, []);

  const isCurrentPlayer = useCallback(
    (player: HTMLVideoElement) => {
      return mounted.current && player === video.current && dialog.current?.open;
    },
    [dialog],
  );

  const failMedia = useCallback(
    (player: HTMLVideoElement) => {
      if (!isCurrentPlayer(player)) return;
      request.current += 1;
      pendingSeek.current = null;
      playbackIntent.current = null;
      seekMedia.current?.controller.abort();
      player.pause();
      setPlayback("error");
    },
    [isCurrentPlayer],
  );

  const playRequested = useCallback(
    async (player: HTMLVideoElement, generation: number) => {
      try {
        if (seekMedia.current?.player === player) seekMedia.current.target = null;
        await player.play();
        if (!isCurrentPlayer(player) || document.hidden || playbackIntent.current !== player) player.pause();
      } catch {
        if (isCurrentPlayer(player) && generation === request.current) {
          playbackIntent.current = null;
          setPlayback("error");
        }
      }
    },
    [isCurrentPlayer],
  );

  const prepareSeekFallback = useCallback(
    (player: HTMLVideoElement, prepared: SeekMedia): Promise<void> => {
      if (prepared.loading) return prepared.loading;
      prepared.loading = (async () => {
        try {
          // Probe only after an explicit seek has loaded native metadata. A
          // byte-range host must keep its native URL, including under a CSP
          // that permits same-origin media but intentionally excludes Blobs.
          const response = await fetch(prepared.source, {
            signal: prepared.controller.signal,
            credentials: "same-origin",
            // A cached full response can synthesize206 locally even when the
            // server ignores ranges. Probe the host, not that browser cache.
            cache: "no-store",
            headers: { Range: "bytes=0-0" },
          });
          if (!response.ok) throw new Error("Film download failed");
          if (response.status === 206) {
            prepared.ranges = "supported";
            await response.body?.cancel();
            return;
          }
          if (response.status !== 200) throw new Error("Unknown film range response");
          prepared.ranges = "unavailable";
          const maximum = 8 * 1024 * 1024;
          if (Number(response.headers.get("content-length")) > maximum) throw new Error("Film exceeds seek budget");
          const blob = await response.blob();
          if (!blob.size || blob.size > maximum) throw new Error("Invalid film size");
          if (
            seekMedia.current !== prepared ||
            prepared.controller.signal.aborted ||
            !isCurrentPlayer(player) ||
            pendingSeek.current === null
          )
            return;
          // Native ranges can become available while the probe is in flight.
          // Keep that functioning timeline instead of replacing its source.
          if (canSeekTo(player, pendingSeek.current)) {
            prepared.ranges = "supported";
            return;
          }
          prepared.url = URL.createObjectURL(new Blob([blob], { type: "video/mp4" }));
          prepared.kind = "blob";
          player.src = prepared.url;
          player.preload = "auto";
          player.load();
        } catch {
          if (
            seekMedia.current === prepared &&
            !prepared.controller.signal.aborted &&
            isCurrentPlayer(player) &&
            pendingSeek.current !== null
          )
            failMedia(player);
        } finally {
          prepared.loading = null;
        }
      })();
      return prepared.loading;
    },
    [isCurrentPlayer, failMedia],
  );

  // Stable ref-reading callbacks let visibility resume a manual frame request
  // without restarting the modal or reviving a cancelled playback request.
  const finishPendingSeek = useCallback(
    function finish(player: HTMLVideoElement) {
      const target = pendingSeek.current;
      const prepared = seekMedia.current;
      if (target === null || !isCurrentPlayer(player) || !prepared || prepared.player !== player) return;
      // A successful range probe does not repair a native decoding/network
      // failure. Surface it even if the player has no metadata to finish with.
      if (player.error) {
        failMedia(player);
        return;
      }
      if (
        document.hidden ||
        player.currentSrc !== (prepared.url ?? prepared.source) ||
        player.readyState < 1 ||
        !Number.isFinite(player.duration) ||
        player.seeking
      )
        return;
      const seconds = Math.max(0, Math.min(target, player.duration - 0.04));
      // Once this native seek has completed, accept the browser's decoded clock.
      // Reassigning currentTime to correct millisecond drift can seek forever.
      if (prepared.target !== seconds && Math.abs(player.currentTime - seconds) > 0.001) {
        if (canSeekTo(player, seconds)) {
          if (prepared.kind === "native") prepared.ranges = "supported";
          prepared.target = seconds;
          player.currentTime = seconds;
        } else if (prepared.kind === "native" && prepared.ranges !== "supported" && !prepared.loading) {
          void prepareSeekFallback(player, prepared).then(() => finish(player));
        }
        return;
      }
      if (player.readyState < 2) return;
      pendingSeek.current = null;
      setElapsed(seconds);
      if (playbackIntent.current === player) {
        setPlayback("loading");
        void playRequested(player, request.current);
      } else setPlayback("paused");
    },
    [isCurrentPlayer, playRequested, prepareSeekFallback, failMedia],
  );

  useEffect(() => {
    mounted.current = true;
    const visibility = () => {
      if (document.hidden) pauseFilm();
      else if (video.current) finishPendingSeek(video.current);
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      mounted.current = false;
      request.current += 1;
      playbackIntent.current = null;
      video.current?.pause();
      pendingSeek.current = null;
      releaseSeekMedia();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [pauseFilm, releaseSeekMedia, finishPendingSeek]);
  useEffect(() => {
    if (!motion) pauseFilm();
  }, [motion, pauseFilm]);

  function resetPlayback(seconds: number) {
    pauseFilm();
    pendingSeek.current = null;
    releaseSeekMedia();
    setPlayback("still");
    setElapsed(0);
    setDuration(seconds);
  }
  function prepareSeekMedia(player: HTMLVideoElement) {
    const previous = seekMedia.current;
    if (previous?.player === player && !player.error && !previous.controller.signal.aborted) return;
    const restoreSource = Boolean(player.error || previous?.url);
    releaseSeekMedia();
    const source = new URL(clip.film, location.href);
    if (source.origin !== location.origin) return;
    seekMedia.current = {
      player,
      source: source.href,
      controller: new AbortController(),
      kind: "native",
      ranges: "unknown",
      url: null,
      loading: null,
      target: null,
    };
    // Explicit seeking opts into native loading once. Subsequent chapter or
    // scrub requests reuse a healthy load; a failed preparation starts fresh.
    if (restoreSource) player.src = source.href;
    player.preload = "auto";
    if (restoreSource || player.readyState === 0) player.load();
  }

  function seekFilm(seconds: number) {
    const player = video.current;
    if (!player || document.hidden || !dialog.current?.open) return;
    pauseFilm();
    const target = Math.max(0, Math.min(duration - 0.04, seconds));
    pendingSeek.current = target;
    setElapsed(target);
    setPlayback("seeking");
    prepareSeekMedia(player);
    if (seekMedia.current) seekMedia.current.target = null;
    finishPendingSeek(player);
  }

  function displayTime(player: HTMLVideoElement) {
    const prepared = seekMedia.current;
    // Keep the requested position while paused so 0.01-second arrow steps
    // accumulate independently of the decoder's clock precision.
    return player.paused && prepared?.player === player ? (prepared.target ?? player.currentTime) : player.currentTime;
  }

  async function togglePlayback() {
    const player = video.current;
    if (!player || document.hidden || !dialog.current?.open) return;
    if (active) {
      pauseFilm();
      return;
    }
    const generation = ++request.current;
    playbackIntent.current = player;
    setPlayback("loading");
    if (pendingSeek.current !== null) {
      prepareSeekMedia(player);
      finishPendingSeek(player);
      return;
    }
    if (player.error) player.load();
    if (player.ended) player.currentTime = 0;
    await playRequested(player, generation);
  }

  const label = active
    ? "Pause film"
    : playback === "ended"
      ? "Replay film"
      : playback === "error"
        ? "Try again"
        : "Play film";
  const status =
    playback === "error"
      ? "The film could not load. Please try again."
      : playback === "seeking"
        ? "Finding your frame…"
        : playback === "loading"
          ? "Loading the film…"
          : playback === "playing"
            ? "Playing. No sound."
            : playback === "paused"
              ? "Paused. Continue when you choose."
              : playback === "ended"
                ? "End of film. Replay when you choose."
                : `${clip.title}. Ready when you press Play. No sound.`;

  const mediaEvents: VideoHTMLAttributes<HTMLVideoElement> = {
    onPlaying: (event) => {
      const player = event.currentTarget;
      if (
        !isCurrentPlayer(player) ||
        playbackIntent.current !== player ||
        pendingSeek.current !== null ||
        document.hidden
      )
        player.pause();
      else if (!player.paused) setPlayback("playing");
    },
    onPause: (event) => {
      if (isCurrentPlayer(event.currentTarget) && event.currentTarget.paused && pendingSeek.current === null)
        setPlayback((current) => (current === "playing" || current === "loading" ? "paused" : current));
    },
    onWaiting: (event) => {
      if (isCurrentPlayer(event.currentTarget) && !event.currentTarget.paused) setPlayback("loading");
    },
    onEnded: (event) => {
      if (isCurrentPlayer(event.currentTarget) && event.currentTarget.ended && pendingSeek.current === null) {
        playbackIntent.current = null;
        setPlayback("ended");
      }
    },
    onError: (event) => {
      // load() clears the previous MediaError when changing sources;
      // a current error is real even while a range probe is pending.
      if (event.currentTarget.error) failMedia(event.currentTarget);
    },
    onTimeUpdate: (event) => {
      if (isCurrentPlayer(event.currentTarget)) {
        if (pendingSeek.current !== null) finishPendingSeek(event.currentTarget);
        else setElapsed(displayTime(event.currentTarget));
      }
    },
    onSeeked: (event) => {
      const player = event.currentTarget;
      if (isCurrentPlayer(player)) {
        if (pendingSeek.current !== null) finishPendingSeek(player);
        else if (player.paused && playbackIntent.current !== player) {
          setElapsed(displayTime(player));
          setPlayback("paused");
        }
      }
    },
    onLoadedData: (event) => finishPendingSeek(event.currentTarget),
    onCanPlay: (event) => finishPendingSeek(event.currentTarget),
    onProgress: (event) => finishPendingSeek(event.currentTarget),
    onSuspend: (event) => finishPendingSeek(event.currentTarget),
    onLoadedMetadata: (event) => {
      const player = event.currentTarget;
      const seconds = player.duration;
      if (isCurrentPlayer(player) && Number.isFinite(seconds) && seconds > 0) {
        setDuration(seconds);
        finishPendingSeek(player);
      }
    },
  };
  return {
    attachPlayer,
    mediaEvents,
    active,
    playback,
    elapsed,
    duration,
    pauseFilm,
    resetPlayback,
    seekFilm,
    togglePlayback,
    label,
    status,
  };
}
