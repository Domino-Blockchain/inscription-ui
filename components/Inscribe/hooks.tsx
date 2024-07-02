import {
  findAssociatedInscriptionAccountPda,
  findInscriptionMetadataPda,
  findMintInscriptionPda,
  safeFetchInscriptionMetadata,
} from '@metaplex-foundation/mpl-inscription';
import { DigitalAsset } from '@metaplex-foundation/mpl-token-metadata';
import { PublicKey, Umi } from '@metaplex-foundation/umi';
import { useQuery } from '@tanstack/react-query';
import { useEnv } from '@/providers/useEnv';
import { useUmi } from '@/providers/useUmi';
import { InscriptionInfo } from './types';

export async function accountExists(umi: Umi, account: PublicKey) {
  const maybeAccount = await umi.rpc.getAccount(account);
  if (maybeAccount.exists) {
    return true;
  }
  return false;
}

export const useNftJson = (nft: DigitalAsset) =>
  useQuery({
    queryKey: ['fetch-nft-json', nft.publicKey],
    queryFn: async () => {
      const j = await (await fetch(nft.metadata.uri)).json();
      return j;
    },
  });

export const useNftInscription = (
  nft: DigitalAsset,
  options: {
    inscriptionAccount?: PublicKey;
    fetchImage?: boolean;
    fetchMetadata?: boolean;
    fetchJson?: boolean;
  } = {}
) => {
  const umi = useUmi();
  const env = useEnv();

  return useQuery({
    // refetchOnMount: true,
    queryKey: ['fetch-nft-inscription', env, nft.publicKey],
    queryFn: async () => {
      const inscriptionPda = findMintInscriptionPda(umi, { mint: nft.mint.publicKey });
      const inscriptionAccount = options.inscriptionAccount ?? inscriptionPda[0];

      const inscriptionMetadataAccount = findInscriptionMetadataPda(umi, {
        inscriptionAccount,
      });
      const imagePda = findAssociatedInscriptionAccountPda(umi, {
        associationTag: 'image',
        inscriptionMetadataAccount: inscriptionMetadataAccount[0],
      });

      let image;
      let metadata;
      let imagePdaExists;
      let metadataPdaExists;

      if (options.fetchImage) {
        const acc = await umi.rpc.getAccount(imagePda[0]);
        imagePdaExists = acc.exists;
        if (acc.exists) {
          image = new Blob([acc.data]);
        }
      } else {
        imagePdaExists = await accountExists(umi, imagePda[0]);
      }

      if (options.fetchMetadata) {
        try {
          metadata = await safeFetchInscriptionMetadata(umi, inscriptionMetadataAccount[0]);
          metadataPdaExists = !!metadata;
        } catch (e) {
          console.log('Error fetching inscription metadata', e);
          metadataPdaExists = false;
        }
      } else {
        metadataPdaExists = await accountExists(umi, inscriptionAccount);
      }

      let json;
      let pdaExists;
      let jsonValid = false;
      if (options.fetchJson) {
        const acc = await umi.rpc.getAccount(inscriptionAccount);
        pdaExists = acc.exists;
        if (acc.exists) {
          try {
            json = JSON.parse(Buffer.from(acc.data).toString('utf8'));
            jsonValid = true;
          } catch (e) {
            console.log('Error parsing inscription metadata', e);
          }

          if (!json) {
            try {
              json = JSON.parse(Buffer.from(acc.data).toString('ascii'));
              jsonValid = true;
            } catch (e) {
              console.log('Error parsing inscription metadata 2', e);
            }
          }

          if (!json) {
            try {
              json = Buffer.from(acc.data).toString('utf8');
            } catch (e) {
              console.log('Error parsing inscription metadata 3', e);
            }
          }
        }
      } else {
        pdaExists = await accountExists(umi, inscriptionAccount);
      }

      return {
        inscriptionPda,
        inscriptionMetadataAccount,
        imagePda,
        pdaExists,
        metadataPdaExists,
        imagePdaExists,
        image,
        metadata,
        json,
        jsonValid,
      } as InscriptionInfo;
    },
  });
};

export const useUriBlob = (uri: string) =>
  useQuery({
    queryKey: ['fetch-uri-blob', uri],
    queryFn: async () => {
      if (!uri) {
        return null;
      }
      const blob = await (await fetch(uri)).blob();
      return blob;
    },
  });

export const useNftJsonWithImage = (asset: DigitalAsset) => {
  const { isPending: jsonPending, data: json } = useNftJson(asset);
  const { isPending: imagePending, data: blob } = useUriBlob(json?.image);

  return { isPending: jsonPending || imagePending, json, image: blob };
};
