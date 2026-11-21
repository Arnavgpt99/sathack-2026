import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url")?.trim();

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  const isYouTube = /youtu\.?be/i.test(targetUrl);

  if (isYouTube) {
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(targetUrl)}&format=json`;
      const res = await fetch(oembedUrl, {
        headers: { "User-Agent": "Reelix/1.0" },
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({
          title: data.title || "YouTube Video",
          channel: data.author_name || "YouTube Creator",
          platform: "YouTube",
          thumbnail: data.thumbnail_url || null,
        });
      }
    } catch {
      // Fall through to generic response
    }

    return NextResponse.json({
      title: "YouTube Video",
      channel: "YouTube",
      platform: "YouTube",
      thumbnail: null,
    });
  }

  if (/vimeo\.com/i.test(targetUrl)) {
    return NextResponse.json({
      title: "Vimeo Video",
      channel: "Vimeo Creator",
      platform: "Vimeo",
      thumbnail: null,
    });
  }

  return NextResponse.json({
    title: "Video Stream",
    channel: "External Source",
    platform: "Web Video",
    thumbnail: null,
  });
}
