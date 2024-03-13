'use client';

import { Center, Container, Loader, Paper, SimpleGrid, Text } from '@mantine/core';
import { publicKey } from '@metaplex-foundation/umi';
import { useQuery } from '@tanstack/react-query';
import { useUmi } from '@/providers/useUmi';
import { useEnv } from '@/providers/useEnv';
import { ExplorerInscriptionDetails } from '@/components/Explorer/ExplorerInscriptionDetails';

export default function ExplorerPage({ params }: { params: { mint: string } }) {
  const env = useEnv();
  const umi = useUmi();
  const { mint } = params;
  const {
    error,
    isPending,
    data: inscriptionAccount,
  } = useQuery({
    retry: false,
    refetchOnMount: true,
    queryKey: ['fetch-nft', env, mint],
    queryFn: async () => umi.rpc.getAccount(publicKey(mint)),
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
          <Text>Inscription does not exist</Text>
        </Center>
      )}
      {inscriptionAccount && (
        <SimpleGrid cols={1} mt="xl" spacing="lg" pb="xl">
          {/* <Paper p="xl" radius="md">
            <ExplorerNftDetails nft={nft} />
          </Paper> */}
          <Paper p="xl" radius="md">
            <ExplorerInscriptionDetails inscriptionAccount={inscriptionAccount} />
          </Paper>
        </SimpleGrid>
      )}
    </Container>
  );
}
