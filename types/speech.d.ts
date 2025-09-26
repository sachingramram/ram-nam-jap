// Minimal Web Speech API typings for TS projects (browser-only).
// Avoids using `any` while keeping it lightweight.

declare class SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;

  onaudiostart?: (ev: Event) => void;
  onresult?: (ev: SpeechRecognitionEvent) => void;
  onerror?: (ev: SpeechRecognitionErrorEvent) => void;
  onend?: (ev: Event) => void;
}

declare interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare interface SpeechRecognitionResult {
  length: number;
  isFinal: boolean;
  0: SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

declare interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

declare interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

declare interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare interface Window {
  webkitSpeechRecognition?: { new (): SpeechRecognition };
  SpeechRecognition?: { new (): SpeechRecognition };
}
