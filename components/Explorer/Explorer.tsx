import { Paper, SimpleGrid } from '@mantine/core';

import { DigitalAsset } from '@metaplex-foundation/mpl-token-metadata';
import { ExplorerNftDetails } from './ExplorerNftDetails';
import { ExplorerInscriptionDetails } from './ExplorerInscriptionDetails';

export function Explorer({ nft }: { nft: DigitalAsset }) {
  return (
    <SimpleGrid cols={2} mt="xl" spacing="lg" pb="xl">
      <Paper p="xl" radius="md">
        <ExplorerNftDetails nft={nft} />
      </Paper>
      {/* <Paper p="xl" radius="md">
        <ExplorerInscriptionDetails asset={asset} />
      </Paper> */}
    </SimpleGrid>
  );
}
