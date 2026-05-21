// app/faithofsaints/watch/[num]/page.tsx
// Faith of Saints watch page - uses client component for video playback

import WatchClient from './WatchClient';

interface WatchPageProps {
  params: Promise<{ num: string }>;
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { num } = await params;

  return <WatchClient episodeNum={parseInt(num, 10)} />;
}
