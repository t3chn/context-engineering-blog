/**
 * HeyGen Avatar Video Integration
 * Creates talking avatar videos with custom audio from ElevenLabs
 */

export interface HeyGenConfig {
  apiKey: string;
}

export interface HeyGenAvatarConfig {
  avatarId: string;
  avatarStyle?: "normal" | "circle" | "closeUp";
  scale?: number; // 0.5 - 1.0
}

export interface HeyGenVideoRequest {
  audioUrl: string; // URL to audio file (from ElevenLabs)
  text?: string; // Fallback text if no audio
  avatar: HeyGenAvatarConfig;
  dimension?: {
    width: number;
    height: number;
  };
  backgroundColor?: string;
  caption?: boolean;
  test?: boolean; // Use test mode (watermarked, no credits)
}

export interface HeyGenVideoResponse {
  videoId: string;
  status: "pending" | "processing" | "completed" | "failed";
  videoUrl?: string;
  error?: string;
}

export interface HeyGenAvatar {
  avatarId: string;
  avatarName: string;
  previewImageUrl: string;
  previewVideoUrl?: string;
}

const HEYGEN_API_BASE = "https://api.heygen.com";

/**
 * Creates HeyGen API client
 */
export function createHeyGenClient(config: HeyGenConfig) {
  const headers = {
    "X-Api-Key": config.apiKey,
    "Content-Type": "application/json",
  };

  return {
    /**
     * List available avatars
     */
    async listAvatars(): Promise<HeyGenAvatar[]> {
      const response = await fetch(`${HEYGEN_API_BASE}/v2/avatars`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(`HeyGen API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.data?.avatars || [];
    },

    /**
     * List available voices
     */
    async listVoices(): Promise<Array<{ voiceId: string; name: string; language: string }>> {
      const response = await fetch(`${HEYGEN_API_BASE}/v2/voices`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(`HeyGen API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.data?.voices || [];
    },

    /**
     * Upload audio file to get asset ID
     */
    async uploadAudio(audioBuffer: Buffer, filename: string): Promise<string> {
      const formData = new FormData();
      formData.append("file", new Blob([audioBuffer]), filename);

      const response = await fetch(`${HEYGEN_API_BASE}/v1/asset`, {
        method: "POST",
        headers: {
          "X-Api-Key": config.apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HeyGen upload error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.data?.asset_id || data.data?.id;
    },

    /**
     * Create avatar video with custom audio
     */
    async createVideo(request: HeyGenVideoRequest): Promise<HeyGenVideoResponse> {
      const payload = {
        video_inputs: [
          {
            character: {
              type: "avatar",
              avatar_id: request.avatar.avatarId,
              avatar_style: request.avatar.avatarStyle || "normal",
              scale: request.avatar.scale || 1.0,
            },
            voice: {
              type: "audio",
              audio_url: request.audioUrl,
            },
            background: {
              type: "color",
              value: request.backgroundColor || "#0a0a0a",
            },
          },
        ],
        dimension: request.dimension || {
          width: 720,
          height: 1280,
        },
        caption: request.caption ?? false,
        test: request.test ?? false,
      };

      const response = await fetch(`${HEYGEN_API_BASE}/v2/video/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HeyGen API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (data.error) {
        return {
          videoId: "",
          status: "failed",
          error: data.error.message || data.error,
        };
      }

      return {
        videoId: data.data?.video_id,
        status: "pending",
      };
    },

    /**
     * Check video generation status
     */
    async getVideoStatus(videoId: string): Promise<HeyGenVideoResponse> {
      const response = await fetch(`${HEYGEN_API_BASE}/v1/video_status.get?video_id=${videoId}`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(`HeyGen API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const videoData = data.data;

      return {
        videoId,
        status: videoData?.status || "pending",
        videoUrl: videoData?.video_url,
        error: videoData?.error,
      };
    },

    /**
     * Wait for video to complete (polling)
     */
    async waitForVideo(
      videoId: string,
      options?: {
        pollInterval?: number; // ms, default 5000
        timeout?: number; // ms, default 300000 (5 min)
        onProgress?: (status: string) => void;
      }
    ): Promise<HeyGenVideoResponse> {
      const pollInterval = options?.pollInterval || 5000;
      const timeout = options?.timeout || 300000;
      const startTime = Date.now();

      while (Date.now() - startTime < timeout) {
        const status = await this.getVideoStatus(videoId);

        options?.onProgress?.(status.status);

        if (status.status === "completed") {
          return status;
        }

        if (status.status === "failed") {
          throw new Error(`Video generation failed: ${status.error}`);
        }

        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }

      throw new Error("Video generation timeout");
    },
  };
}

/**
 * Get HeyGen config from environment
 */
export function getHeyGenConfigFromEnv(): HeyGenConfig | null {
  const apiKey = process.env.HEYGEN_API_KEY;

  if (!apiKey) {
    return null;
  }

  return { apiKey };
}

/**
 * Upload audio buffer to a public hosting service
 * Returns a publicly accessible URL
 *
 * Note: HeyGen requires a publicly accessible URL for custom audio.
 * This function uploads to catbox.moe which provides permanent hosting.
 * For production, consider using your own cloud storage (S3, R2, etc.)
 */
export async function uploadAudioToPublicHost(audioBuffer: Buffer): Promise<string> {
  const formData = new FormData();
  formData.append("reqtype", "fileupload");
  formData.append("fileToUpload", new Blob([audioBuffer], { type: "audio/mpeg" }), "audio.mp3");

  const response = await fetch("https://catbox.moe/user/api.php", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Audio upload failed: ${response.status} ${response.statusText}`);
  }

  const url = await response.text();

  if (!url.startsWith("http")) {
    throw new Error(`Audio upload failed: ${url}`);
  }

  return url;
}

/**
 * Default avatar configurations for quick setup
 */
export const DEFAULT_AVATARS = {
  marcus: {
    avatarId: "Marcus_expressive_2024120201",
    avatarStyle: "normal" as const,
    scale: 1.0,
  },
  jonas: {
    avatarId: "Jonas_expressive_2024120201",
    avatarStyle: "normal" as const,
    scale: 1.0,
  },
  max: {
    avatarId: "Max_expressive_2024120201",
    avatarStyle: "normal" as const,
    scale: 1.0,
  },
} as const;
