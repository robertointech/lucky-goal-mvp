"use client";

import React, {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { setupWalletSelector } from "@near-wallet-selector/core";
import type {
  WalletSelector,
  AccountState,
} from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui";
import type { WalletSelectorModal } from "@near-wallet-selector/modal-ui";
import { setupBitteWallet } from "@near-wallet-selector/bitte-wallet";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupNightly } from "@near-wallet-selector/nightly";
import { setupEthereumWallets } from "@near-wallet-selector/ethereum-wallets";
import { wagmiConfig, queryClient } from "@/lib/wagmi-config";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import * as wagmiCore from "@wagmi/core";
import { nearConfig, NEAR_CONTRACT_ID } from "@/lib/near-config";
import "@near-wallet-selector/modal-ui/styles.css";

export type NearWalletContextType = {
  selector: WalletSelector | null;
  modal: WalletSelectorModal | null;
  accountId: string | null;
  accounts: AccountState[];
  isConnected: boolean;
  isLoading: boolean;
};

export const NearWalletContext = createContext<NearWalletContextType>({
  selector: null,
  modal: null,
  accountId: null,
  accounts: [],
  isConnected: false,
  isLoading: true,
});

function NearWalletInner({ children }: { children: ReactNode }) {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<WalletSelectorModal | null>(null);
  const [accounts, setAccounts] = useState<AccountState[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const accountId = accounts.find((a) => a.active)?.accountId ?? null;

  const init = useCallback(async () => {
    const modules = [
      setupMyNearWallet(),
      setupBitteWallet(),
      setupHereWallet(),
      setupNightly(),
      setupEthereumWallets({
        wagmiConfig: wagmiConfig as any,
        wagmiCore: wagmiCore as any,
        alwaysOnboardDuringSignIn: true,
      }),
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const _selector = await setupWalletSelector({
      network: nearConfig.networkId,
      modules: modules as any,
    });

    const _modal = setupModal(_selector, {
      contractId: NEAR_CONTRACT_ID,
    });

    const state = _selector.store.getState();
    setAccounts(state.accounts);
    setSelector(_selector);
    setModal(_modal);
    setIsLoading(false);

    const subscription = _selector.store.observable.subscribe((state) => {
      setAccounts(state.accounts);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    init().catch(console.error);
  }, [init]);

  return (
    <NearWalletContext.Provider
      value={{
        selector,
        modal,
        accountId,
        accounts,
        isConnected: !!accountId,
        isLoading,
      }}
    >
      {children}
    </NearWalletContext.Provider>
  );
}

export function NearWalletProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <NearWalletInner>{children}</NearWalletInner>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
