import { Client, Account, Databases } from 'appwrite';

const client = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

// Initialize Appwrite account instance
const account = new Account(client);

// Initialize Appwrite database instance
const database = new Databases(client);

// Check if there's an existing session
const checkSession = async () => {
    try {
        const session = await account.getSession('current');
        return session;
    } catch (error) {
        return null;
    }
};

export { client, account, database, checkSession };