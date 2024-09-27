import { DasApiAsset } from '@metaplex-foundation/digital-asset-standard-api';
import { Badge, Button, Center, Group, JsonInput, Loader, Text } from '@mantine/core';
import { CodeHighlightTabs } from '@mantine/code-highlight';
import { useEffect, useState } from 'react';
import { useNftInscription } from '../Inscribe/hooks';
import strings from '@/localization';

export function ManageJson({ nft, onUpdate }: { nft: DasApiAsset, onUpdate: (json: string) => void }) {
  const inscriptionInfo = useNftInscription(nft, { fetchImage: true, fetchMetadata: true, fetchJson: true });
  const [newJson, setNewJson] = useState<string>(inscriptionInfo.data?.json ? JSON.stringify(inscriptionInfo.data?.json, null, 2) : '');
  const [validJson, setValidJson] = useState<boolean>(false);

  useEffect(() => {
    setNewJson(inscriptionInfo.data?.json ? JSON.stringify(inscriptionInfo.data?.json, null, 2) : '');
  }, [inscriptionInfo.data?.json]);

  useEffect(() => {
    try {
      JSON.parse(newJson);
      setValidJson(true);
    } catch (e) {
      setValidJson(false);
    }
  }, [newJson]);

  return (
    <>
      {inscriptionInfo.isPending ? <Center h="20vh"><Loader /></Center> :
        <>
          <Group gap="xs">
            <Text fz="xs" tt="uppercase" fw={700} c="dimmed">{strings.inscribedJsonTitle}</Text>
            {!inscriptionInfo.data?.metadata ? <Badge color="red" variant="light">{strings.noJsonFoundTitle}</Badge> :
              !inscriptionInfo.data?.jsonValid && <Badge color="red" variant="light">{strings.invalidJsonTitle}</Badge>}
          </Group>
          {inscriptionInfo.data?.metadata &&
            <>

              <CodeHighlightTabs
                withExpandButton
                expandCodeLabel={strings.expandCodeLabel}
                collapseCodeLabel={strings.collapseCodeLabel}
                defaultExpanded={false}
                mb="lg"
                code={[{
                  fileName: 'inscribed.json',
                  language: 'json',
                  code: JSON.stringify(inscriptionInfo.data?.json, null, 2),
                }]}
              />
            </>}
          <Text fz="xs" tt="uppercase" fw={700} c="dimmed">{strings.inscribeNewJson}</Text>
          <JsonInput
            value={newJson}
            onChange={setNewJson}
            validationError={strings.invalidJsonError}
            autosize
          />
          <Button mt="md" size="md" disabled={!validJson} onClick={() => onUpdate(newJson)}>{strings.updateJsonButton}</Button>
        </>}

    </>

  );
}
