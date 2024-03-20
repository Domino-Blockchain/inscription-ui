import { CodeHighlight } from '@mantine/code-highlight';
import { Badge, Card, Group, Image, Skeleton, Text } from '@mantine/core';
import { useNftInscription } from '../Inscribe/hooks';
import { AssetWithInscription } from '../Inscribe/types';

import RetainQueryLink from '../RetainQueryLink';
import classes from './ExplorerNftCard.module.css';

export function ExplorerNftCard({
  nft,
}: {
  nft: Omit<AssetWithInscription, 'pdaExists' | 'imagePdaExists'>;
}) {
  const { error, isPending, data } = useNftInscription(nft.asset, {
    fetchJson: true,
    fetchImage: true,
  });

  return (
    <RetainQueryLink
      href={`/explorer/${nft.asset.mint.publicKey}`}
      style={{
        textDecoration: 'none',
      }}
    >
      <Skeleton visible={isPending} className={classes.cardContainer} mih={160}>
        {data?.image ? (
          <Card shadow="sm" padding="lg" radius="md">
            <Card.Section>
              <Skeleton visible={!!error}>
                <Image src={URL.createObjectURL(data.image)} height={160} />
              </Skeleton>
            </Card.Section>
            <Group justify="space-between" mt="md">
              <Text fw={500}>{data?.json?.name}</Text>
            </Group>
          </Card>
        ) : (
          <Card shadow="sm" padding="lg" radius="md">
            <Card.Section>
              <CodeHighlight
                language="json"
                withCopyButton={false}
                code={data?.json ? JSON.stringify(data?.json, null, 2) : ''}
              />
            </Card.Section>
          </Card>
        )}

        {nft?.metadata && (
          <Badge
            variant="default"
            style={{
              position: 'absolute',
              top: '1rem',
              right: '0.5rem',
            }}
          >
            #{nft.metadata.inscriptionRank.toString()!}
          </Badge>
        )}
      </Skeleton>
    </RetainQueryLink>
  );
}
