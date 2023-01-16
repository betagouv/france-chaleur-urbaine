/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXTAUTH_URL || 'https://example.com',
  generateRobotsTxt: true, // (optional)
  // ...other options
};
