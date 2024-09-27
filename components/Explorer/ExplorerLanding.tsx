import { Box, Center, Loader, SimpleGrid, Text, Title } from '@mantine/core';
import {
  deserializeInscriptionMetadata,
  findAssociatedInscriptionAccountPda,
  findInscriptionMetadataPda,
  findMintInscriptionPda,
} from '@metaplex-foundation/mpl-inscription';
import { fetchAllDigitalAssetByOwner } from '@metaplex-foundation/mpl-token-metadata';
import { useQuery } from '@tanstack/react-query';
import { useUmi } from '@/providers/useUmi';
import { useEnv } from '@/providers/useEnv';
import { InscriptionInfo } from '../Inscribe/types';
import { ExplorerNftCard } from './ExplorerNftCard';
import strings from '@/localization';

export function ExplorerLanding() {
  const umi = useUmi();
  const env = useEnv();

  const {
    error,
    isPending,
    data: nfts,
  } = useQuery({
    queryKey: ['fetch-nfts-by-owner', env, umi.identity.publicKey],
    queryFn: async () => {
      const assets = await fetchAllDigitalAssetByOwner(umi, umi.identity.publicKey);
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

      const result = infos
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

      return result;
    },
  });

  return (
    <Box mt="xl">
      <Title mb="lg">{strings.yourInscriptionsTitle}</Title>
      {isPending ? (
        <Center h="20vh">
          <Loader />
        </Center>
      ) : error ? (
        <Center h="20vh" ta="center">
          <Text>{strings.errorFetchingInscriptions}</Text>
        </Center>
      ) : nfts?.length ? (
        <SimpleGrid
          cols={{
            base: 1,
            sm: 2,
            lg: 5,
            xl: 6,
          }}
        >
          {nfts?.map((nft) => <ExplorerNftCard nft={nft} key={nft.asset.mint.publicKey} />)}
        </SimpleGrid>
      ) : (
        <Center h="20vh" ta="center">
          <Text>{strings.youDontHaveAnyInscriptions}</Text>
        </Center>
      )}
    </Box>
  );
}
