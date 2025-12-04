import { configDotenv } from 'dotenv';

// This file is imported and executed first before any other import
// in the entrypoint of the server and the clock
configDotenv({ path: ['.env.local', '.env'] });
