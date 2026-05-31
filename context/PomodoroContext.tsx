import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/GhibliTheme';

export type TimerMode = 'focus' | 'short' | 'long';

export interface PomodoroContextType {
  mode: TimerMode;
  isActive: boolean;
  timeLeft: number;
  sessionsDone: number;
  toggleTimer: () => void;
  resetTimer: () => void;
  skipTimer: () => void;
  switchMode: (newMode: TimerMode) => void;
  formatTime: (seconds: number) => string;
  config: {
    [key in TimerMode]: {
      label: string;
      minutes: number;
      color: string;
      icon: string;
    };
  };
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

export const PomodoroProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [sessionsDone, setSessionsDone] = useState(0);

  const endTimeRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const config = {
    focus: { label: 'Focus', minutes: 25, color: Colors.green, icon: 'leaf' },
    short: { label: 'Pause', minutes: 5, color: Colors.info, icon: 'cafe' },
    long: { label: 'Repos', minutes: 15, color: Colors.accent, icon: 'bed' },
  };

  const handleModeComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setIsActive(false);
    endTimeRef.current = null;
    if (mode === 'focus') {
      const nextSessions = sessionsDone + 1;
      setSessionsDone(nextSessions);
      const nextMode = nextSessions % 4 === 0 ? 'long' : 'short';
      setMode(nextMode);
      setTimeLeft(config[nextMode].minutes * 60);
    } else {
      setMode('focus');
      setTimeLeft(config.focus.minutes * 60);
    }
  };

  useEffect(() => {
    if (isActive) {
      if (!endTimeRef.current) {
        endTimeRef.current = Date.now() + timeLeft * 1000;
      }
      timerRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.round((endTimeRef.current! - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining <= 0) {
          setIsActive(false);
          endTimeRef.current = null;
          handleModeComplete();
        }
      }, 500);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive]);

  const switchMode = (newMode: TimerMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setMode(newMode);
    setTimeLeft(config[newMode].minutes * 60);
    setIsActive(false);
    endTimeRef.current = null;
  };

  const toggleTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (!isActive) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
    } else {
      endTimeRef.current = null;
    }
    setIsActive((prev) => !prev);
  };

  const resetTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setTimeLeft(config[mode].minutes * 60);
    setIsActive(false);
    endTimeRef.current = null;
  };

  const skipTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    handleModeComplete();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <PomodoroContext.Provider
      value={{
        mode,
        isActive,
        timeLeft,
        sessionsDone,
        toggleTimer,
        resetTimer,
        skipTimer,
        switchMode,
        formatTime,
        config,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
};

export const usePomodoro = () => {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error('usePomodoro must be used within a PomodoroProvider');
  }
  return context;
};
