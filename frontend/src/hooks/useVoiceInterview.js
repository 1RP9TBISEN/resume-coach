import { useState, useEffect, useRef, useCallback } from "react";
import { transcribe, speakAudio, USE_MOCK } from "../api";

// Reused shared HTMLAudioElement for iOS autoplay unlock & human-like voice playback
let sharedAudioInstance = null;

export function getOrCreateSharedAudio() {
  if (typeof window === "undefined") return null;
  if (!sharedAudioInstance) {
    sharedAudioInstance = new Audio();
    sharedAudioInstance.preload = "auto";
  }
  return sharedAudioInstance;
}

/**
 * Call on user gesture (e.g. "Start voice interview" button tap) to unlock audio playback on iOS Safari
 */
export function unlockSharedAudio() {
  const audio = getOrCreateSharedAudio();
  if (audio) {
    try {
      // Play and immediately pause to unlock playback permissions on iOS
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.then === "function") {
        playPromise
          .then(() => {
            audio.pause();
            audio.currentTime = 0;
          })
          .catch(() => {
            // Ignore autoplay rejection on empty buffer
          });
      }
    } catch {
      // Ignore
    }
  }
}

export function isVoiceSupported() {
  return (
    typeof window !== "undefined" &&
    !!navigator?.mediaDevices?.getUserMedia &&
    !!(window.MediaRecorder || window.webkitMediaRecorder) &&
    !!window.speechSynthesis
  );
}

