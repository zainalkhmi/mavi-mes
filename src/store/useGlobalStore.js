import { create } from 'zustand';
import { getCurrentUser } from '../utils/auth';

export const useGlobalStore = create((set) => ({
  user: getCurrentUser(),
  setUser: (newUser) => set({ user: newUser }),
  getIsOperator: () => {
    const user = getCurrentUser();
    return user?.role === 'OPERATOR' || user?.role === 'STATION_OPERATOR';
  }
}));
