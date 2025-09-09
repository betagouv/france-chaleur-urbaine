import { type NextApiRequest } from 'next';
import { type z } from 'zod';

import buildContext, { type Context } from '@/modules/config/server/context-builder';
import { type DB } from '@/server/db/kysely';
import { invalidRouteError } from '@/server/helpers/server';

export type FilterConfig<_T extends keyof DB> = {
  filters?: Record<string, any>;
};

type GetConfig<_T extends keyof DB> = {
  select?: (keyof DB[_T])[];
} & FilterConfig<_T>;

export type ListConfig<_T extends keyof DB> = {
  page?: number;
  pageSize?: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
} & GetConfig<_T>;

type CrudHandlers<T extends keyof DB> = {
  create: (body: any, context: Context) => Promise<DB[T]>;
  update: (id: string, body: any, config: FilterConfig<T>, context: Context) => Promise<DB[T]>;
  remove: (id: string, config: FilterConfig<T>, context: Context) => Promise<DB[T]>;
  list: (config: ListConfig<T>, context: Context) => Promise<{ items: DB[T][]; count: number }>;
  get: (id: string, config: GetConfig<T>, context: Context) => Promise<DB[T]>;
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

export type ApiResponseQueryGet<T extends object> = ApiResponseCommon & {
  item?: T & {
    id?: string;
  };
};

export type ApiResponseQueryList<T extends object> = ApiResponseCommon & {
  items?: (T & {
    id?: string;
  })[];
  pageInfo?: {
    count: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
  };
};

export type ApiResponseMutation<T = any> = ApiResponseCommon & {
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

/**
 * Creates CRUD API handlers for a service
 *
 * @param handlers - Service handlers for CRUD operations
 * @returns Object containing HTTP method handlers (GET, POST, PUT, DELETE) and utility functions
 *
 * @example
 * import * as situationService from '@/server/services/comparateur/simulation';
 *
 * const { GET, POST, PUT, DELETE, _types } = crud<'tableName'>(serviceHandlers);
 *
 * export type ApiResponse = typeof _types;
 *
 * export default handleRouteErrors(
 *   { GET, POST, PUT, DELETE },
 *   {
 *     requireAuthentication: ['particulier', 'professionnel', 'gestionnaire', 'admin', 'demo'],
 *   }
 * );
 */
const crud = <T extends keyof DB, Validation extends CrudValidation>({
  validation,
  ...handlers
}: Partial<CrudHandlers<T>> & {
  validation?: Validation;
}) => {
  const GET_LIST = async (req: NextApiRequest): Promise<ApiResponseQueryList<DB[T]>> => {
    const slug = Array.isArray(req.query.slug) ? req.query.slug : [req.query.slug || ''];
    const id = slug.length > 0 ? slug[0] : null;
    const context = await buildContext(req);

    // Extract config from query params
    const { select, filters, page, pageSize, orderBy } = req.query;

    const listConfig: ListConfig<T> = {
      select: select ? (typeof select === 'string' ? JSON.parse(select) : select) : undefined,
      filters: filters ? (typeof filters === 'string' ? JSON.parse(filters) : filters) : undefined,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      orderBy: orderBy as Record<string, 'asc' | 'desc'> | undefined,
    };

    if (!id && handlers.list) {
      const data = await handlers.list(listConfig, context);
      const { items, count } = data;
      return {
        status: 'success',
        items,
        pageInfo: {
          count,
          page: listConfig.page,
          pageSize: listConfig.pageSize,
        },
      } as ApiResponseQueryList<DB[T]>;
    }

    throw invalidRouteError;
  };

  const GET_ONE = async (req: NextApiRequest): Promise<ApiResponseQueryGet<DB[T]>> => {
    const slug = Array.isArray(req.query.slug) ? req.query.slug : [req.query.slug || ''];
    const id = slug.length > 0 ? slug[0] : null;
    const context = await buildContext(req);
    // Extract config from query params
    const { select, filters } = req.query;

    const getConfig: GetConfig<T> = {
      select: select ? ((Array.isArray(select) ? select : [select]) as (keyof DB[T])[]) : undefined,
      filters: filters ? (typeof filters === 'string' ? JSON.parse(filters) : filters) : undefined,
    };

    if (id && handlers.get) {
      const item = await handlers.get(id, getConfig, context);
      return {
        status: 'success',
        item,
      } as ApiResponseQueryGet<DB[T]>;
    }

    throw invalidRouteError;
  };

  const GET = async (req: NextApiRequest): Promise<ApiResponseQueryGet<DB[T]> | ApiResponseQueryList<DB[T]>> => {
    const slug = Array.isArray(req.query.slug) ? req.query.slug : [req.query.slug || ''];
    const id = slug.length > 0 ? slug[0] : null;
    if (id) {
      return GET_ONE(req);
    }

    return GET_LIST(req);
  };

  const POST = async (req: NextApiRequest): Promise<ApiResponseMutation<DB[T]>> => {
    validateSchemaIfExists(validation?.create, req.body);
    const slug = Array.isArray(req.query.slug) ? req.query.slug : [req.query.slug || ''];
    const id = slug.length > 0 ? slug[0] : null;
    const context = await buildContext(req);

    if (!id && handlers.create) {
      const item = await handlers.create(req.body as Parameters<typeof handlers.create>[0], context);
      return {
        status: 'success',
        item,
      };
    }

    throw invalidRouteError;
  };

  const PUT = async (req: NextApiRequest): Promise<ApiResponseMutation<DB[T]>> => {
    validateSchemaIfExists(validation?.update, req.body);
    const slug = Array.isArray(req.query.slug) ? req.query.slug : [req.query.slug || ''];
    const id = slug.length > 0 ? slug[0] : null;
    const context = await buildContext(req);

    if (id && handlers.update) {
      const item = await handlers.update(id, req.body as Parameters<typeof handlers.update>[0], {}, context);
      return {
        status: 'success',
        item,
      };
    }

    throw invalidRouteError;
  };

  const DELETE = async (req: NextApiRequest): Promise<ApiResponseMutation<DB[T]>> => {
    validateSchemaIfExists(validation?.delete, req.body);
    const slug = Array.isArray(req.query.slug) ? req.query.slug : [req.query.slug || ''];
    const id = slug.length > 0 ? slug[0] : null;
    const context = await buildContext(req);

    if (id && handlers.remove) {
      const result = await handlers.remove(id, {}, context);
      return {
        status: 'success',
        item: result,
      };
    }

    throw invalidRouteError;
  };

  return {
    GET,
    POST,
    PUT,
    DELETE,
    GET_LIST,
    GET_ONE,
    _types: null as unknown as {
      list: Awaited<ReturnType<typeof GET_LIST>>;
      listItem: NonNullable<Awaited<ReturnType<typeof GET_LIST>>['items']>[number];
      get: Awaited<ReturnType<typeof GET_ONE>>;
      create: Awaited<ReturnType<typeof POST>>;
      update: Awaited<ReturnType<typeof PUT>>;
      delete: Awaited<ReturnType<typeof DELETE>>;
      createInput: z.infer<NonNullable<NonNullable<typeof validation>['create']>>;
      updateInput: z.infer<NonNullable<NonNullable<typeof validation>['update']>>;
    },
  };
};

type CrudValidation = Partial<Record<ValidationType, z.ZodSchema>>;

export type CrudResponse<T extends keyof DB, V extends CrudValidation> = ReturnType<typeof crud<T, V>>['_types'];

export default crud;
