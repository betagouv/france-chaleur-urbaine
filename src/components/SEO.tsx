import Head from 'next/head';
import { usePathname } from 'next/navigation';
import React from 'react';
import type { Graph, Thing } from 'schema-dts';

import { clientConfig } from '@/client-config';

import { colors } from './ui/helpers/colors';

const maxTitleLength = 60;
const maxDescriptionLength = 160;

const websiteUrl = clientConfig.websiteOrigin;
const websiteName = 'France Chaleur Urbaine';
const defaultTitle = 'Accélérons les raccordements aux réseaux de chaleur';
const defaultDescription =
  'Une solution de chauffage écologique et économique exploitant des énergies renouvelables et de récupération locales.';
const defaultType = 'website';
const twitterUsername = 'fchaleururbaine';
const defaultLogoPath = '/logo-fcu.png';

// USE https://www.screenshotmachine.com/website-screenshot-api.php
// curl -o public/img/preview/fcu-preview-$(date +%Y%m%d).jpg "https://api.screenshotmachine.com?key=e2fc5e&url=france-chaleur-urbaine.beta.gouv.fr&dimension=1200x627"
const defaultImagePath = '/img/preview/fcu-preview-20241122.webp';
const defaultImageWidth = 1200;
const defaultImageHeight = 627;

const sameAs = [
  'https://www.linkedin.com/company/france-chaleur-urbaine/',
  'https://www.youtube.com/channel/UCe6-eBpMzazl_ZESXJ_N6hw',
  // 'https://x.com/fchaleururbaine', // plus utilisé
  // 'https://www.facebook.com/p/France-Chaleur-Urbaine-100075948205743/', // plus utilisé
];

type OpenGraphType =
  | 'article'
  | 'website'
  | 'book'
  | 'profile'
  | 'video.movie'
  | 'video.episode'
  | 'video.tv_show'
  | 'video.other'
  | 'music.song'
  | 'music.album'
  | 'music.playlist'
  | 'music.radio_station'
  | 'product'
  | 'place'
  | 'city'
  | 'country'
  | 'local_business'
  | 'restaurant'
  | 'hotel'
  | 'sports_team'
  | 'sports_event'
  | 'recipe'
  | 'game'
  | 'game.episode'
  | 'game.character'
  | 'game.creative_work';

export type SEOProps = {
  title?: string;
  noTitleSuffix?: boolean;
  description?: string;
  image?: string;
  imageWidth?: string;
  imageHeight?: string;
  canonicalUrl?: string;
  children?: React.ReactNode;
  noIndex?: boolean;
  type?: OpenGraphType;
  microdata?: Thing[];
};

const getTitleWithSuffix = (title: string): string => {
  const titleWithSuffix = `${title} - ${websiteName}`;
  return titleWithSuffix.length <= maxTitleLength ? titleWithSuffix : title;
};

const SEO: React.FC<SEOProps> = ({
  children,
  title,
  noTitleSuffix,
  description = defaultDescription,
  canonicalUrl,
  noIndex,
  image = defaultImagePath,
  imageWidth = defaultImageWidth,
  imageHeight = defaultImageHeight,
  type = defaultType,
  microdata = [],
}) => {
  const pathname = usePathname();

  const titleWithSuffix = noTitleSuffix ? title : getTitleWithSuffix(title || defaultTitle);
  const currentUrl = canonicalUrl || pathname;
  const currentAbsoluteUrl = `${websiteUrl}${currentUrl}`;

  if (process.env.NODE_ENV === 'development') {
    if (title && title.length > maxTitleLength) {
      console.warn(`title is too long (${title.length} > ${maxTitleLength})`, title);
    }
    if (description && description.length > maxDescriptionLength) {
      console.warn(`description is too long (${description.length} > ${maxDescriptionLength})`, description);
    }
  }

  const graph: Graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        url: websiteUrl,
        name: websiteName,
        logo: `${websiteUrl}${defaultLogoPath}`,
        sameAs,
      },
      {
        '@type': 'WebSite',
        url: websiteUrl,
      },
      ...microdata,
    ],
  };

  const absoluteImageUrl = image.startsWith('http') ? image : `${websiteUrl}${image}`;

  return (
    <Head>
      {/* ********************************************************************************************************************
       * IMPORTANT: To avoid duplication, all tags included should have a key.
       * ******************************************************************************************************************** */}
      {noIndex && <meta key="robots" name="robots" content="noindex" />}

      <link key="canonical" rel="canonical" href={currentAbsoluteUrl} />
      <meta key="theme-color" name="theme-color" content={colors.primary} />

      <title>{titleWithSuffix}</title>
      <meta key="description" name="description" content={description} />
      <meta key="image" itemProp="image" content={absoluteImageUrl} />

      {/* Images */}
      <link key="apple-touch-icon" rel="apple-touch-icon" href="/favicons/apple-touch-icon.png" />
      <link key="icon" rel="icon" href="/favicons/favicon.svg" type="image/svg+xml" />
      <link key="shortcut icon" rel="shortcut icon" href="/favicons/favicon.ico" type="image/x-icon" />

      {/* OPENGRAPH https://ogp.me/ */}
      <meta key="og:type" property="og:type" content={type} />
      <meta key="og:site_name" property="og:site_name" content={websiteName} />
      <meta key="og:title" property="og:title" content={titleWithSuffix} />
      <meta key="og:url" property="og:url" content={`${websiteUrl}${currentUrl}`} />
      <meta key="og:image" property="og:image" content={absoluteImageUrl} />
      <meta key="og:image:width" property="og:image:width" content={`${imageWidth}`} />
      <meta key="og:image:height" property="og:image:height" content={`${imageHeight}`} />
      <meta key="og:description" property="og:description" content={description} />

      {/* TWITTER https://developer.twitter.com/en/docs/tweets/optimize-with-cards/overview/summary */}
      <meta key="twitter:card" name="twitter:card" content="summary_large_image" />
      <meta key="twitter:domain" property="twitter:domain" content={websiteUrl?.replace(/^https?:\/\//, '')} />
      {twitterUsername && <meta key="twitter:site" name="twitter:site" content={twitterUsername} />}

      {/* Microdata */}
      <script key="jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />

      {/* Performance boost */}
      <link key="matomo" rel="preconnect" crossOrigin="anonymous" href={process.env.NEXT_PUBLIC_MATOMO_URL} />

      {children}
    </Head>
  );
};

export default SEO;
