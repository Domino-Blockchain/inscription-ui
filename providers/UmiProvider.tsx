import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { ReactNode, useMemo } from 'react';
import { nftStorageUploader } from '@metaplex-foundation/umi-uploader-nft-storage';
import { mplInscription } from '@metaplex-foundation/mpl-inscription';
import { dasApi } from '@metaplex-foundation/digital-asset-standard-api';
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
        .use(
          nftStorageUploader({
            token:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweEYxNTU2NjMwMDIzZjA5Nzc2N0Y3MzI3NkFFQzg2MTE2QjBCN0RjNjciLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTcxMDc2Mzg5MTMxMiwibmFtZSI6InRlc3QifQ.kjDTecaJMjASC9deYiF5Q5VdQDrvj_5M4yQSG9xG94g',
          })
        )
        .use(dasApi())
        .use(mplInscription()),
    [wallet, connection]
  );

  return <UmiContext.Provider value={{ umi }}>{children}</UmiContext.Provider>;
};
