"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Microphone } from "@phosphor-icons/react";

interface ChatInputBarProps {
  onSend: (content: string, type?: string) => void;
  disabled?: boolean;
}

const isSpeechSupported =
  typeof window !== "undefined" &&
  ((window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition);

export default function ChatInputBar({ onSend, disabled }: ChatInputBarProps) {
  const [value, setValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const accRef = useRef("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      stopRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
  }, [value, interimTranscript, isRecording]);

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    stopRecording();
    onSend(trimmed, "text");
    setValue("");
  }

  const displayValue = isRecording
    ? [value, interimTranscript].filter(Boolean).join(" ")
    : value;

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function stopRecording() {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    isRecordingRef.current = false;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    setInterimTranscript("");
  }

  async function startRecording() {
    setError(null);
    if (!isSpeechSupported) {
      setError("Reconnaissance vocale non supportée dans ce navigateur.");
      return;
    }

    const SR =
      (window as any).SpeechRecognition ??
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      setError("Reconnaissance vocale non supportée dans ce navigateur.");
      return;
    }

    let recognition: any;
    try {
      recognition = new SR();
    } catch {
      setError("Impossible de démarrer la reconnaissance vocale.");
      return;
    }

    recognition.lang = "fr-FR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          const trimmedTranscript = transcript.trim();
          if (trimmedTranscript) {
            accRef.current = (accRef.current + " " + trimmedTranscript).trim();
            setValue((prev) =>
              prev ? `${prev} ${trimmedTranscript}` : trimmedTranscript,
            );
          }
        } else {
          interim += transcript;
        }
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      const fatalErrors = [
        "network",
        "service-not-allowed",
        "not-allowed",
        "audio-capture",
      ];
      if (fatalErrors.includes(event.error)) {
        stopRecording();
        setError("Erreur de microphone. Vérifiez les autorisations.");
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      isRecordingRef.current = false;
      setIsRecording(false);
      accRef.current = "";
      setInterimTranscript("");
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
    } catch {
      setError("Impossible de démarrer la reconnaissance vocale.");
      return;
    }

    timerRef.current = setInterval(() => {
      if (!recognitionRef.current) return;
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }, 90000);
  }

  function handleVoiceToggle() {
    if (isRecording) {
      stopRecording();
      return;
    }
    startRecording();
  }

  return (
    <div className="shrink-0 bg-[#080808] px-3 py-2.5">
      <div className="flex items-center gap-2">
        <button
          onClick={handleVoiceToggle}
          disabled={disabled}
          className={`h-9 w-9 flex items-center justify-center rounded-xl transition-colors shrink-0 ${isRecording ? "bg-[#1f8a65] text-black" : "bg-[#1a1a1a] text-[#5a5a5a] hover:bg-[#222222]"}`}
          aria-label={
            isRecording
              ? "Arrêter l'enregistrement vocal"
              : "Démarrer la saisie vocale"
          }
        >
          <Microphone size={18} />
        </button>

        <textarea
          ref={textareaRef}
          value={displayValue}
          onChange={(e) => {
            if (isRecording) {
              stopRecording();
            }
            setValue(e.target.value);
          }}
          onKeyDown={handleKey}
          placeholder="Écrire un message..."
          disabled={disabled}
          rows={1}
          wrap="soft"
          className="flex-1 min-w-0 min-h-[42px] max-h-40 resize-none overflow-hidden bg-[#111111] rounded-xl px-3.5 py-2 text-[13px] font-barlow text-[#e0e0e0] placeholder-[#5a5a5a] outline-none transition-colors disabled:opacity-50"
        />

        <button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-[#f2f2f2] text-[#080808] disabled:opacity-30 active:scale-95 transition-all shrink-0"
          aria-label="Envoyer"
        >
          <ArrowRight size={16} weight="bold" />
        </button>
      </div>

      {error && (
        <div className="mt-2 px-2 text-[11px] leading-5 text-[#c7c7c7]">
          <p className="text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
