import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppStorage, Language } from '../services/appStorage';
import { UserProfile } from '../types/profile.types';
import { AuthService } from '../api/authService';

interface AppContextValue {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  profile: UserProfile | null;
  setProfile: (profile: UserProfile | null) => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  symptomFlags: Record<string, boolean>;
  setSymptomFlags: (flags: Record<string, boolean>) => void;
  toggleSymptomFlag: (key: string) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('english');
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [symptomFlags, setSymptomFlagsState] = useState<Record<string, boolean>>({
    ulcer: false,
    redness: false,
    swelling: false,
    warmth: false,
    pain: false,
    numbness: false,
    tingling: false,
  });

  useEffect(() => {
    Promise.all([AppStorage.getLanguage(), AppStorage.getProfile()]).then(([lang, localProfile]) => {
      setLanguageState(lang);
      setProfileState(localProfile);
    });
  }, []);

  const setLanguage = async (value: Language) => {
    setLanguageState(value);
    await AppStorage.setLanguage(value);
  };

  const refreshProfile = async () => {
    const local = await AppStorage.getProfile();
    try {
      const remote = await AuthService.getProfile();
      if (remote) {
        setProfileState(remote);
        await AppStorage.setProfile(remote);
        return;
      }
    } catch {}
    setProfileState(local);
  };

  const signOut = async () => {
    await AppStorage.clearAuth();
    setProfileState(null);
  };

  const toggleSymptomFlag = (key: string) => {
    setSymptomFlagsState((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const setSymptomFlags = (flags: Record<string, boolean>) => {
    setSymptomFlagsState(flags);
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      profile,
      setProfile: setProfileState,
      refreshProfile,
      signOut,
      symptomFlags,
      setSymptomFlags,
      toggleSymptomFlag,
    }),
    [language, profile, symptomFlags]
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
