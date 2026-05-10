import { create } from 'zustand';

interface SidebarState {
  isOpen: boolean;
  open:   () => void;
  close:  () => void;
  toggle: () => void;
}

export const useSidebarStore = create<SidebarState>()((set) => ({
  isOpen: false,
  open:   () => { set({ isOpen: true });  document.body.style.overflow = 'hidden'; },
  close:  () => { set({ isOpen: false }); document.body.style.overflow = ''; },
  toggle: () => set((s) => {
    document.body.style.overflow = s.isOpen ? '' : 'hidden';
    return { isOpen: !s.isOpen };
  }),
}));
