'use client';

import { Container, Text, Title } from '@mantine/core';
import classes from './Landing.module.css';
import strings from '@/localization';

export function Landing() {
  return (
    <>
      <Container size="md">
        <div className={classes.inner}>
          <div className={classes.content}>
            <Title className={classes.title}>{strings.landingTitle}</Title>
            <Text c="dimmed" mt="md">
              {strings.landingText}
            </Text>
          </div>
        </div>
      </Container>
      {/* <Box bg="rgb(36, 36, 36)" py="xl">
        <Container size="md" py="xl">
          <InscriptionCounterHero />
        </Container>
      </Box> */}
    </>
  );
}
