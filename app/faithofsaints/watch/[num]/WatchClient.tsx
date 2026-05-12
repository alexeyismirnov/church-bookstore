// app/faithofsaints/watch/[num]/WatchClient.tsx
// Client component for Faith of Saints video player

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/AuthContext';
import { useLanguage, useTranslations } from '../../../i18n/LanguageContext';
import { getEpisodes, getFaithOfSaintsVideoUrl } from '../../../lib/api';
import { Episode } from '../../../types';
import { Loader2, ArrowLeft } from 'lucide-react';

interface WatchClientProps {
  episodeNum: number;
}

function getDefaultAudio(locale: string): string {
  if (locale === 'ru') return 'r';      // Russian
  if (locale === 'zh-hant') return 'g';  // Cantonese
  return 'p';                             // Mandarin (default for en, zh-hans, etc.)
}

export default function WatchClient({ episodeNum }: WatchClientProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { locale } = useLanguage();
  const t = useTranslations('faithofsaints');
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fosAudio, setFosAudio] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('fos_audio');
      if (stored && ['p', 'g', 'r'].includes(stored)) return stored;
    }
    return getDefaultAudio(locale);
  });

  // Find the current episode title
  const currentEpisode = episodes.find((e) => e.num === episodeNum);
  const episodeTitle = currentEpisode?.title || t('episode', { num: episodeNum });
  const videoUrl = getFaithOfSaintsVideoUrl(episodeNum, fosAudio);

  // Fetch episodes to get the title
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

  // Loading episode data
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-burgundy" />
        <span className="ml-3 text-gray-500">{t('loading')}</span>
      </div>
    );
  }

  // Error
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          href="/faithofsaints"
          className="inline-flex items-center gap-2 text-burgundy hover:underline mb-6 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('back')}
        </Link>

        {/* Episode Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-dark mb-6">
          {episodeNum}. {episodeTitle}
        </h1>

        {/* Video Player */}
        <div className="bg-black rounded-xl overflow-hidden shadow-lg">
          <video
            ref={videoRef}
            className="w-full aspect-video"
            controls
            autoPlay
          >
            <source src={videoUrl} type="video/mp4" />
            <p>
              To view this video please enable JavaScript, and consider upgrading to a
              web browser that supports HTML5 video.
            </p>
          </video>
        </div>

        {/* Episode Navigation */}
        <div className="flex justify-between items-center mt-6">
          {episodes.length > 0 && episodeNum > episodes[0].num ? (
            <Link
              href={`/faithofsaints/watch/${episodeNum - 1}`}
              className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous Episode
            </Link>
          ) : (
            <div />
          )}

          {episodes.length > 0 && episodeNum < episodes[episodes.length - 1].num ? (
            <Link
              href={`/faithofsaints/watch/${episodeNum + 1}`}
              className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Next Episode
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}
