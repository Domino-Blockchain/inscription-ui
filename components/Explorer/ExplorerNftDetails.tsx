import { Center, Image, Loader, Stack, Text, Title } from '@mantine/core';
import { DigitalAsset } from '@metaplex-foundation/mpl-token-metadata';
import { CodeHighlightTabs } from '@mantine/code-highlight';
import { useNftJson } from '../Inscribe/hooks';
import { ExplorerStat } from './ExplorerStat';
import strings from '@/localization';

export function ExplorerNftDetails({ nft }: { nft: DigitalAsset }) {
  const jsonInfo = useNftJson(nft);
  return (
    <Stack>
      <Text fz="md" tt="uppercase" fw={700} c="dimmed">
          {strings.nftDetailsTitle}
      </Text>
      {jsonInfo.isPending || jsonInfo.isError ? (
        <Center h="20vh">
          <Loader />
        </Center>
      ) : (
        <>
          <Title>{jsonInfo.data.name}</Title>

          <Image src={jsonInfo.data.image} maw={320} />
          {jsonInfo.data.description && (
            <ExplorerStat label={strings.descriptionLabel} value={jsonInfo.data.description} />
          )}
          <ExplorerStat label={strings.mintLabel} value={nft.mint.publicKey} copyable />

          <Text fz="xs" tt="uppercase" fw={700} c="dimmed">
              {strings.jsonMetadataTitle}
          </Text>
          <CodeHighlightTabs
            withExpandButton
            expandCodeLabel={strings.expandCodeLabel}
            collapseCodeLabel={strings.collapseCodeLabel}
            defaultExpanded={false}
            mb="lg"
            code={[
              {
                fileName: 'metadata.json',
                language: 'json',
                code: JSON.stringify(jsonInfo.data, null, 2),
              },
            ]}
          />
        </>
      )}
    </Stack>
  );
}
