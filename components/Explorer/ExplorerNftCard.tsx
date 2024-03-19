import { Badge, Card, Group, Image, Skeleton, Text } from '@mantine/core';
import { AssetWithInscription } from '../Inscribe/types';
import { useNftJson } from '../Inscribe/hooks';

import classes from './ExplorerNftCard.module.css';
import RetainQueryLink from '../RetainQueryLink';

export function ExplorerNftCard({
  nft,
}: {
  nft: Omit<AssetWithInscription, 'pdaExists' | 'imagePdaExists'>;
}) {
  const { error, isPending, data: json } = useNftJson(nft.asset);

  return (
    <RetainQueryLink
      href={`/explorer/${nft.asset.mint.publicKey}`}
      style={{
        textDecoration: 'none',
      }}
    >
      <Skeleton visible={isPending} className={classes.cardContainer}>
        <Card shadow="sm" padding="lg" radius="md">
          <Card.Section>
            <Skeleton visible={!!error}>
              <Image src={json?.image} height={160} />
            </Skeleton>
          </Card.Section>
          <Group justify="space-between" mt="md">
            <Text fw={500}>{json?.name}</Text>
          </Group>
        </Card>
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
