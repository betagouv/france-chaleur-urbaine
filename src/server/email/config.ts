// This needs to be apart from the index.tsx file to prevent loop import

const emailConfig = {
  websiteUrl: process.env.NEXT_PUBLIC_MAP_ORIGIN as string,
  linkedInUrl: 'https://www.linkedin.com/company/france-chaleur-urbaine?originalSubdomain=fr',
  calendarLink: 'https://cal.com/erwangravez/15min',
};

export default emailConfig;
