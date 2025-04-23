import auth from '../auth';

// Create a client for frontend use
export const authClient = auth.createClient();

export default authClient;