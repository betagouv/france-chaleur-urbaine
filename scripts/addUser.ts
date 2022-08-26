import bcrypt from 'bcryptjs';
import db from '../src/db';

const addUser = async (
  email: string,
  password: string,
  gestionnaire: string
) => {
  const user = await db('users').select().where({ email }).first();

  if (user) {
    console.error(`email ${email} already exists`);
    process.exit(1);
  }
  const salt = await bcrypt.genSalt(10);

  await db('users').insert({
    email,
    password: bcrypt.hashSync(password, salt),
    gestionnaire,
  });
  console.info('User created');
  process.exit(0);
};

if (process.argv.length !== 5) {
  console.info(
    'Usage: export NODE_PATH=./ && npx ts-node scripts/addUser.ts email password gestionnaire'
  );
  process.exit(1);
}

const email = process.argv[2];
const password = process.argv[3];
const gestionnaire = process.argv[4];

addUser(email.toLowerCase(), password, gestionnaire);
