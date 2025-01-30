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
    };
  }
}
