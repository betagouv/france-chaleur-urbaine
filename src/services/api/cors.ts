import Cors from 'cors';
import { type NextApiHandler, type NextApiRequest, type NextApiResponse } from 'next';

const cors = Cors({
  methods: ['GET', 'POST', 'HEAD', 'OPTIONS'],
  origin: '*',
});

function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: (req: NextApiRequest, res: NextApiResponse, cb: (result: unknown) => void) => void
) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: unknown) => {
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
