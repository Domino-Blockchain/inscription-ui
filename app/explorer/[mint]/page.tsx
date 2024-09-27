'use client';

import { Center, Container, Loader, Text } from '@mantine/core';
import { fetchDigitalAsset } from '@metaplex-foundation/mpl-token-metadata';
import { publicKey } from '@metaplex-foundation/umi';
import { useQuery } from '@tanstack/react-query';
import { useUmi } from '@/providers/useUmi';
import { useEnv } from '@/providers/useEnv';
import { Explorer } from '@/components/Explorer/Explorer';
import strings from '@/localization';

export default function ExplorerPage({ params }: { params: { mint: string } }) {
  const env = useEnv();
  const umi = useUmi();
  const { mint } = params;
  const {
    error,
    isPending,
    data: nft,
  } = useQuery({
    retry: false,
    refetchOnMount: true,
    queryKey: ['fetch-nft', env, mint],
    queryFn: () => fetchDigitalAsset(umi, publicKey(mint)),
  });
  return (
    <Container size="xl" pb="xl">
      {isPending && (
        <Center h="20vh">
          <Loader />
        </Center>
      )}
      {error && (
        <Center h="20vh">
          <Text>{strings.inscriptionDoesNotExist}</Text>
        </Center>
      )}
      {nft && <Explorer nft={nft} />}
    </Container>
  );
}
