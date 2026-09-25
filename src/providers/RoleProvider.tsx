import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'student' | 'instructor';

interface RoleContextValue {
  role: UserRole;
  setRole: (role: UserRole) => void;
  toggleRole: () => void;
  isInstructor: boolean;
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

const ROLE_STORAGE_KEY = 'quantum_lens_dev_role';

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem(ROLE_STORAGE_KEY);
    return saved === 'instructor' ? 'instructor' : 'student';
  });

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem(ROLE_STORAGE_KEY, newRole);
  };

  const toggleRole = () => {
    const nextRole = role === 'student' ? 'instructor' : 'student';
    setRole(nextRole);
  };

  return (
    <RoleContext.Provider
      value={{
        role,
        setRole,
        toggleRole,
        isInstructor: role === 'instructor',
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = (): RoleContextValue => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
