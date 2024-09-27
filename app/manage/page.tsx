'use client';

import { Center, Container, Paper, Text, Title } from '@mantine/core';
import { useWallet } from '@solana/wallet-adapter-react';
import { ManageLanding } from '@/components/Manage/ManageLanding';
import strings from '@/localization';

export default function ManagePage() {
  const wallet = useWallet();
  return (
    <Container size="xl" pb="xl">
      {wallet.connected ? <ManageLanding /> :
        <>
          <Title mt="xl" mb="lg">{strings.yourInscriptionsTitle}</Title>
          <Container size="sm">
            <Paper mt="xl">
              <Center h="20vh">
                <Text>{strings.connectYourWalletToSeeYourInscriptions}</Text>
              </Center>
            </Paper>
          </Container>
        </>
      }
    </Container>);
}
