import { Box, NumberFormatter, Text, Title } from '@mantine/core';

import classes from './InscriptionCounterHero.module.css';
import { useInscriptionCounter } from '@/providers/useInscriptionCounter';
import strings from '@/localization';

export function InscriptionCounterHero() {
  const { count } = useInscriptionCounter();

  return (
    <Box ta="center">
      <Text>{strings.currentInscriptionNumberTitle}</Text>
      <Title c="red" fw={900} className={classes.counter}>
        <NumberFormatter value={count} thousandSeparator />
      </Title>
      <Text>{strings.inscribeAnNftToClaimYouNumber}</Text>
    </Box>
  );
}
