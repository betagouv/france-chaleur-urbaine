const MATOMO_URL = process.env.MATOMO_URL;
const MATOMO_TOKEN = process.env.MATOMO_TOKEN;
const MATOMO_ID_SITE = process.env.MATOMO_ID_SITE;

const matomoRequestDefaultConfig = {
  token_auth: MATOMO_TOKEN,
  idSite: MATOMO_ID_SITE,
  format: 'JSON',
  module: 'API',
};

type ConfigType = Record<string, unknown>;

const configToRequest = (config: ConfigType) =>
  Object.entries(config).reduce(
    (acc, [key, value], i) => `${acc}${i === 0 ? '?' : '&'}${key}=${value}`,
    ''
  );

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
              configToRequest({ ...config, ...configEntry })
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
  const strConfig = configToRequest(computedConfig);
  return `${MATOMO_URL}${strConfig}`;
};

export const fetchFromMatomo = async (
  config: ConfigType = {},
  bulkConfig: ConfigType[] = [],
  sendFilter?: boolean
) => {
  const requestOptions: RequestInit = {
    method: 'GET',
    redirect: 'follow',
  };

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
