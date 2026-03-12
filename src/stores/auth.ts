import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);

  const init = () => {
    onAuthStateChanged(auth, (u) => {
      if (u) {
        user.value = u;
        const costsStore = useCostsStore();
        costsStore.getCosts();
        const userStore = useUserStore();
        userStore.getUserData();
      }
    });
  };

  const loginEmail = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const registerEmail = (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const loginGoogle = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const logout = () => {
    signOut(auth);
    return (window.location.href = "/");
  };

  return {
    user,
    init,
    loginEmail,
    registerEmail,
    loginGoogle,
    logout,
  };
});
