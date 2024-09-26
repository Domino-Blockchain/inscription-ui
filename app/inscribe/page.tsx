'use client';

import { Center, Container, Paper, Text } from '@mantine/core';
import { useWallet } from '@solana/wallet-adapter-react';
import { InscribeNft } from '@/components/Inscribe/InscribeNft';
import strings from '@/localization';

export default function InscribePage() {
  const wallet = useWallet();

  return (
    <Container size="xl" pb="xl">
      {wallet.connected ? (
        <InscribeNft />
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
