import bcrypt from 'bcryptjs';
import { USER_ROLE } from 'src/types/enum/UserRole';
import db from '../src/db';

const roles = Object.values(USER_ROLE);
const addUser = async (
  email: string,
  password: string,
  role: USER_ROLE,
  gestionnaire: string
) => {
  if (!roles.includes(role)) {
    console.error(`${role} does not exist`);
    process.exit(1);
  }

  const user = await db('users').select().where({ email }).first();

  if (user) {
    console.error(`email ${email} already exists`);
    process.exit(1);
  }
  const salt = await bcrypt.genSalt(10);

  await db('users').insert({
    email,
    password: bcrypt.hashSync(password, salt),
    role,
    gestionnaire,
  });
  console.info('User created');
  process.exit(0);
};

if (process.argv.length !== 5 && process.argv.length !== 6) {
  console.info(
    'Usage: export NODE_PATH=./ && npx ts-node scripts/addUser.ts email password role [gestionnaire]'
  );
  process.exit(1);
}

const email = process.argv[2];
const password = process.argv[3];
const role = process.argv[4] as USER_ROLE;
const gestionnaire = process.argv[5];

addUser(email.toLowerCase(), password, role, gestionnaire);
