// src/context/UserContext.tsx
import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { getUserRole } from "../services/auth";
import { UserProfile } from "../types/User";

interface UserContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  setUser: (user: UserProfile | null) => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  isAuthenticated: false,
  setUser: () => {},
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const role = await getUserRole(session.user.id);
      setUser({
        id: session.user.id,
        email: session.user.email!,
        role,
        fullname: "", // puedes cargar más datos si quieres
        employeenumber: "",
        workshop: "",
        zone: "",
        phone: "",
        createdat: new Date(),
      });
      setIsAuthenticated(true);
    };

    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, isAuthenticated, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);