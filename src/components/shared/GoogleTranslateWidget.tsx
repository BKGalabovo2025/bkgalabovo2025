"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

export function GoogleTranslateWidget() {
  const [isClient, setIsClient] = useState(false);
  const [currentLang, setCurrentLang] = useState("bg");

  useEffect(() => {
    setIsClient(true);
    
    // Check cookies to see if google translate is active
    const checkLang = () => {
      if (typeof document !== 'undefined') {
        const match = document.cookie.match(/googtrans=\/bg\/([a-z]{2})/);
        if (match && match[1] === "en") {
          setCurrentLang("en");
        } else {
          setCurrentLang("bg");
        }
      }
    };
    checkLang();

    // @ts-ignore
    window.googleTranslateElementInit = () => {
      // @ts-ignore
      new window.google.translate.TranslateElement(
        { 
          pageLanguage: 'bg',
          includedLanguages: 'bg,en',
          autoDisplay: false
        },
        'google_translate_element'
      );
    };
  }, []);

  const switchLanguage = (lang: string) => {
    if (lang === currentLang) return;
    
    if (lang === "bg") {
      // Clear cookies to restore original language
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
    } else {
      // Set cookies for translation
      document.cookie = `googtrans=/bg/${lang}; path=/`;
      document.cookie = `googtrans=/bg/${lang}; domain=.${window.location.hostname}; path=/`;
    }
    
    window.location.reload();
  };

  if (!isClient) return null;

  return (
    <div className="relative flex items-center">
      {/* Hidden google translate element */}
      <div id="google_translate_element" className="hidden opacity-0 w-0 h-0 overflow-hidden"></div>
      <Script
        src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="lazyOnload"
      />
      
      {/* Beautiful custom button toggle */}
      <div className="flex bg-white/5 border border-white/10 rounded-full p-1 shadow-[0_0_15px_rgba(0,0,0,0.3)] backdrop-blur-md notranslate">
         <button
            onClick={() => switchLanguage('bg')}
            className={`px-3 py-1 text-xs font-bold rounded-full transition-all duration-300 ${currentLang === 'bg' ? 'bg-zinc-200 text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}
         >
           BG
         </button>
         <button
            onClick={() => switchLanguage('en')}
            className={`px-3 py-1 text-xs font-bold rounded-full transition-all duration-300 ${currentLang === 'en' ? 'bg-zinc-200 text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}
         >
           EN
         </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        /* Hide all of Google's UI */
        .skiptranslate iframe { display: none !important; }
        body { top: 0px !important; }
        #google_translate_element { display: none !important; }
        /* Hide google tooltip that appears on hover */
        .goog-text-highlight { background: none !important; box-shadow: none !important; }
        #goog-gt-tt { display: none !important; }
      `}} />
    </div>
  );
}
