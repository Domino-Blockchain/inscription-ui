'use client';

import { Box, Center, Container, Paper, Text, Title } from '@mantine/core';
import { useWallet } from '@solana/wallet-adapter-react';
import { ExplorerLanding } from '@/components/Explorer/ExplorerLanding';
import { ExplorerRecent } from '@/components/Explorer/ExplorerRecent';
import strings from '@/localization';

export default function ExplorerPage() {
  const wallet = useWallet();
  return (
    <Container size="xl" pb="xl">
      {wallet.connected ? <ExplorerLanding /> :
        <>
        <Title mt="xl" mb="lg">{strings.yourInscriptionsTitle}</Title>
        <Container size="sm">
          <Paper mt="xl">
            <Center h="20vh">
              <Text>{strings.connectYourWalletToBegin}</Text>
            </Center>
          </Paper>
        </Container>
        </>
      }
      <Box mt="xl">
        <ExplorerRecent />
      </Box>
    </Container>);
}
