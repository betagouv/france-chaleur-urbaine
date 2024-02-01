const MATOMO_URL = process.env.NEXT_PUBLIC_MATOMO_URL;
const MATOMO_TOKEN = process.env.MATOMO_TOKEN;
const MATOMO_ID_SITE = process.env.NEXT_PUBLIC_MATOMO_SITE_ID;

const matomoRequestDefaultConfig = {
  token_auth: MATOMO_TOKEN,
  idSite: MATOMO_ID_SITE,
  format: 'JSON',
  module: 'API',
};

type ConfigType = Record<string, unknown>;

const configToURI = (config: ConfigType) =>
  Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

const getMatomoRequest = (
  config: ConfigType = {},
  bulkConfig: ConfigType[] = []
) => {
  const computedBulkConfig =
    bulkConfig.length > 0
      ? bulkConfig.reduce(
          (acc, configEntry: ConfigType, i: number) => ({
            ...acc,
            [`urls[${i}]`]: encodeURIComponent(
              configToURI({ ...config, ...configEntry })
            ),
          }),
          { method: 'API.getBulkRequest' }
        )
      : {};

  const computedConfig = {
    ...matomoRequestDefaultConfig,
    ...config,
    ...computedBulkConfig,
  };
  return `${MATOMO_URL}?${configToURI(computedConfig)}`;
};

const requestOptions: RequestInit = {
  method: 'GET',
  redirect: 'follow',
};

export const fetchFromMatomo = async (
  config: ConfigType = {},
  bulkConfig: ConfigType[] = [],
  sendFilter?: boolean
) => {
  try {
    const response = await fetch(
      getMatomoRequest(config, bulkConfig),
      requestOptions
    );

    return sendFilter
      ? { values: await response.json(), filters: bulkConfig }
      : response.json();
  } catch (err) {
    return {
      error: 'failed to load data',
      debug: err,
    };
  }
};
