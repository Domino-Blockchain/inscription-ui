import { Center, Loader, SimpleGrid, Text, Title } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import {
  MPL_INSCRIPTION_PROGRAM_ID,
  deserializeInscriptionMetadata,
  fetchAllInscriptionMetadata,
  findAssociatedInscriptionAccountPda,
  findInscriptionMetadataPda,
  findMintInscriptionPda,
} from '@metaplex-foundation/mpl-inscription';
import { useEnv } from '@/providers/useEnv';
import { ExplorerNftCard } from './ExplorerNftCard';
import { useUmi } from '@/providers/useUmi';
import { publicKey } from '@metaplex-foundation/umi';
import { fetchAllDigitalAsset } from '@metaplex-foundation/mpl-token-metadata';
import { InscriptionInfo } from '@/components/Inscribe/types';
import strings from '@/localization';

export function ExplorerRecent() {
  const env = useEnv();
  const umi = useUmi();
  const {
    error,
    isPending,
    data: nfts,
  } = useQuery({
    queryKey: ['fetch-recent-inscriptions', env],
    queryFn: async () => {
      const response = await fetch('http://devnet.domichain.io:4242/inscriptions');
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        return null;
      }

      const assets = await fetchAllDigitalAsset(
        umi,
        data.map((item) => publicKey(item.mint_account))
      );
      const infos: Pick<
        InscriptionInfo,
        'inscriptionPda' | 'inscriptionMetadataAccount' | 'imagePda'
      >[] = assets.map((nft) => {
        const inscriptionPda = findMintInscriptionPda(umi, { mint: nft.mint.publicKey });
        const inscriptionMetadataAccount = findInscriptionMetadataPda(umi, {
          inscriptionAccount: inscriptionPda[0],
        });
        const imagePda = findAssociatedInscriptionAccountPda(umi, {
          associationTag: 'image',
          inscriptionMetadataAccount: inscriptionMetadataAccount[0],
        });

        return {
          inscriptionPda,
          inscriptionMetadataAccount,
          imagePda,
        };
      });

      const inscriptionMetadataAccounts = await umi.rpc.getAccounts(
        infos.map((info) => info.inscriptionMetadataAccount[0]),
        {
          commitment: 'confirmed',
        }
      );

      const inscriptionMetadata = inscriptionMetadataAccounts.map((account) => {
        if (!account.exists) {
          return undefined;
        }
        try {
          return deserializeInscriptionMetadata(account);
        } catch (e) {
          console.error('deserialize error', e);
        }
        return undefined;
      });

      return infos
        .map((info, i) => ({
          ...info,
          asset: assets[i],
          metadata: inscriptionMetadata[i],
        }))
        .filter((nft) => nft.metadata)
        .sort((a, b) => {
          const aRank = a.metadata?.inscriptionRank || BigInt(0);
          const bRank = b.metadata?.inscriptionRank || BigInt(0);

          if (aRank > bRank) {
            return 1;
          }
          if (aRank < bRank) {
            return -1;
          }
          return 0;
        });
    },
  });

  return (
    <>
      <Title mb="lg">{strings.recentInscriptionsTitle}</Title>
      {isPending ? (
        <Center h="20vh">
          <Loader />
        </Center>
      ) : error ? (
        <Center h="20vh" ta="center">
          <Text>{strings.unableToFetchRecentInscriptions}</Text>
        </Center>
      ) : nfts?.length === 0 ? (
        <Center h="20vh" ta="center">
          <Text>{strings.noRecentInscriptionsYet}</Text>
        </Center>
      ) : (
        <SimpleGrid
          cols={{
            xs: 1,
            sm: 2,
            lg: 3,
          }}
          spacing="lg"
          pb="xl"
        >
          {nfts?.map((nft) => <ExplorerNftCard key={nft.asset.publicKey} nft={nft} />)}
        </SimpleGrid>
      )}
    </>
  );
}
