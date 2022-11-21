import { getElibilityStatus } from '@core/infrastructure/repository/addresseInformation';
import axios from 'axios';
import crypto from 'crypto';
import FormData from 'form-data';
import type { NextApiRequest, NextApiResponse } from 'next';
import db from 'src/db';
import { withCors } from 'src/services/api/cors';
import { sendBulkEligibilityResult } from 'src/services/email';
import { EXPORT_FORMAT } from 'src/types/enum/ExportFormat';
import { v4 as uuidv4 } from 'uuid';
import XLSX from 'xlsx';
import * as yup from 'yup';

const version = 1;

const schema = yup.object().shape({
  email: yup.string().email().required(),
  addresses: yup.array().of(yup.string()).min(1).required(),
});

const headers = [
  'Adresse',
  'Adresse testée',
  "Indice de fiabilité de l'adresse testée",
  'Bâtiment potentiellement raccordable',
  'Distance au réseau (m) si < 1000 m',
  "Tracé non disponible mais présence d'un réseau dans la zone",
  'PDP (périmètre de développement prioritaire)',
];

const legend = [
  ['Adresse', 'Adresse reçue par France Chaleur Urbaine'],
  ['Adresse testée', 'Adresse testée par France Chaleur Urbaine'],
  [
    "Indice de fiabilité de l'adresse testée",
    "Min = 0 , Max = 1, Cet indice traduit la correspondance entre l'adresse renseignée par l'utilisateur et celle effectivement testée",
  ],
  [
    'Bâtiment potentiellement raccordable',
    "Résultat compilant distance au réseau et présence d'un réseau dans la zone",
  ],
  ['Distance au réseau (m) si < 1000 m', 'Distance au réseau le plus proche'],
  [
    "Tracé non disponible mais présence d'un réseau dans la zone",
    "Lorsque nous ne disposons pas de tracé d'un réseau à proximité de l'adresse testée, nous vérifions s'il existe une consommation de chaleur sur un réseau dans le quartier (données à l'iris mise à disposition par le MTE). Le cas échéant, c'est qu'il existe un réseau à proximité",
  ],
  [
    'PDP (périmètre de développement prioritaire)',
    "Si l'adresse est comprise dans un PDP, son raccordement peut être obligatoire (valable pour les nouveaux bâtiments ou ceux renouvelant leur installation de chauffage au-dessus d'une certaine puissance)",
  ],
];

const sendMail = async (id: string, email: string, addresses: any[]) => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(
    [headers].concat(
      addresses.map((address) => [
        address.address,
        address.label,
        address.score,
        address.isEligible ? 'Oui' : 'Non',
        address.distance,
        address.isEligible && address.isBasedOnIris ? 'Oui' : 'Non',
        address.inZDP ? 'Oui' : 'Non',
      ])
    )
  );
  XLSX.utils.book_append_sheet(wb, ws, 'Résultats');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(legend), 'Légende');

  await sendBulkEligibilityResult(id, email, {
    filename: 'test-eligibilite.xlsx',
    contentType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    content: XLSX.write(wb, { bookType: EXPORT_FORMAT.XLSX, type: 'base64' }),
    encoding: 'base64',
  });
  return;
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
    res.status(200).json({
      id: existingValue.id,
      error: existingValue.in_error,
      progress: existingValue.progress / addresses.length,
      result: existingValue.result,
    });

    while (!existingValue.result && !existingValue.in_error) {
      existingValue = await db('eligibility_tests')
        .where('hash', hash)
        .andWhere('version', version)
        .first();
    }

    if (existingValue.in_error) {
      await sendMail(existingValue.id, email, JSON.parse(existingValue.result));
    }

    return;
  }

  const id = uuidv4();
  try {
    await db('eligibility_tests').insert({
      id,
      version,
      email,
      hash,
      addresses_count: addresses.length,
    });

    res.status(200).json({
      id: id,
      progress: 0,
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

    const result = results.join('\n');
    await db('eligibility_tests')
      .update({
        progress: addresses.length,
        result,
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
