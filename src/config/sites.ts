export type SiteConfig = {
  id: string;
  name: string;
  domain: string;
  logoUrl?: string;
  themeColor: string;
  contact: {
    address: string;
    phone: string;
    email: string;
    mol: string;
    website: string;
  };
};

export const SITES: Record<string, SiteConfig> = {
  bkgalabovo: {
    id: "bkgalabovo",
    name: 'СНЦ "Бадминтон клуб Гълъбово"',
    domain: "bkgalabovo.com", // This would be the production domain
    themeColor: "#1e3a8a", // Blue
    contact: {
      address: "град Гълъбово, п.к 6280, обл. Стара Загора, ул. ”Иван Вазов” №22",
      phone: "+359 899 82 99 23",
      email: "bk_galabovo@abv.bg",
      mol: "Мира Георгиева",
      website: "www.bkgalabovo.alle.bg",
    },
  },
  recoveryzone: {
    id: "recoveryzone",
    name: "Recovery Zone by ZM",
    domain: "recoveryzone.bg",
    themeColor: "#065f46", // Green
    contact: {
      address: "град Стара Загора", // Need to verify actual address
      phone: "+359 888 00 00 00", // Need to verify actual phone
      email: "recoveryzone@example.com",
      mol: "ZM",
      website: "www.recoveryzone.bg",
    },
  },
};

export const getSiteConfig = () => {
  const siteId = process.env.NEXT_PUBLIC_SITE_ID || "bkgalabovo";
  return SITES[siteId] || SITES.bkgalabovo;
};
