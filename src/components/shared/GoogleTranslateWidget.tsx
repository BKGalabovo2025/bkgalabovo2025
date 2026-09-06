"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

export function GoogleTranslateWidget() {
  const [isClient, setIsClient] = useState(false);
  const [currentLang, setCurrentLang] = useState("bg");

  useEffect(() => {
    setIsClient(true);

    // Check cookies to see if google translate is active
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/googtrans=\/bg\/([a-z]{2})/);
      if (match && match[1] === "en") {
        setCurrentLang("en");
      } else {
        setCurrentLang("bg");
      }
    }
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const ensureSelectAttributes = () => {
      const select =
        document.querySelector<HTMLSelectElement>(".goog-te-combo");
      if (select) {
        if (!select.id) select.id = "google_translate_select";
        if (!select.name) select.name = "google_translate_select";
        if (!select.getAttribute("autocomplete")) {
          select.setAttribute("autocomplete", "off");
        }
      }
    };

    // @ts-expect-error - Google Translate API is loaded externally
    window.googleTranslateElementInit = () => {
      // @ts-expect-error - Google Translate API is loaded externally
      // eslint-disable-next-line sonarjs/constructor-for-side-effects
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "bg",
          includedLanguages: "bg,en",
          autoDisplay: false,
        },
        "google_translate_element"
      );
      ensureSelectAttributes();
    };

    const observer = new MutationObserver(() => {
      ensureSelectAttributes();
    });

    const target = document.getElementById("google_translate_element");
    if (target) {
      observer.observe(target, { childList: true, subtree: true });
    }

    return () => {
      observer.disconnect();
    };
  }, [isClient]);

  const switchLanguage = (lang: string) => {
    if (lang === currentLang) return;

    if (lang === "bg") {
      // Clear cookies across all possible host/domain variations to restore original language
      const domains = [
        window.location.hostname,
        `.${window.location.hostname}`,
        "",
      ];
      domains.forEach((d) => {
        const domainStr = d ? `; domain=${d}` : "";
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/${domainStr};`;
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${window.location.pathname}${domainStr};`;
      });
      try {
        sessionStorage.removeItem("googtrans");
        localStorage.removeItem("googtrans");
      } catch {
        // Ignore storage errors
      }
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
      <div
        id="google_translate_element"
        className="hidden size-0 overflow-hidden opacity-0"
      ></div>
      <Script
        src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="lazyOnload"
      />

      {/* Beautiful custom button toggle */}
      <div className="notranslate flex rounded-full border border-white/10 bg-white/5 p-1 shadow-[0_0_15px_rgba(0,0,0,0.3)] backdrop-blur-md">
        <button
          onClick={() => switchLanguage("bg")}
          className={`rounded-full px-3 py-1 text-xs font-bold transition-all duration-300 ${currentLang === "bg" ? "bg-zinc-200 text-black shadow-md" : "text-zinc-400 hover:text-white"}`}
        >
          BG
        </button>
        <button
          onClick={() => switchLanguage("en")}
          className={`rounded-full px-3 py-1 text-xs font-bold transition-all duration-300 ${currentLang === "en" ? "bg-zinc-200 text-black shadow-md" : "text-zinc-400 hover:text-white"}`}
        >
          EN
        </button>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* Hide all of Google's UI */
        .skiptranslate iframe { display: none !important; }
        body { top: 0px !important; }
        #google_translate_element { display: none !important; }
        /* Hide google tooltip that appears on hover */
        .goog-text-highlight { background: none !important; box-shadow: none !important; }
        #goog-gt-tt { display: none !important; }
      `,
        }}
      />
    </div>
  );
}
