import { Box, Button, Center, Grid, Paper, Stack, Stepper, Title } from '@mantine/core';
import { useState } from 'react';
import { CodeHighlightTabs } from '@mantine/code-highlight';
import { IconChisel } from '@tabler/icons-react';
import { NftSelector } from './NftSelector';
import { ConfigureInscribe, InscriptionSettings } from './ConfigureInscribe';
import { DoInscribe } from './DoInscribe';
import { AssetWithInscription } from './types';
import { NftCard } from './NftCard';
import strings from '@/localization';

export function InscribeNft() {
  const [active, setActive] = useState(0);
  const [highestStepVisited, setHighestStepVisited] = useState(active);
  const [selectedNfts, setSelectedNfts] = useState<AssetWithInscription[]>([]);
  const [inscriptionSettings, setInscriptionSettings] = useState<InscriptionSettings[]>();
  const [txs, setTxs] = useState<string[]>();

  const handleStepChange = (nextStep: number) => {
    const isOutOfBounds = nextStep > 3 || nextStep < 0;

    if (isOutOfBounds) {
      return;
    }

    setActive(nextStep);
    setHighestStepVisited((hSC) => Math.max(hSC, nextStep));
  };

  // Allow the user to freely go back and forth between visited steps.
  const shouldAllowSelectStep = (step: number) => highestStepVisited >= step && active !== step;

  return (
    <Box mt="xl">
      <Stepper active={active} onStepClick={setActive}>
        <Stepper.Step
          label={strings.selectNftsLabel}
          description={strings.inscribeNftsYouVeCreated}
          allowStepSelect={shouldAllowSelectStep(0)}
        >
          <NftSelector
            selectedNfts={selectedNfts}
            onSelect={(nfts) => {
              setSelectedNfts(nfts);
              handleStepChange(active + 1);
            }}
          />
        </Stepper.Step>
        <Stepper.Step
          label={strings.configureLabel}
          description={strings.chooseOnChainDataFormat}
          allowStepSelect={shouldAllowSelectStep(1)}
        >
          <ConfigureInscribe
            selectedNfts={selectedNfts.map((x) => x.asset)}
            onConfigure={(settings) => {
              setInscriptionSettings(settings);
              handleStepChange(active + 1);
            }}
          />
        </Stepper.Step>
        <Stepper.Step
          label={strings.inscribeLabel}
          description={strings.doIt}
          allowStepSelect={shouldAllowSelectStep(2)}
        >
          <DoInscribe
            inscriptionSettings={inscriptionSettings!}
            onComplete={(txsRes) => {
              setTxs(txsRes);
              handleStepChange(active + 1);
            }}
          />
        </Stepper.Step>

        <Stepper.Completed>
          <Paper mt="lg" p="lg">
            <Center>
              <Stack align="center">
                <Title>{strings.congratsYouVeInscribedYourNfts}</Title>
                <Grid my="lg" w="100%" justify="center" gutter="lg">
                  {selectedNfts.map((nft) => (
                    <Grid.Col span={4}>
                      <NftCard nft={nft} showLinks />
                    </Grid.Col>
                  ))}
                </Grid>
                <Button
                  mb="lg"
                  onClick={() => {
                    handleStepChange(0);
                    setHighestStepVisited(0);
                    setSelectedNfts([]);
                    setInscriptionSettings(undefined);
                    setTxs(undefined);
                  }}
                >
                    {strings.inscribeMoreButton}
                </Button>
              </Stack>
            </Center>
            <CodeHighlightTabs
              withExpandButton
              expandCodeLabel={strings.expandTransactionsLabel}
              collapseCodeLabel={strings.collapseTransactionsLabel}
              defaultExpanded={false}
              // withHeader={false}
              mt="md"
              mb="lg"
              code={[
                {
                  fileName: 'transactions',
                  code: txs?.join('\n') || '',
                },
              ]}
            />
          </Paper>
        </Stepper.Completed>
      </Stepper>
    </Box>
  );
}
