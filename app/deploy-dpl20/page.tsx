'use client';

import { Center, Container, Paper, Text } from '@mantine/core';
import { useWallet } from '@solana/wallet-adapter-react';
import { DeployDpl20 } from '@/components/Inscribe/DeployDpl20';

export default function DeployPage() {
  const wallet = useWallet();

  return (
    <Container size="xl" pb="xl">
      {wallet.connected ? (
        <DeployDpl20 />
      ) : (
        <Container size="sm">
          <Paper mt="xl">
            <Center h="20vh">
              <Text>Connect your wallet to begin.</Text>
            </Center>
          </Paper>
        </Container>
      )}
    </Container>
  );
}
