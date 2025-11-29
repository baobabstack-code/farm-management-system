"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (window as any).webkitSpeechRecognition
    ) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        handleVoiceQuery(text);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript("");
      setResponse("");
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleVoiceQuery = async (text: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error("Failed to process voice query");

      const data = await res.json();
      setResponse(data.text);

      if (data.audio) {
        playAudio(data.audio);
      }
    } catch (error) {
      console.error(error);
      setResponse("Sorry, I couldn't process that.");
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = (base64Audio: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
    audioRef.current = audio;

    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);

    audio.play().catch((e) => console.error("Audio play error:", e));
  };

  if (!recognitionRef.current) {
    return null; // Browser doesn't support speech recognition
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {(transcript || response) && (
        <div className="bg-background border border-border rounded-lg p-4 shadow-lg max-w-xs mb-2 animate-in fade-in slide-in-from-bottom-4">
          {transcript && (
            <p className="text-sm text-muted-foreground mb-1">
              You: "{transcript}"
            </p>
          )}
          {isProcessing && <p className="text-sm italic">Thinking...</p>}
          {response && <p className="text-sm font-medium">{response}</p>}
        </div>
      )}

      <Button
        size="icon"
        className={cn(
          "h-14 w-14 rounded-full shadow-xl transition-all duration-300",
          isListening
            ? "bg-red-500 hover:bg-red-600 animate-pulse"
            : "bg-primary hover:bg-primary/90",
          isPlaying && "ring-4 ring-primary/30"
        )}
        onClick={toggleListening}
      >
        {isProcessing ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : isListening ? (
          <Square className="h-6 w-6 fill-current" />
        ) : isPlaying ? (
          <Volume2 className="h-6 w-6" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}
