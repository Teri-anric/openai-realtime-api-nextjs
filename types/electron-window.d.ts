export {};

declare global {
  interface Window {
    electron?: {
      clipboard: {
        writeText: (
          text: string
        ) => Promise<{ success: boolean; error?: string }>;
        writeAndPaste: (
          text: string
        ) => Promise<{ success: boolean; error?: string }>;
        writeAndEnter: (
          text: string
        ) => Promise<{ success: boolean; error?: string }>;
        readText: () => Promise<{
          success: boolean;
          text?: string;
          error?: string;
        }>;
      };
      keyboard: {
        pressEnter: () => Promise<{ success: boolean; error?: string }>;
      };
      system: {
        test: () => Promise<{
          success: boolean;
          output?: string;
          error?: string;
        }>;
        openSpotify: () => Promise<{ success: boolean; error?: string }>;
        controlMusic: (
          action: "play" | "pause"
        ) => Promise<{ success: boolean; error?: string }>;
        adjustVolume: (
          percentage: number
        ) => Promise<{ success: boolean; error?: string }>;
        adjustSystemVolume: (
          percentage: number
        ) => Promise<{ success: boolean; error?: string }>;
      };
    };
  }
}
