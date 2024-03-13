'use client';

import { Box, Container, Text, Title } from '@mantine/core';
import { InscriptionCounterHero } from '../InscriptionCounter/inscriptionCounterHero';
import classes from './Landing.module.css';

export function Landing() {
  return (
    <>
      <Container size="md">
        <div className={classes.inner}>
          <div className={classes.content}>
            <Title className={classes.title}>Fully on-chain NFTs</Title>
            <Text c="dimmed" mt="md">
              Inscribe old NFTs, mint new inscribed NFTs, and manage all of your Inscriptions all in
              one place
            </Text>
          </div>
        </div>
      </Container>
      <Box bg="rgb(36, 36, 36)" py="xl">
        <Container size="md" py="xl">
          <InscriptionCounterHero />
        </Container>
      </Box>
    </>
  );
}
