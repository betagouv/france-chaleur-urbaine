import networkByIris from '../src/core//infrastructure/repository/network_by_iris.json';
import db from '../src/db';

const cleanTable = async () => {
  console.log(networkByIris.length);
  const toCheck = networkByIris
    .map((x) => String(x.code).padStart(9, '0'))
    .filter((x) => !x.includes('x'))
    .filter((x) => x !== '940220101')
    .filter((x) => x !== '940220104');
  console.log(toCheck.length);
  console.log(new Set(toCheck).size);
  const result = await db('iris').delete().whereNotIn('code_iris', toCheck);
  console.log(result.length);
  console.log(
    toCheck.filter((x) => !result.map((x) => x.code_iris).includes(x))
  );
};

cleanTable();
