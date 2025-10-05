declare global {
  interface Window {
    gtag?: (
      command: "config" | "event" | "set",
      targetId: string,
      config?: {
        description?: string;
        fatal?: boolean;
        [key: string]: any;
      }
    ) => void;
  }
}

export {};