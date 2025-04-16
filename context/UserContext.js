// context/UserContext.js
"use client";

import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

const UserContext = createContext();

export function UserProvider({ children }) {
    const [version, setVersion] = useState(0); // for forcing re-renders

  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const fetchUserFromAPI = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const fetchedUser = response.data.user;

      // Fix image path if needed
      if (fetchedUser.image && !fetchedUser.image.startsWith("http")) {
        fetchedUser.image = `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/profile_pictures/${fetchedUser.image}`;
      }

      // Save to context and localStorage
      setUser(fetchedUser);
      setUserRole(fetchedUser.role || null);
      localStorage.setItem("user", JSON.stringify(fetchedUser));
    } catch (error) {
      console.error("❌ Failed to fetch user from API:", error);
      // Optionally clear user if invalid token
    }
  };

  useEffect(() => {
    fetchUserFromAPI();
  }, []);

  const updateUser = (updatedUser) => {
    if (updatedUser?.image && !updatedUser.image.startsWith("http")) {
      updatedUser.image = `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/profile_pictures/${updatedUser.image}`;
    }
  
    // Optional: Add a timestamp manually to trigger component updates
    updatedUser.updated_at = new Date().toISOString();
    setVersion((v) => v + 1); // 🔁 force reactivity when needed

    setUser(updatedUser);
    setUserRole(updatedUser?.role || null);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    
  };
  

  return (
    <UserContext.Provider value={{ user, setUser, userRole, setUserRole, updateUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
