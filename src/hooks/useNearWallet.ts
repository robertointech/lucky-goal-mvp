"use client";

import { useContext, useCallback } from "react";
import { NearWalletContext } from "@/providers/NearWalletProvider";
import type { Action } from "@near-wallet-selector/core";
import { JsonRpcProvider } from "near-api-js";
import { nearConfig } from "@/lib/near-config";

export function useNearWallet() {
  const { selector, modal, accountId, accounts, isConnected, isLoading } =
    useContext(NearWalletContext);

  const connect = useCallback(() => {
    if (modal) modal.show();
  }, [modal]);

  const disconnect = useCallback(async () => {
    if (!selector) return;
    const wallet = await selector.wallet();
    await wallet.signOut();
  }, [selector]);

  const signAndSendTransaction = useCallback(
    async (params: {
      receiverId: string;
      actions: Action[];
    }) => {
      if (!selector) throw new Error("Wallet not initialized");
      const wallet = await selector.wallet();
      return wallet.signAndSendTransaction({
        receiverId: params.receiverId,
        actions: params.actions,
      });
    },
    [selector]
  );

  const viewFunction = useCallback(
    async <T = unknown>(params: {
      contractId: string;
      methodName: string;
      args?: Record<string, unknown>;
    }): Promise<T> => {
      const provider = new JsonRpcProvider({
        url: nearConfig.nodeUrl,
      });
      const args = params.args ? JSON.stringify(params.args) : "";
      const argsBase64 = Buffer.from(args).toString("base64");

      const result = await provider.query({
        request_type: "call_function",
        account_id: params.contractId,
        method_name: params.methodName,
        args_base64: argsBase64,
        finality: "optimistic",
      });

      const res = result as unknown as { result: number[] };
      return JSON.parse(Buffer.from(res.result).toString()) as T;
    },
    []
  );

  return {
    accountId,
    accounts,
    isConnected,
    isLoading,
    connect,
    disconnect,
    signAndSendTransaction,
    viewFunction,
    selector,
    modal,
  };
}
