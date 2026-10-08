import { useState, useEffect, useRef, useCallback } from "react";
import { transcribe } from "../api";

export function isVoiceSupported() {
  return (
    typeof window !== "undefined" &&
    !!navigator?.mediaDevices?.getUserMedia &&
    !!(window.MediaRecorder || window.webkitMediaRecorder) &&
    !!window.speechSynthesis
  );
}

function getBestVoice() {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const indianVoice = voices.find((v) => /en[-_]IN/i.test(v.lang) || /india/i.test(v.name));
  if (indianVoice) return indianVoice;
  const englishVoice = voices.find((v) => /^en/i.test(v.lang));
  return englishVoice || voices[0] || null;
}

export function useVoiceInterview({
  currentQuestion,
  isVoiceMode,
  setIsVoiceMode,
  onAnswerSubmit,
  onNextQuestion,
  onFinishInterview,
  isLastQuestion,
  currentFeedback,
  loadingFeedback,
  setErrorMessage,
}) {
  // Voice states: 'idle' | 'speaking' | 'listening' | 'thinking' | 'responding' | 'paused'
  const [voiceStatus, setVoiceStatus] = useState("idle");
  const [audioLevel, setAudioLevel] = useState(0); // 0 to 100 for live visualizer
  const [transcriptPreview, setTranscriptPreview] = useState("");
  const [emptyRetries, setEmptyRetries] = useState(0);
  const [apiRetries, setApiRetries] = useState(0);

  // Refs for audio hardware and timers
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  const silenceTimerRef = useRef(null);
  const prompt10sTimerRef = useRef(null);
  const hardStop90sTimerRef = useRef(null);
  const autoNextTimerRef = useRef(null);

  const hasSpokenRef = useRef(false);
  const prompted10sRef = useRef(false);
  const isPausedRef = useRef(false);
  const activeQuestionIdRef = useRef(null);

  // Stop all active audio tracks and recording
  const stopAudioCapture = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        audioContextRef.current.close();
      } catch (e) {
        // ignore
      }
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // Cancel any ongoing text-to-speech
  const cancelSpeech = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Clear all pending loop timers
  const clearAllTimers = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (prompt10sTimerRef.current) clearTimeout(prompt10sTimerRef.current);
    if (hardStop90sTimerRef.current) clearTimeout(hardStop90sTimerRef.current);
    if (autoNextTimerRef.current) clearTimeout(autoNextTimerRef.current);
  }, []);

  // Speak a phrase via SpeechSynthesis
  const speak = useCallback(
    (text, onEnd) => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        if (onEnd) onEnd();
        return;
      }
      cancelSpeech();

      const cleanText = text.replace(/[*#_`]/g, "").trim();
      if (!cleanText) {
        if (onEnd) onEnd();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voice = getBestVoice();
      if (voice) utterance.voice = voice;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        if (onEnd && !isPausedRef.current) onEnd();
      };

      utterance.onerror = (e) => {
        console.warn("[TTS] Error:", e);
        if (onEnd && !isPausedRef.current) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    },
    [cancelSpeech]
  );

  // Fallback to typing mode with optional error notice
  const fallbackToTyping = useCallback(
    (msg = "") => {
      cancelSpeech();
      stopAudioCapture();
      clearAllTimers();
      setIsVoiceMode(false);
      setVoiceStatus("idle");
      if (msg) {
        setErrorMessage(msg);
      }
    },
    [cancelSpeech, stopAudioCapture, clearAllTimers, setIsVoiceMode, setErrorMessage]
  );

  // Step 2 & 3: Listen and record with silence detection
  const startListening = useCallback(async () => {
    if (isPausedRef.current) return;
    setVoiceStatus("listening");
    hasSpokenRef.current = false;
    prompted10sRef.current = false;
    audioChunksRef.current = [];
    clearAllTimers();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      // AudioContext + AnalyserNode for volume metering
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // MediaRecorder initialization
      let mimeType = "audio/webm";
      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          mimeType = "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
          mimeType = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        }
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType || "audio/webm",
        });
        stopAudioCapture();
        processAudioAnswer(audioBlob, mimeType);
      };

      recorder.start(250);

      // 10s no-speech reminder timer
      prompt10sTimerRef.current = setTimeout(() => {
        if (!hasSpokenRef.current && !isPausedRef.current) {
          prompted10sRef.current = true;
          // Speak gentle prompt then resume listening
          cancelSpeech();
          speak("Take your time, I'm listening", () => {
            // Keep listening
          });
        }
      }, 10000);

      // 90s Hard Stop Timer
      hardStop90sTimerRef.current = setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
        }
      }, 90000);

      // Live Audio Metering & 2s Silence Detection Loop
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let silenceStartTime = null;

      const checkVolume = () => {
        if (recorder.state !== "recording") return;

        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length; // 0 - 255
        const normalizedLevel = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(normalizedLevel);

        const speechThreshold = 14;

        if (avg > speechThreshold) {
          hasSpokenRef.current = true;
          silenceStartTime = null;
        } else if (hasSpokenRef.current) {
          // User spoke previously and is now silent
          if (!silenceStartTime) {
            silenceStartTime = Date.now();
          } else {
            const silenceElapsed = Date.now() - silenceStartTime;
            if (silenceElapsed >= 2000) {
              // 2 seconds continuous silence reached -> auto stop!
              if (recorder.state === "recording") {
                recorder.stop();
                return;
              }
            }
          }
        }

        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      animFrameRef.current = requestAnimationFrame(checkVolume);
    } catch (err) {
      console.error("[Voice] Mic permission error:", err);
      fallbackToTyping(
        "Microphone access was denied or is unavailable. Switched to typing mode."
      );
    }
  }, [clearAllTimers, stopAudioCapture, cancelSpeech, speak, fallbackToTyping]);

  // Step 4: Process and Transcribe recorded audio
  const processAudioAnswer = useCallback(
    async (blob, mimeType) => {
      if (isPausedRef.current) return;
      setVoiceStatus("thinking");
      clearAllTimers();

      const ext = mimeType.includes("mp4") ? "mp4" : "webm";
      const formData = new FormData();
      formData.append("audio", blob, `answer.${ext}`);

      try {
        const res = await transcribe(formData);
        const transcript = (res.transcript || res.text || "").trim();

        // Check if transcript is empty or under 3 words
        const wordCount = transcript.split(/\s+/).filter(Boolean).length;
        if (!transcript || wordCount < 3) {
          if (emptyRetries < 2) {
            setEmptyRetries((prev) => prev + 1);
            speak("Sorry, I didn't catch that, could you repeat?", () => {
              startListening();
            });
            return;
          } else {
            fallbackToTyping(
              "Could not clearly transcribe audio response. Switched to typing mode."
            );
            return;
          }
        }

        // Valid transcript!
        setEmptyRetries(0);
        setApiRetries(0);
        setTranscriptPreview(transcript);

        // Submit to scoring
        onAnswerSubmit({
          question: currentQuestion.question,
          targets_gap: currentQuestion.targets_gap || "",
          answer: transcript,
        });
      } catch (err) {
        console.warn("[Voice] Transcribe error:", err);
        if (apiRetries < 1) {
          setApiRetries((prev) => prev + 1);
          speak("Something went wrong, let's try that again", () => {
            startListening();
          });
        } else {
          fallbackToTyping("Speech transcription failed. Switched to typing mode.");
        }
      }
    },
    [
      clearAllTimers,
      emptyRetries,
      apiRetries,
      currentQuestion,
      speak,
      startListening,
      onAnswerSubmit,
      fallbackToTyping,
    ]
  );

  // Step 1: SPEAK current question
  const startQuestionLoop = useCallback(() => {
    if (!isVoiceMode || !currentQuestion || isPausedRef.current) return;
    setVoiceStatus("speaking");
    activeQuestionIdRef.current = currentQuestion.id || currentQuestion.question;

    speak(currentQuestion.question, () => {
      startListening();
    });
  }, [isVoiceMode, currentQuestion, speak, startListening]);

  // Skip question reading & start listening immediately on bubble tap
  const skipSpeakingAndListen = useCallback(() => {
    if (voiceStatus === "speaking") {
      cancelSpeech();
      startListening();
    }
  }, [voiceStatus, cancelSpeech, startListening]);

  // User manually triggers "I'm done"
  const finishRecordingEarly = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Pause / Resume controls
  const togglePause = useCallback(() => {
    if (isPausedRef.current) {
      // Resume
      isPausedRef.current = false;
      if (voiceStatus === "paused") {
        startQuestionLoop();
      }
    } else {
      // Pause
      isPausedRef.current = true;
      cancelSpeech();
      stopAudioCapture();
      clearAllTimers();
      setVoiceStatus("paused");
    }
  }, [voiceStatus, cancelSpeech, stopAudioCapture, clearAllTimers, startQuestionLoop]);

  // Handle Step 5: Speak feedback when evaluation completes
  useEffect(() => {
    if (!isVoiceMode || !currentFeedback || loadingFeedback || isPausedRef.current) {
      return;
    }

    setVoiceStatus("responding");
    const scoreVal = currentFeedback.score !== undefined ? currentFeedback.score : 7;
    const firstStrength = currentFeedback.strengths?.[0]
      ? currentFeedback.strengths[0].replace(/[\n\r]+/g, " ")
      : "";
    const firstImprovement = currentFeedback.improvements?.[0]
      ? currentFeedback.improvements[0].replace(/[\n\r]+/g, " ")
      : "";

    const responseText = `You scored ${scoreVal} out of 10. ${
      firstStrength ? firstStrength + ". " : ""
    }${firstImprovement ? "To improve: " + firstImprovement : ""}`;

    speak(responseText, () => {
      // Short pause before advancing
      autoNextTimerRef.current = setTimeout(() => {
        if (!isPausedRef.current && isVoiceMode) {
          onNextQuestion();
        }
      }, 2500);
    });

    return () => {
      if (autoNextTimerRef.current) clearTimeout(autoNextTimerRef.current);
    };
  }, [isVoiceMode, currentFeedback, loadingFeedback, speak, onNextQuestion]);

  // Start voice loop when voice mode is activated or question changes
  useEffect(() => {
    if (isVoiceMode && currentQuestion && !currentFeedback && !loadingFeedback) {
      const qId = currentQuestion.id || currentQuestion.question;
      if (activeQuestionIdRef.current !== qId || voiceStatus === "idle") {
        startQuestionLoop();
      }
    }
  }, [isVoiceMode, currentQuestion, currentFeedback, loadingFeedback, startQuestionLoop, voiceStatus]);

  // Cleanup on unmount or voice mode toggle
  useEffect(() => {
    return () => {
      cancelSpeech();
      stopAudioCapture();
      clearAllTimers();
    };
  }, [cancelSpeech, stopAudioCapture, clearAllTimers]);

  return {
    voiceStatus,
    audioLevel,
    transcriptPreview,
    startQuestionLoop,
    skipSpeakingAndListen,
    finishRecordingEarly,
    togglePause,
    isPaused: isPausedRef.current,
    fallbackToTyping,
  };
}
