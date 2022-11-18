import { getElibilityStatus } from '@core/infrastructure/repository/addresseInformation';
import axios from 'axios';
import crypto from 'crypto';
import FormData from 'form-data';
import type { NextApiRequest, NextApiResponse } from 'next';
import db from 'src/db';
import { withCors } from 'src/services/api/cors';
import { v4 as uuidv4 } from 'uuid';
import * as yup from 'yup';

const version = 1;

const schema = yup.object().shape({
  email: yup.string().email().required(),
  addresses: yup.array().of(yup.string()).min(1).required(),
});

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

  const existingValue = await db('eligibility_tests')
    .where('hash', hash)
    .andWhere('version', version)
    .first();

  if (existingValue) {
    return res.status(200).json({
      id: existingValue.id,
      error: existingValue.in_error,
      progress: existingValue.progress / addresses.length,
      result: existingValue.result,
    });
  }

  const id = uuidv4();
  res.status(200).json({
    id: id,
    progress: 0,
  });

  try {
    await db('eligibility_tests').insert({
      id,
      version,
      email,
      hash,
      addresses_count: addresses.length,
    });

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
    console.log(addressesCSV, addressesCoords);
    const addressesInformation = addressesCoords.data.split('\n');
    const results = [
      "Adresse,Adresse testée,Score,Eligibilité,Distance,Basé sur l'iris,PDP,Réseau en construction",
    ];
    let errorCount = 0;
    let eligibileCount = 0;

    for (let i = 1; i < addressesInformation.length - 1; i++) {
      const informations: string[] = addressesInformation[i].split(',');
      const score = informations[informations.length - 1];
      const label = informations[informations.length - 2];
      const lon = informations[informations.length - 3];
      const lat = informations[informations.length - 4];

      const result = await getElibilityStatus(Number(lat), Number(lon));
      results.push(
        `"${informations
          .slice(0, informations.length - 4)
          .join(',')}","${label}",${score},${result.isEligible},${
          result.distance || ''
        },${result.isEligible && result.isBasedOnIris},${result.inZDP},${
          result.futurNetwork
        }`
      );
      if (result.isEligible) {
        eligibileCount++;
      }
      if (!lat || !lon) {
        errorCount++;
      }
      await db('eligibility_tests')
        .update({
          progress: i,
        })
        .where('id', id);
    }

    const result = results.join('\n');
    await db('eligibility_tests')
      .update({
        progress: addresses.length,
        result,
        error_count: errorCount,
        eligibile_count: eligibileCount,
      })
      .where('id', id);
  } catch (e) {
    console.error(e);
    await db('eligibility_tests').update({ in_error: true }).where('id', id);
  }
};

export default withCors(bulkEligibilitygibilityStatus);
