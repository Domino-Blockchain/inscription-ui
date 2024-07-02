'use client';

import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { ReactNode, useMemo, useState } from 'react';
import { Notifications } from '@mantine/notifications';
import { AppShell } from '@mantine/core';
import { ReactQueryStreamedHydration } from '@tanstack/react-query-next-experimental';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { DWalletExtensionWalletAdapter } from 'dwallet';
import { Header } from '@/components/Header/Header';
import { UmiProvider } from './UmiProvider';
import { EnvProvider } from './EnvProvider';
import { Env } from './useEnv';

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const queryEnv = searchParams.get('env');
  const [client] = useState(new QueryClient());
  const [env, setEnv] = useState<Env>(
    queryEnv === 'mainnet-beta' || queryEnv === 'devnet' ? queryEnv : 'mainnet-beta'
  );
  const wallets = useMemo(
    () => [
      new DWalletExtensionWalletAdapter(),
      // new PhantomWalletAdapter(),
      // new SolflareWalletAdapter(),
    ],
    []
  );

  const doSetEnv = (e: Env) => {
    const params = new URLSearchParams(window.location.search);
    params.set('env', e);

    setEnv(e);
    router.push(`${pathname}?${params.toString()}`);
  };

  const endpoint = useMemo(() => {
    switch (env) {
      case 'mainnet-beta':
        return process.env.NEXT_PUBLIC_MAINNET_RPC_URL;
      case 'devnet':
      default:
        return process.env.NEXT_PUBLIC_DEVNET_RPC_URL;
    }
  }, [env]);

  return (
    <EnvProvider env={env!}>
      <ConnectionProvider endpoint={endpoint!}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <UmiProvider>
              <QueryClientProvider client={client}>
                <ReactQueryStreamedHydration>
                  <Notifications />
                  <AppShell
                    header={{ height: 80 }}
                    style={{
                      backgroundColor: '#1a1a1a',
                    }}
                  >
                    <AppShell.Header>
                      <Header env={env} setEnv={doSetEnv} />
                    </AppShell.Header>
                    <AppShell.Main>{children}</AppShell.Main>
                  </AppShell>
                </ReactQueryStreamedHydration>
              </QueryClientProvider>
            </UmiProvider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </EnvProvider>
  );
}