function getBestBrowserVoice() {
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

  // Backend TTS Failure Counter (After 2 failures, stay on browser voice for the session)
  const backendFailuresRef = useRef(0);

  // Active audio playback tracking
  const activeAudioUrlRef = useRef(null);
  const currentSpeakAbortCtrlRef = useRef(null);

  // Prefetch cache ref: { text, promise, controller, blob }
  const prefetchRef = useRef(null);

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

  // Initialize shared audio element
  useEffect(() => {
    getOrCreateSharedAudio();
  }, []);

  // Stop and cleanup any active HTMLAudioElement playback & revoke object URL
  const stopAndCleanupAudio = useCallback(() => {
    if (currentSpeakAbortCtrlRef.current) {
      currentSpeakAbortCtrlRef.current.abort();
      currentSpeakAbortCtrlRef.current = null;
    }
    const audio = getOrCreateSharedAudio();
    if (audio) {
      try {
        audio.pause();
        audio.currentTime = 0;
        audio.removeAttribute("src");
        audio.load();
      } catch (e) {
        // ignore
      }
    }
    if (activeAudioUrlRef.current) {
      try {
        URL.revokeObjectURL(activeAudioUrlRef.current);
      } catch (e) {
        // ignore
      }
      activeAudioUrlRef.current = null;
    }
  }, []);

  // Stop all active mic audio tracks and recording
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

  // Cancel any ongoing browser text-to-speech
  const cancelSpeech = useCallback(() => {
    stopAndCleanupAudio();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [stopAndCleanupAudio]);

  // Clear all pending loop timers
  const clearAllTimers = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (prompt10sTimerRef.current) clearTimeout(prompt10sTimerRef.current);
    if (hardStop90sTimerRef.current) clearTimeout(hardStop90sTimerRef.current);
    if (autoNextTimerRef.current) clearTimeout(autoNextTimerRef.current);
  }, []);

  // Helper: Play audio via browser SpeechSynthesis
  const speakWithBrowserVoice = useCallback((cleanText, onEnd) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      if (onEnd && !isPausedRef.current) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voice = getBestBrowserVoice();
      if (voice) utterance.voice = voice;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        if (onEnd && !isPausedRef.current) onEnd();
      };

      utterance.onerror = (e) => {
        console.warn("[TTS Browser] Error:", e);
        if (onEnd && !isPausedRef.current) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("[TTS Browser] Speech error:", err);
      if (onEnd && !isPausedRef.current) onEnd();
    }
  }, []);

  // Helper: Play an audio Blob using the single reused HTMLAudioElement
  const playAudioBlob = useCallback((blob, onEnd) => {
    return new Promise((resolve, reject) => {
      const audio = getOrCreateSharedAudio();
      if (!audio) {
        reject(new Error("Audio element unavailable"));
        return;
      }

      stopAndCleanupAudio();

      const objectUrl = URL.createObjectURL(blob);
      activeAudioUrlRef.current = objectUrl;

      let finished = false;

      const cleanupListeners = () => {
        audio.removeEventListener("ended", handleEnded);
        audio.removeEventListener("error", handleError);
        if (activeAudioUrlRef.current === objectUrl) {
          URL.revokeObjectURL(objectUrl);
          activeAudioUrlRef.current = null;
        }
      };

      const handleEnded = () => {
        if (finished) return;
        finished = true;
        cleanupListeners();
        resolve();
        if (onEnd && !isPausedRef.current) {
          onEnd();
        }
      };

      const handleError = (e) => {
        if (finished) return;
        finished = true;
        cleanupListeners();
        reject(e || new Error("HTMLAudioElement playback error"));
      };

      audio.addEventListener("ended", handleEnded);
      audio.addEventListener("error", handleError);
      audio.src = objectUrl;

      audio.play().catch((playErr) => {
        handleError(playErr);
      });
    });
  }, [stopAndCleanupAudio]);

  // Main speak function: Backend Groq TTS with prefetch, 6s timeout, 2-failure latch, and browser fallback
  const speak = useCallback(
    async (text, onEnd) => {
      cancelSpeech();

      const cleanText = text.replace(/[*#_`]/g, "").trim();
      if (!cleanText) {
        if (onEnd && !isPausedRef.current) onEnd();
        return;
      }

      // Mock mode or latch >= 2 failures: use browser voice directly
      if (USE_MOCK || backendFailuresRef.current >= 2) {
        speakWithBrowserVoice(cleanText, onEnd);
        return;
      }

      // Check if we have a prefetched audio blob/promise for this exact text
      let audioBlob = null;
      if (prefetchRef.current && prefetchRef.current.text === cleanText) {
        const cached = prefetchRef.current;
        prefetchRef.current = null; // consume prefetch
        try {
          audioBlob = cached.blob || (await cached.promise);
        } catch (err) {
          console.warn("[Voice] Prefetched audio failed:", err);
          audioBlob = null;
        }
      }

      // If not in prefetch cache, fetch from /api/speak with 6s timeout
      if (!audioBlob) {
        const abortCtrl = new AbortController();
        currentSpeakAbortCtrlRef.current = abortCtrl;
        try {
          audioBlob = await speakAudio(cleanText, abortCtrl.signal, 6000);
        } catch (err) {
          backendFailuresRef.current += 1;
          console.warn(
            `[Voice] /api/speak failed (${backendFailuresRef.current}/2). Falling back to browser voice:`,
            err.message
          );
          currentSpeakAbortCtrlRef.current = null;
          speakWithBrowserVoice(cleanText, onEnd);
          return;
        } finally {
          currentSpeakAbortCtrlRef.current = null;
        }
      }

      // Play the retrieved audio blob
      try {
        await playAudioBlob(audioBlob, onEnd);
      } catch (playErr) {
        backendFailuresRef.current += 1;
        console.warn(
          `[Voice] Audio playback failed (${backendFailuresRef.current}/2). Falling back to browser voice:`,
          playErr
        );
        speakWithBrowserVoice(cleanText, onEnd);
      }
    },
    [cancelSpeech, speakWithBrowserVoice, playAudioBlob]
  );

  // Background Prefetching: As soon as a question is shown/changed, prefetch its audio
  useEffect(() => {
    if (USE_MOCK || backendFailuresRef.current >= 2 || !currentQuestion?.question) {
      return;
    }

    const cleanQ = currentQuestion.question.replace(/[*#_`]/g, "").trim();
    if (!cleanQ) return;

    // Skip if already prefetched for this text
    if (prefetchRef.current && prefetchRef.current.text === cleanQ) {
      return;
    }

    // Abort any old unused prefetch
    if (prefetchRef.current?.controller) {
      prefetchRef.current.controller.abort();
    }

    const abortController = new AbortController();
    const fetchPromise = speakAudio(cleanQ, abortController.signal, 6000)
      .then((blob) => {
        if (prefetchRef.current && prefetchRef.current.text === cleanQ) {
          prefetchRef.current.blob = blob;
        }
        return blob;
      })
      .catch((err) => {
        // Silently catch prefetch errors; fallback will handle when actually spoken
        return null;
      });

    prefetchRef.current = {
      text: cleanQ,
      controller: abortController,
      promise: fetchPromise,
      blob: null,
    };

    return () => {
      if (prefetchRef.current?.controller) {
        prefetchRef.current.controller.abort();
      }
    };
  }, [currentQuestion?.id, currentQuestion?.question]);

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
