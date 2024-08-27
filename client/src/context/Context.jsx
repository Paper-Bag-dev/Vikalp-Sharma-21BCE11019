import React, { createContext, useState } from 'react';

export const Context = createContext({
  loading: false,
  setLoading: () => {}
});

export const ContextProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);

  return (
    <Context.Provider value={{ loading, setLoading }}>
      {children}
    </Context.Provider>
  );
};
