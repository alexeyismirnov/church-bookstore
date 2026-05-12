// app/faithofsaints/FaithOfSaintsContent.tsx
// Client component for Faith of Saints episode list with auth and audio track selection

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/AuthContext';
import { useLanguage, useTranslations } from '../i18n/LanguageContext';
import { getEpisodes, getFaithOfSaintsVideoUrl } from '../lib/api';
import { Episode } from '../types';
import { Loader2, Play, ArrowLeft, X, ChevronLeft, ChevronRight } from 'lucide-react';

const AUDIO_OPTIONS = [
  { code: 'p', labelKey: 'mandarin' as const },
  { code: 'g', labelKey: 'cantonese' as const },
  { code: 'r', labelKey: 'russian' as const },
] as const;

function getDefaultAudio(locale: string): string {
  if (locale === 'ru') return 'r';      // Russian
  if (locale === 'zh-hant') return 'g';  // Cantonese
  return 'p';                             // Mandarin (default for en, zh-hans, etc.)
}

export default function FaithOfSaintsContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { locale } = useLanguage();
  const t = useTranslations('faithofsaints');
  const router = useRouter();

  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [fosAudio, setFosAudio] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('fos_audio');
      if (stored && ['p', 'g', 'r'].includes(stored)) return stored;
    }
    return getDefaultAudio(locale);
  });

  // Fetch episodes when auth is ready
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    async function fetchEpisodes() {
      try {
        setLoading(true);
        const data = await getEpisodes();
        setEpisodes(data);
      } catch (err) {
        console.error('Failed to fetch episodes:', err);
        setError(err instanceof Error ? err.message : t('error'));
      } finally {
        setLoading(false);
      }
    }

    fetchEpisodes();
  }, [authLoading, isAuthenticated]);

  // Handle audio track change
  const handleAudioChange = (newAudio: string) => {
    if (newAudio === fosAudio) return;
    setFosAudio(newAudio);
    localStorage.setItem('fos_audio', newAudio);
  };

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-burgundy" />
        <span className="ml-3 text-gray-500">{t('loading')}</span>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-2xl font-bold text-dark mb-4">{t('title')}</h1>
          <p className="text-gray-500 mb-6">{t('loginRequired')}</p>
          <Link href="/" className="btn-burgundy">
            {t('goHome')}
          </Link>
        </div>
      </div>
    );
  }

  // Loading episodes
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-burgundy" />
        <span className="ml-3 text-gray-500">{t('loading')}</span>
      </div>
    );
  }

  // Error loading episodes
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-2xl font-bold text-dark mb-4">{t('title')}</h1>
          <p className="text-red-500 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-burgundy"
          >
            {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-burgundy to-burgundy-dark py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-parchment font-display">
            {t('title')}
          </h1>

          {/* Audio Track Selector */}
          <div className="flex flex-col items-center">
            <span className="text-parchment/60 text-sm mb-2">{t('audioTrack')}</span>
            <div className="flex justify-center gap-3">
              {AUDIO_OPTIONS.map((option) => (
                <button
                  key={option.code}
                  onClick={() => handleAudioChange(option.code)}
                  className={`px-4 py-2 rounded-full border-2 text-sm transition-all ${
                    fosAudio === option.code
                      ? 'bg-parchment text-burgundy font-semibold border-parchment'
                      : 'border-parchment/40 text-parchment/70 hover:border-parchment/70 hover:text-parchment'
                  }`}
                >
                  {t(option.labelKey)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Episode List */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <tbody>
                {episodes.map((episode, index) => (
                  <tr
                    key={episode.num}
                    className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedEpisode(episode)}
                        className="flex items-center gap-4 group w-full text-left"
                      >
                        <span className="text-sm font-medium text-gray-400 w-8">
                          {index + 1}.
                        </span>
                        <span className="flex-grow text-dark group-hover:text-burgundy transition-colors">
                          {episode.title}
                        </span>
                        <Play className="w-5 h-5 text-burgundy opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {episodes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No episodes available.</p>
            </div>
          )}
        </div>
      </section>

      {/* Video Player Popup Modal */}
      {selectedEpisode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedEpisode(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-black rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelectedEpisode(null)}
              className="absolute top-2 right-2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Episode Title */}
            <div className="px-4 pt-4 pb-2 bg-gradient-to-b from-black/80 to-transparent">
              <h2 className="text-lg font-semibold text-white">
                {selectedEpisode.num}. {selectedEpisode.title}
              </h2>
            </div>

            {/* Video */}
            <video
              ref={videoRef}
              className="w-full aspect-video"
              controls
              autoPlay
              key={`${selectedEpisode.num}-${fosAudio}`}
            >
              <source
                src={getFaithOfSaintsVideoUrl(selectedEpisode.num, fosAudio)}
                type="video/mp4"
              />
              <p>
                To view this video please enable JavaScript, and consider upgrading to a
                web browser that supports HTML5 video.
              </p>
            </video>

            {/* Episode Navigation */}
            <div className="flex justify-between items-center px-4 py-3 bg-gray-900">
              {episodes.length > 0 && selectedEpisode.num > episodes[0].num ? (
                <button
                  type="button"
                  onClick={() => {
                    const prev = episodes.find((e) => e.num === selectedEpisode.num - 1);
                    if (prev) setSelectedEpisode(prev);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-sm font-medium text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t('previousEpisode')}
                </button>
              ) : (
                <div />
              )}

              {episodes.length > 0 && selectedEpisode.num < episodes[episodes.length - 1].num ? (
                <button
                  type="button"
                  onClick={() => {
                    const next = episodes.find((e) => e.num === selectedEpisode.num + 1);
                    if (next) setSelectedEpisode(next);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-sm font-medium text-white hover:bg-white/20 transition-colors"
                >
                  {t('nextEpisode')}
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <div />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
