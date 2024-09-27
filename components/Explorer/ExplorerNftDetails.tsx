import { Badge, Center, Flex, Image, Loader, Paper, Stack, Text, Title } from '@mantine/core';
import { DigitalAsset } from '@metaplex-foundation/mpl-token-metadata';
import { CodeHighlightTabs } from '@mantine/code-highlight';
import { Carousel } from '@mantine/carousel';
import { useQuery } from '@tanstack/react-query';
import { useNftJson } from '../Inscribe/hooks';
import { ExplorerStat } from './ExplorerStat';
import classes from './ExplorerNftDetails.module.css';
import strings from '@/localization';

export function ExplorerNftDetails({ nft }: { nft: DigitalAsset }) {
  const jsonInfo = useNftJson(nft);

  const { isLoading: isVerifying, data: isVerified } = useQuery({
    queryKey: ['verified', jsonInfo.data],
    queryFn: async () => {
      const response = await fetch('/api/verify-nft', {
        method: 'POST',
        body: JSON.stringify(jsonInfo.data),
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      const responseBody = await response.json();
      return !!responseBody.verified;
    },
    enabled: !!jsonInfo.data,
  });

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
          <Flex gap="md" justify="flex-start" align="center" direction="row">
            <Title>{jsonInfo.data.name}</Title>

            {isVerifying ? (
              <Loader color="gray" size="xs" />
            ) : (
              <Badge variant="light" color={isVerified ? 'green' : 'red'} radius="md">
                {isVerified ? 'Verified' : 'Tampered'}
              </Badge>
            )}
          </Flex>

          <Paper radius="md" bg="dark">
            {jsonInfo.data.images ? (
              <Carousel
                classNames={classes}
                height={300}
                slideSize="70%"
                controlsOffset="lg"
                withIndicators
                loop
              >
                {jsonInfo.data.images.map((image: any) => (
                  <Carousel.Slide key={image.url}>
                    <Image src={image.url} />
                  </Carousel.Slide>
                ))}
              </Carousel>
            ) : jsonInfo.data.image ? (
              <Image src={jsonInfo.data.image} />
            ) : null}
          </Paper>

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
