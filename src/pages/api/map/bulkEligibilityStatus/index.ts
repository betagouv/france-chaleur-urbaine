import crypto from 'crypto';

import axios from 'axios';
import FormData from 'form-data';
import type { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
import * as yup from 'yup';

import db from '@/server/db';
import base from '@/server/db/airtable';
import { sendBulkEligibilityError, sendBulkEligibilityErrorAdmin, sendBulkEligibilityResult } from '@/server/email';
import { logger } from '@/server/helpers/logger';
import { getEligilityStatus, getExport } from '@/server/services/addresseInformation';
import { withCors } from '@/services/api/cors';
import { Airtable } from '@/types/enum/Airtable';
import { CSVToArray } from '@/utils/csv';

const version = 8;

const schema = yup.object().shape({
  email: yup.string().email().required(),
  addresses: yup.string().required(),
});

const sendMail = async (id: string, email: string, addresses: any[]) => {
  await sendBulkEligibilityResult(id, email, {
    filename: 'test-eligibilite.xlsx',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    content: getExport(addresses),
    encoding: 'base64',
  });

  await db('eligibility_demands').insert({
    eligibility_test_id: id,
    email,
  });
};

const sendErrorMail = async (email: string, addresses: string) => {
  await Promise.all([
    sendBulkEligibilityError(email),
    sendBulkEligibilityErrorAdmin(process.env.ERROR_EMAIL, email, {
      filename: 'file.txt',
      contentType: 'text/plain',
      content: addresses,
      encoding: 'utf-8',
    }),
  ]);
};

const bulkEligibilitygibilityStatus = async (
  req: NextApiRequest,
  res: NextApiResponse<{ id: string; progress: number; result?: string; error?: boolean } | string>
) => {
  if (req.method !== 'POST') {
    return res.status(501);
  }

  if (!(await schema.isValid(req.body))) {
    return res.status(400).send('Error');
  }

  const { addresses, email } = req.body;
  const formattedAddresses = CSVToArray(addresses, ',')
    .map((x) => x.join(','))
    .filter((x) => x)
    .map((x) => `"${x.replaceAll('"', '')}"`);
  const addressesCSV = [''].concat(formattedAddresses).join('\n');

  const currentDate = new Date();
  const hash = crypto
    .createHash('sha1')
    .update(currentDate.toString() + addressesCSV)
    .digest('hex');

  const jobLogger = logger.child({ hash });
  const start = Date.now();

  let existingEligibilityTest = await db('eligibility_tests').where('hash', hash).andWhere('version', version).first();

  if (existingEligibilityTest) {
    res.status(200).send('File already exists, send email');
    while (!existingEligibilityTest.result && !existingEligibilityTest.in_error) {
      existingEligibilityTest = await db('eligibility_tests').where('id', existingEligibilityTest.id).first();
    }

    if (existingEligibilityTest.in_error) {
      jobLogger.info('existing file with errors, send');
      await db('eligibility_demands').insert({
        eligibility_test_id: existingEligibilityTest.id,
        email,
      });
    } else {
      jobLogger.info('existing file, send results by email');
      await sendMail(existingEligibilityTest.id, email, JSON.parse(existingEligibilityTest.result));
    }

    return;
  }

  const id = uuidv4();
  try {
    jobLogger.info('launch bulk eligibility computation', {
      addresses_count: formattedAddresses.length,
    });
    res.status(200).send('File do not exists, computing result then send email');

    await db('eligibility_tests').insert({
      id,
      version,
      hash,
      addresses_count: formattedAddresses.length,
      file: addresses,
    });

    const form = new FormData();
    form.append('data', addressesCSV, 'file.csv');
    form.append('result_columns', 'latitude');
    form.append('result_columns', 'longitude');
    form.append('result_columns', 'result_label');
    form.append('result_columns', 'result_score');
    form.append('result_columns', 'result_city');

    const addressesCoords = await axios.post('https://api-adresse.data.gouv.fr/search/csv/', form, {
      headers: form.getHeaders(),
    });

    const addressesInformation = CSVToArray(addressesCoords.data as string, ',');
    const results = [];
    let errorCount = 0;
    let eligibileCount = 0;

    for (let i = 1; i < addressesInformation.length - 1; i++) {
      const informations: string[] = addressesInformation[i];
      const city = informations[informations.length - 1];
      const score = informations[informations.length - 2];
      const label = informations[informations.length - 3];
      const lon = informations[informations.length - 4];
      const lat = informations[informations.length - 5];
      const address = informations.slice(0, informations.length - 5).join(',');

      const result = label ? await getEligilityStatus(Number(lat), Number(lon), city) : { isEligible: null };
      results.push({
        ...result,
        city,
        address,
        score: Math.round(Number.parseFloat(score) * 1000) / 1000,
        label,
        lat,
        lon,
      });

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
    base(Airtable.DEMANDES_ELIGIBILITES).create(
      [
        {
          fields: {
            id: id,
            Emails: email,
            Date: new Date().toISOString(),
            "Nombre d'adresses": formattedAddresses.length,
            "Nombre d'erreurs": errorCount,
            "Nombre d'adresses éligibles": eligibileCount,
            'En erreur': 'Non',
          },
        },
      ],
      {
        typecast: true,
      }
    );

    await sendMail(id, email, results);
    jobLogger.info('computed bulk eligibility computation', {
      duration: (Date.now() - start) / 1000,
    });
  } catch (err: any) {
    jobLogger.error('crashed bulk eligibility computation', {
      error: err.message,
      stack: err.stack,
      duration: (Date.now() - start) / 1000,
    });
    await db('eligibility_tests').update({ in_error: true }).where('id', id);
    await db('eligibility_demands').insert({
      eligibility_test_id: id,
      email,
    });
    base(Airtable.DEMANDES_ELIGIBILITES).create(
      [
        {
          fields: {
            id: id,
            Emails: email,
            Date: new Date().toISOString(),
            "Nombre d'adresses": formattedAddresses.length,
            'En erreur': 'Oui',
          },
        },
      ],
      {
        typecast: true,
      }
    );
    await sendErrorMail(email, addresses);
  }
};

export default withCors(bulkEligibilitygibilityStatus);
