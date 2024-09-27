import {
  Anchor,
  Box,
  Button,
  Center,
  Checkbox,
  Container,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  findAssociatedInscriptionAccountPda,
  findInscriptionMetadataPda,
  findMintInscriptionPda,
} from '@metaplex-foundation/mpl-inscription';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

import {
  TokenStandard,
  fetchAllDigitalAssetByUpdateAuthority,
} from '@metaplex-foundation/mpl-token-metadata';
import { unwrapOption } from '@metaplex-foundation/umi';
import { useUmi } from '@/providers/useUmi';
import { useEnv } from '@/providers/useEnv';
import { NftCollectionCard } from './NftCollectionCard';
import { NftCard } from './NftCard';
import classes from './NftSelector.module.css';
import { AssetWithInscription, InscriptionInfo } from './types';
import strings from '@/localization';

export const UNCATAGORIZED = 'Uncategorized';

// export const getCollection = (nft: DigitalAsset) =>
//   nft.grouping.filter(({ group_key }) => group_key === 'collection')[0]?.group_value ||
//   UNCATAGORIZED;

export function NftSelector({
  onSelect,
  selectedNfts,
}: {
  onSelect: (nfts: AssetWithInscription[]) => void;
  selectedNfts: AssetWithInscription[];
}) {
  const env = useEnv();
  const [selectAll, setSelectAll] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [collate, setCollate] = useState(false);
  const [hideInscribed, setHideInscribed] = useState(true);
  const [showOnlyOwned, setShowOnlyOwned] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(selectedNfts.map((nft) => nft.asset.publicKey))
  );
  const [collections, setCollections] = useState<{
    [key: string]: { nfts: AssetWithInscription[]; selected: number };
  }>({});

  const umi = useUmi();

  const {
    error,
    isPending,
    data: nfts,
  } = useQuery({
    queryKey: ['fetch-nfts-by-authority', env, umi.identity.publicKey],
    queryFn: async () => {
      const assets = (
        await fetchAllDigitalAssetByUpdateAuthority(umi, umi.identity.publicKey)
      ).filter(
        (asset) =>
          unwrapOption(asset.metadata.tokenStandard) === TokenStandard.NonFungible &&
          asset.metadata.uri
      );

      const infos: Pick<
        InscriptionInfo,
        'inscriptionPda' | 'inscriptionMetadataAccount' | 'imagePda'
      >[] = assets.map((asset) => {
        const inscriptionPda = findMintInscriptionPda(umi, { mint: asset.mint.publicKey });
        const inscriptionMetadataAccount = findInscriptionMetadataPda(umi, {
          inscriptionAccount: inscriptionPda[0],
        });
        const imagePda = findAssociatedInscriptionAccountPda(umi, {
          associationTag: 'image',
          inscriptionMetadataAccount: inscriptionMetadataAccount[0],
        });

        return {
          inscriptionPda,
          inscriptionMetadataAccount,
          imagePda,
        };
      });

      const inscriptionExists = await umi.rpc.getAccounts(
        infos.map((info) => info.inscriptionPda[0]),
        {
          commitment: 'confirmed',
          dataSlice: {
            length: 0,
            offset: 0,
          },
        }
      );

      const imageExists = await umi.rpc.getAccounts(
        infos.map((info) => info.imagePda[0]),
        {
          commitment: 'confirmed',
          dataSlice: {
            length: 0,
            offset: 0,
          },
        }
      );

      return infos.map((info, i) => ({
        asset: assets[i],
        inscriptionPda: infos[i].inscriptionPda,
        inscriptionMetadataAccount: infos[i].inscriptionMetadataAccount,
        imagePda: infos[i].imagePda,
        pdaExists: inscriptionExists[i].exists,
        imagePdaExists: imageExists[i].exists,
      }));
    },
  });

  useEffect(() => {
    if (error) {
      notifications.show({
        title: strings.errorFetchingNftsNotificationTitle,
        message: error.message,
        color: 'red',
      });
    }
  }, [error]);

  useEffect(() => {
    if (!nfts) {
      setCollections({});
      return;
    }
    const sNfts = new Set(selectedNfts.map((nft) => nft.asset.publicKey));
    const col: { [key: string]: { nfts: AssetWithInscription[]; selected: number } } = {};
    nfts.forEach((nft) => {
      const collection = UNCATAGORIZED;
      if (!col[collection]) {
        col[collection] = {
          nfts: [],
          selected: 0,
        };
      }
      col[collection].nfts.push(nft);
      if (sNfts.has(nft.asset.publicKey)) {
        col[collection].selected += 1;
      }
    });
    setCollections(col);
  }, [nfts]);

  const handleSelect = useCallback(
    (nft: AssetWithInscription) => {
      if (nft.pdaExists) return;
      const col = UNCATAGORIZED; // getCollection(nft);
      if (selected.has(nft.asset.publicKey)) {
        selected.delete(nft.asset.publicKey);
        setSelected(new Set(selected));
        setCollections({
          ...collections,
          [col]: {
            nfts: collections[col].nfts,
            selected: collections[col].selected - 1,
          },
        });
      } else {
        setSelected(new Set(selected.add(nft.asset.publicKey)));
        setCollections({
          ...collections,
          [col]: {
            nfts: collections[col].nfts,
            selected: collections[col].selected + 1,
          },
        });
      }
    },
    [selected, setSelected, collections, setCollections]
  );

  const handleSelectCollection = useCallback(
    (collection: string) => {
      if (collections[collection].selected === collections[collection].nfts.length) {
        collections[collection].nfts.forEach((nft) => {
          selected.delete(nft.asset.publicKey);
        });
        setCollections({
          ...collections,
          [collection]: {
            nfts: collections[collection].nfts,
            selected: 0,
          },
        });
        setSelected(new Set(selected));
      } else {
        collections[collection].nfts.forEach((nft) => {
          setSelected(new Set(selected.add(nft.asset.publicKey)));
        });
        setCollections({
          ...collections,
          [collection]: {
            nfts: collections[collection].nfts,
            selected: collections[collection].nfts.length,
          },
        });
      }
    },
    [selected, setSelected, collections, setCollections]
  );

  return (
    <>
      <Group my="lg" justify="space-between">
        <Group>
          <Checkbox
            label={strings.hideInscribedLabel}
            checked={hideInscribed}
            disabled={isPending}
            onChange={() => {
              setHideInscribed(!hideInscribed);
            }}
          />
          {/* <Checkbox
            label="Collate by collection"
            checked={collate}
            disabled={isPending}
            onChange={() => {
              setCollate(!collate);
            }}
          /> */}
          <Checkbox
            label={strings.selectAllCheckboxLabel}
            checked={selectAll}
            disabled={isPending}
            onChange={() => {
              if (selectAll) {
                setSelected(new Set());
                const res: { [key: string]: { nfts: AssetWithInscription[]; selected: number } } =
                  {};
                Object.keys(collections).forEach((collection) => {
                  res[collection] = {
                    nfts: collections[collection].nfts,
                    selected: 0,
                  };
                });
                setCollections(res);
              } else {
                setSelected(new Set(nfts?.map((nft) => nft.asset.publicKey)));
                const res: { [key: string]: { nfts: AssetWithInscription[]; selected: number } } =
                  {};
                Object.keys(collections).forEach((collection) => {
                  res[collection] = {
                    nfts: collections[collection].nfts,
                    selected: collections[collection].nfts.length,
                  };
                });
                setCollections(res);
              }
              setSelectAll(!selectAll);
            }}
          />
          <Checkbox
            label={strings.showOnlyOwnedCheckboxLabel}
            checked={showOnlyOwned}
            disabled={isPending}
            onChange={() => {
              setShowOnlyOwned(!showOnlyOwned);
            }}
          />
        </Group>
        <Button
          disabled={!selected.size}
          onClick={() => {
            onSelect(
              selected.size ? nfts?.filter((nft) => selected.has(nft.asset.publicKey)) || [] : []
            );
          }}
        >
          Next
        </Button>
      </Group>
      {isPending ? (
        <Center h="50vh">
          <Loader />{' '}
        </Center>
      ) : !nfts?.length ? (
        <>
          <Container size="sm">
            <Paper mt="xl">
              <Center h="20vh">
                <Text w="50%" ta="center">
                  {strings.formatString(
                    strings.noticeUnableToFindNftCreated,
                    <b>{strings.updateAuthority}</b>
                  )}
                </Text>
              </Center>
            </Paper>
          </Container>
          <Container size="sm">
            <Paper mt="xl">
              <Center h="20vh">
                <Text w="50%" ta="center">
                  {strings.formatString(
                    strings.createYourOwnNftHere,
                    <Anchor href="/create-nft">{strings.here}</Anchor>
                  )}
                </Text>
              </Center>
            </Paper>
          </Container>
        </>
      ) : (
        <>
          <SimpleGrid
            cols={{
              base: 1,
              sm: 2,
              lg: 5,
              xl: 6,
            }}
          >
            {collate ? (
              <>
                {Object.keys(collections).map((key) => {
                  if (key === UNCATAGORIZED) return null;
                  return (
                    <Box
                      key={key}
                      onClick={() => handleSelectCollection(key)}
                      className={classes.cardContainer}
                    >
                      <NftCollectionCard
                        nfts={collections[key].nfts.map((x) => x.asset)}
                        numSelected={collections[key].selected}
                      />
                    </Box>
                  );
                })}
              </>
            ) : (
              nfts
                ?.filter((nft) => (hideInscribed ? !nft.pdaExists : true))
                .filter((nft) => {
                  if (showOnlyOwned) {
                    return true; // TODO: fix this
                    // return nft.ownership.owner === umi.identity.publicKey;
                  }
                  return true;
                })
                .map((nft) => (
                  <Box
                    key={nft.asset.publicKey}
                    onClick={() => {
                      if (nft.pdaExists) {
                        // TODO fix this to be more nextjs idiomatic
                        window.open(
                          `/explorer/${nft.asset.publicKey}?env=${env}`,
                          '_blank',
                          'noreferrer'
                        );
                      } else {
                        handleSelect(nft);
                      }
                    }}
                    className={classes.cardContainer}
                  >
                    <NftCard nft={nft} isSelected={selected.has(nft.asset.publicKey)} />
                  </Box>
                ))
            )}
          </SimpleGrid>
          {/* {collections[UNCATAGORIZED] && <Box mt="lg">
            <Text>Uncheck &quot;Collate by collection&quot; to see <b>{collections[UNCATAGORIZED].nfts.length}</b> NFT(s) not in a collection</Text>
                                         </Box>} */}
        </>
      )}
    </>
  );
}
