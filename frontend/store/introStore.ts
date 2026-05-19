import { create } from 'zustand';

interface IntroState {
  playIntro: boolean;
  triggerIntro: () => void;
  finishIntro: () => void;
}

export const useIntroStore = create<IntroState>((set) => ({
  playIntro: false,
  triggerIntro: () => set({ playIntro: true }),
  finishIntro: () => set({ playIntro: false }),
}));
