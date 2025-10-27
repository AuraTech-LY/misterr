import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  primaryColor: string;
  logoUrl: string;
  setPrimaryColor: (color: string) => void;
  setLogoUrl: (url: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [primaryColor, setPrimaryColor] = useState('#781220');
  const [logoUrl, setLogoUrl] = useState('/New Element 88 [8BACFE9].png');

  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', primaryColor);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = primaryColor;
      document.head.appendChild(meta);
    }
  }, [primaryColor]);

  const value = {
    primaryColor,
    logoUrl,
    setPrimaryColor,
    setLogoUrl,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
