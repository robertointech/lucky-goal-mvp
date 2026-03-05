import { createThirdwebClient } from "thirdweb";

// Client ID from environment variable
const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;

if (!clientId) {
  throw new Error("Missing NEXT_PUBLIC_THIRDWEB_CLIENT_ID");
}

export const client = createThirdwebClient({
  clientId: clientId,
});

// Avalanche Fuji Testnet Chain ID
export const AVALANCHE_FUJI_CHAIN_ID = 43113;
