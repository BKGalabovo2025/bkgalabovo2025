"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Language = "bg" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  bg: {
    // Landing
    "club.name": "БК ГЪЛЪБОВО",
    "club.subtitle": "Система за управление на спортен клуб",
    "status.title": "Статус на Клуба",
    "status.members": "Членове",
    "status.finances": "Финанси",
    "status.online": "Системата е Онлайн",
    "admin.title": "Администрация",
    "admin.desc":
      "Достъпът до административния панел е ограничен само за оторизирани лица.",
    "admin.login": "Вход в Системата",
    "public.ranking": "Топ Ранглиста",
    "public.tournaments": "Предстоящи Турнири",
    "public.no_data": "Няма налични данни в момента.",

    // Dashboard
    "dash.welcome": "Здравей",
    "dash.subtitle": "Ето какво се случва в клуба днес.",
    "dash.active_members": "Активни членове",
    "dash.today_training": "Днешни събития",
    "dash.monthly_revenue": "Месечен оборот",
    "dash.low_stock": "Ниска наличност",
    "dash.quick_analysis": "Бърз анализ на натовареността",
    "dash.last_events": "Последни събития",
    "dash.monthly_report": "Месечен отчет",
    "dash.coaches_online": "Треньори на линия",
    "dash.maintenance": "Предстояща поддръжка",
    "dash.quick_tasks": "Бързи задачи",
    "dash.add_task": "Добави задача",
  },
  en: {
    // Landing
    "club.name": "BC GALABOVO",
    "club.subtitle": "Sports Club Management System",
    "status.title": "Club Status",
    "status.members": "Members",
    "status.finances": "Finances",
    "status.online": "System Online",
    "admin.title": "Administration",
    "admin.desc":
      "Access to the admin panel is restricted to authorized personnel only.",
    "admin.login": "Admin Login",
    "public.ranking": "Top Rankings",
    "public.tournaments": "Upcoming Tournaments",
    "public.no_data": "No data available at the moment.",

    // Dashboard
    "dash.welcome": "Hello",
    "dash.subtitle": "Here's what's happening today.",
    "dash.active_members": "Active Members",
    "dash.today_training": "Today's Trainings",
    "dash.monthly_revenue": "Monthly Revenue",
    "dash.low_stock": "Low Stock",
    "dash.quick_analysis": "Quick Activity Analysis",
    "dash.last_events": "Recent Events",
    "dash.monthly_report": "Monthly Report",
    "dash.coaches_online": "Coaches Online",
    "dash.maintenance": "Upcoming Maintenance",
    "dash.quick_tasks": "Quick Tasks",
    "dash.add_task": "Add Task",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguage] = useState<Language>("bg");

  useEffect(() => {
    try {
      if (
        typeof window !== "undefined" &&
        window.localStorage &&
        typeof window.localStorage.getItem === "function"
      ) {
        const savedLang = window.localStorage.getItem("app_lang") as Language;
        if (savedLang) {
          setTimeout(() => setLanguage(savedLang), 0);
        }
      }
    } catch (e: unknown) {
      console.warn("Failed to read language from localStorage", e);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    try {
      if (
        typeof window !== "undefined" &&
        window.localStorage &&
        typeof window.localStorage.setItem === "function"
      ) {
        window.localStorage.setItem("app_lang", lang);
      }
    } catch (e: unknown) {
      console.warn("Failed to save language to localStorage", e);
    }
  };

  const t = (key: string) => {
    return (
      translations[language][key as keyof (typeof translations)["bg"]] || key
    );
  };

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage: handleSetLanguage, t }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context)
    throw new Error("useLanguage must be used within a LanguageProvider");
  return context;
};
