import {
  getElibilityStatus,
  getExport,
} from '@core/infrastructure/repository/addresseInformation';
import axios from 'axios';
import crypto from 'crypto';
import FormData from 'form-data';
import type { NextApiRequest, NextApiResponse } from 'next';
import db from 'src/db';
import { withCors } from 'src/services/api/cors';
import { sendBulkEligibilityResult } from 'src/services/email';
import { v4 as uuidv4 } from 'uuid';
import * as yup from 'yup';

const version = 1;

const schema = yup.object().shape({
  email: yup.string().email().required(),
  addresses: yup.array().of(yup.string()).min(1).required(),
});

const sendMail = async (id: string, email: string, addresses: any[]) => {
  await sendBulkEligibilityResult(id, email, {
    filename: 'test-eligibilite.xlsx',
    contentType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    content: getExport(addresses),
    encoding: 'base64',
  });

  await db('eligibility_demands').insert({
    eligibility_test_id: id,
    email,
  });
};

const bulkEligibilitygibilityStatus = async (
  req: NextApiRequest,
  res: NextApiResponse<
    { id: string; progress: number; result?: string; error?: boolean } | string
  >
) => {
  if (req.method !== 'POST') {
    return res.status(501);
  }

  if (!(await schema.isValid(req.body))) {
    return res.status(400).send('Error');
  }

  const { addresses, email } = req.body;

  const addressesCSV = [''].concat(addresses).join('\n');
  const hash = crypto.createHash('sha1').update(addressesCSV).digest('hex');

  let existingValue = await db('eligibility_tests')
    .where('hash', hash)
    .andWhere('version', version)
    .first();

  if (existingValue) {
    res.status(200).send('File already exists, send email');
    while (!existingValue.result && !existingValue.in_error) {
      existingValue = await db('eligibility_tests')
        .where('id', existingValue.id)
        .first();
    }

    if (!existingValue.in_error) {
      await sendMail(existingValue.id, email, JSON.parse(existingValue.result));
    }

    return;
  }

  const id = uuidv4();
  try {
    await db('eligibility_tests').insert({
      id,
      version,
      hash,
      addresses_count: addresses.length,
    });

    res
      .status(200)
      .send('File do not exists, computing result then send email');

    const form = new FormData();
    form.append('data', addressesCSV, 'file.csv');
    form.append('result_columns', 'latitude');
    form.append('result_columns', 'longitude');
    form.append('result_columns', 'result_label');
    form.append('result_columns', 'result_score');

    const addressesCoords = await axios.post(
      'https://api-adresse.data.gouv.fr/search/csv/',
      form,
      {
        headers: form.getHeaders(),
      }
    );

    const addressesInformation = addressesCoords.data.split('\n');
    const results = [];
    let errorCount = 0;
    let eligibileCount = 0;

    for (let i = 1; i < addressesInformation.length - 1; i++) {
      const informations: string[] = addressesInformation[i].split(',');
      const score = informations[informations.length - 1];
      const label = informations[informations.length - 2];
      const lon = informations[informations.length - 3];
      const lat = informations[informations.length - 4];
      const address = informations.slice(0, informations.length - 4).join(',');

      const result = label
        ? await getElibilityStatus(Number(lat), Number(lon))
        : { isEligible: null };
      results.push({ ...result, address, score, label, lat, lon });

      if (result.isEligible) {
        eligibileCount++;
      }
      if (!lat || !lon) {
        errorCount++;
      }
    }

    await db('eligibility_tests')
      .update({
        result: JSON.stringify(results),
        error_count: errorCount,
        eligibile_count: eligibileCount,
      })
      .where('id', id);

    await sendMail(id, email, results);
  } catch (e) {
    console.error(e);
    await db('eligibility_tests').update({ in_error: true }).where('id', id);
  }
};

export default withCors(bulkEligibilitygibilityStatus);
