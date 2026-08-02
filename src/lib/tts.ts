import { createClient } from "@/lib/supabase/server";
import { extractSpeakableText } from "@/lib/cloze";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function generateHebrewAudioUrl(
  supabase: SupabaseServerClient,
  storagePrefix: string,
  text: string
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey || !text.trim()) return null;

  try {
    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: "he-IL", name: "he-IL-Standard-A" },
          audioConfig: { audioEncoding: "MP3" },
        }),
      }
    );
    if (!res.ok) {
      console.error("TTS request failed", res.status, await res.text());
      return null;
    }

    const { audioContent } = (await res.json()) as { audioContent?: string };
    if (!audioContent) {
      console.error("TTS response had no audioContent");
      return null;
    }

    const buffer = Buffer.from(audioContent, "base64");
    const path = `${storagePrefix}/${crypto.randomUUID()}.mp3`;

    const { error } = await supabase.storage
      .from("audio")
      .upload(path, buffer, { contentType: "audio/mpeg" });
    if (error) {
      console.error("TTS audio upload failed", error.message);
      return null;
    }

    const { data } = supabase.storage.from("audio").getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.error("TTS generation threw", err);
    return null;
  }
}

export async function generateFillBlankAudioUrls(
  supabase: SupabaseServerClient,
  segments: string[]
): Promise<(string | null)[]> {
  const urls: (string | null)[] = [];
  for (const segment of segments) {
    const speakable = extractSpeakableText(segment);
    urls.push(await generateHebrewAudioUrl(supabase, "fill-blanks", speakable));
  }
  return urls;
}
