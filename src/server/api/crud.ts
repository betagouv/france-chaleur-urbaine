import { type NextApiRequest } from 'next';
import { type z } from 'zod';

import buildContext, { type Context } from './context-builder';

export type ListConfig = {
  select?: string[];
  filter?: Record<string, any>;
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
};

type GetConfig = {
  select?: string[];
  filter?: Record<string, any>;
};

type CrudHandlers<T = any> = {
  create: (body: any, context: Context) => Promise<T>;
  update: (id: string, body: any, context: Context) => Promise<T>;
  remove: (id: string, context: Context) => Promise<T>;
  list: (config: ListConfig, context: Context) => Promise<T[]>;
  get: (id: string, config: GetConfig, context: Context) => Promise<T>;
};

export { type Context };

type ApiResponseCommon =
  | {
      status: 'error';
      error: string;
    }
  | {
      status: 'success';
    };

type ApiResponseQueryGet<T = any> = ApiResponseCommon & {
  item?: T;
};

type ApiResponseQueryList<T = any> = ApiResponseCommon & {
  items?: T[];
  pageInfo?: {
    count: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
  };
};

type ApiResponseMutation<T = any> = ApiResponseCommon & {
  item?: T;
};

type ValidationType = 'create' | 'update' | 'delete';

const validateSchemaIfExists = (schema?: z.ZodSchema, body?: any) => {
  if (!schema) return true;

  const result = schema.safeParse(body);
  if (!result.success) {
    throw new Error(`Validation error: ${result.error.message}`);
  }
  return result;
};

const crud = <T = any>({
  validation,
  ...handlers
}: Partial<CrudHandlers<T>> & {
  validation?: Partial<Record<ValidationType, z.ZodSchema>>;
}) => {
  const GET_LIST = async (req: NextApiRequest): Promise<ApiResponseQueryList<T>> => {
    const slug = Array.isArray(req.query.slug) ? req.query.slug : [req.query.slug || ''];
    const id = slug.length > 0 ? slug[0] : null;
    const context = buildContext(req);

    // Extract config from query params
    const { select, filter, page, pageSize, orderBy, orderDirection, ...restQuery } = req.query;

    const listConfig: ListConfig = {
      select: select ? (Array.isArray(select) ? select : [select]) : undefined,
      filter: filter ? (typeof filter === 'string' ? JSON.parse(filter) : filter) : restQuery,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      orderBy: orderBy as string | undefined,
      orderDirection: orderDirection as 'asc' | 'desc' | undefined,
    };

    try {
      if (!id && handlers.list) {
        const data = await handlers.list(listConfig, context);
        const items = Array.isArray(data) ? data : [];
        return {
          status: 'success',
          items,
          pageInfo: {
            count: items.length,
            page: listConfig.page,
            pageSize: listConfig.pageSize,
          },
        } as ApiResponseQueryList<T>;
      }

      return {
        status: 'error',
        error: 'Method not allowed',
      };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  const GET_ONE = async (req: NextApiRequest): Promise<ApiResponseQueryGet<T>> => {
    const slug = Array.isArray(req.query.slug) ? req.query.slug : [req.query.slug || ''];
    const id = slug.length > 0 ? slug[0] : null;
    const context = buildContext(req);
    // Extract config from query params
    const { select, filter } = req.query;

    const getConfig: GetConfig = {
      select: select ? (Array.isArray(select) ? select : [select]) : undefined,
      filter: filter ? (typeof filter === 'string' ? JSON.parse(filter) : filter) : undefined,
    };

    try {
      if (id && handlers.get) {
        const item = await handlers.get(id, getConfig, context);
        return {
          status: 'success',
          item,
        } as ApiResponseQueryGet<T>;
      }

      return {
        status: 'error',
        error: 'Method not allowed',
      };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  const GET = async (req: NextApiRequest): Promise<ApiResponseQueryGet<T> | ApiResponseQueryList<T>> => {
    const slug = Array.isArray(req.query.slug) ? req.query.slug : [req.query.slug || ''];
    const id = slug.length > 0 ? slug[0] : null;

    if (id) {
      return GET_ONE(req);
    }

    return GET_LIST(req);
  };

  const POST = async (req: NextApiRequest): Promise<ApiResponseMutation<T>> => {
    try {
      validateSchemaIfExists(validation?.create, req.body);
      const slug = Array.isArray(req.query.slug) ? req.query.slug : [req.query.slug || ''];
      const id = slug.length > 0 ? slug[0] : null;
      const context = buildContext(req);

      if (!id && handlers.create) {
        const item = await handlers.create(req.body, context);
        return {
          status: 'success',
          item,
        };
      }

      return {
        status: 'error',
        error: 'Method not allowed',
      };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  const PUT = async (req: NextApiRequest): Promise<ApiResponseMutation<T>> => {
    try {
      validateSchemaIfExists(validation?.update, req.body);
      const slug = Array.isArray(req.query.slug) ? req.query.slug : [req.query.slug || ''];
      const id = slug.length > 0 ? slug[0] : null;
      const context = buildContext(req);

      if (id && handlers.update) {
        const item = await handlers.update(id, req.body, context);
        return {
          status: 'success',
          item,
        };
      }

      return {
        status: 'error',
        error: 'Method not allowed',
      };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  const DELETE = async (req: NextApiRequest): Promise<ApiResponseMutation<T>> => {
    try {
      validateSchemaIfExists(validation?.delete, req.body);
      const slug = Array.isArray(req.query.slug) ? req.query.slug : [req.query.slug || ''];
      const id = slug.length > 0 ? slug[0] : null;
      const context = buildContext(req);

      if (id && handlers.remove) {
        const result = await handlers.remove(id, context);
        return {
          status: 'success',
          item: result,
        };
      }

      return {
        status: 'error',
        error: 'Method not allowed',
      };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  return { GET, POST, PUT, DELETE, GET_LIST, GET_ONE };
};

export default crud;
