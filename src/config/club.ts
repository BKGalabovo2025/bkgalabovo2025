import { getSiteConfig } from "./sites";

const siteConfig = getSiteConfig();

export const clubInfo = {
  name: siteConfig.name,
  address: siteConfig.contact.address,
  contact: `тел: ${siteConfig.contact.phone} , МОЛ: ${siteConfig.contact.mol}`,
  email: siteConfig.contact.email,
  website: siteConfig.contact.website,
};
