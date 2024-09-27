import { Center, Container, Paper, Text } from '@mantine/core';
import strings from '@/localization';

export function ManageCustom() {
  return (
    <Paper>
      <Container>
        <Center h="20vh" ta="center">
          <Text>{strings.attachAdditionalCustomInscriptionData}</Text>
        </Center>
      </Container>
    </Paper>
  );
}
