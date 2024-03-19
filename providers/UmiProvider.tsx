import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { ReactNode, useMemo } from 'react';
import { nftStorageUploader } from '@metaplex-foundation/umi-uploader-nft-storage';
import { mplInscription } from '@metaplex-foundation/mpl-inscription';
import { UmiContext } from './useUmi';

export const UmiProvider = ({ children }: { children: ReactNode }) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  // let nftStorageToken = process.env.NFTSTORAGE_TOKEN;
  // if (!nftStorageToken || nftStorageToken === 'AddYourTokenHere'){
  //   console.error("Add your nft.storage Token to .env!");
  //   nftStorageToken = 'AddYourTokenHere';
  // }
  const umi = useMemo(
    () =>
      createUmi(connection)
        .use(walletAdapterIdentity(wallet))
        .use(mplTokenMetadata())
        .use(nftStorageUploader({ token: process.env.NEXT_PUBLIC_NFTSTORAGE_TOKEN! }))
        .use(mplInscription()),
    [wallet, connection]
  );

  return <UmiContext.Provider value={{ umi }}>{children}</UmiContext.Provider>;
};
