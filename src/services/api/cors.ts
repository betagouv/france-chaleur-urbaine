import Cors from 'cors';
import { type NextApiHandler, type NextApiRequest, type NextApiResponse } from 'next';

const cors = Cors({
  methods: ['GET', 'POST', 'HEAD', 'OPTIONS'],
  origin: '*',
});

function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: Function) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }

      return resolve(result);
    });
  });
}

export const withCors =
  (fn: NextApiHandler) =>
  async (req: NextApiRequest, res: NextApiResponse): Promise<unknown> => {
    await runMiddleware(req, res, cors);
    return fn(req, res);
  };
