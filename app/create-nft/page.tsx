'use client';

import { Center, Container, Paper, Text } from '@mantine/core';
import { useWallet } from '@solana/wallet-adapter-react';
import { CreateNft } from '@/components/CreateNft/CreateNft';
import strings from '@/localization';

export default function CreatePage() {
  const wallet = useWallet();

  return (
    <Container size="xl" pb="xl">
      {wallet.connected ? (
        <CreateNft />
      ) : (
        <Container size="sm">
          <Paper mt="xl">
            <Center h="20vh">
              <Text>{strings.connectYourWalletToBegin}</Text>
            </Center>
          </Paper>
        </Container>
      )}
    </Container>
  );
}
