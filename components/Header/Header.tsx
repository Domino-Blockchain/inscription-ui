import { Center, Container, Flex, Group, Image, Menu, Title } from '@mantine/core';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { IconChevronDown } from '@tabler/icons-react';

import { Env } from '@/providers/useEnv';
import RetainQueryLink from '../RetainQueryLink';
import classes from './Header.module.css';

const HeaderLink = ({
  label,
  link,
  disabled,
}: {
  label: string;
  link: string;
  disabled?: boolean;
}) => {
  const cls = disabled ? [classes.disabled, classes.link].join(' ') : classes.link;
  return (
    <RetainQueryLink href={link} className={cls}>
      {label}
    </RetainQueryLink>
  );
};

export function Header({ env, setEnv }: { env: string; setEnv: (env: Env) => void }) {
  // const pathname = usePathname();
  // const { count } = useInscriptionCounter();

  return (
    <Container size="xl" h={80} pt={12}>
      <div className={classes.inner}>
        <Flex justify="center" align="center" gap="md">
          <RetainQueryLink href="/">
            <Image src="/logo.png" alt="Domichain logo" width={32} height={32} />
          </RetainQueryLink>
          <Title order={2}>Inscriptions</Title>
          {/* {pathname !== '/' && (
            <Title c="red" fw={900} order={3}>
              <NumberFormatter prefix="# " value={count} thousandSeparator />
            </Title>
          )} */}
        </Flex>
        <Group>
          <HeaderLink label="Create NFT" link="/create-nft" />
          <HeaderLink label="Deploy BRC-20" link="/deploy-dpl20" />
          <HeaderLink label="Inscribe" link="/inscribe" />
          <HeaderLink label="Explorer" link="/explorer" />
          <HeaderLink label="Manage" link="/manage" />
          <WalletMultiButton />
          <Menu trigger="hover" transitionProps={{ exitDuration: 0 }} withinPortal>
            <Menu.Target>
              <a
                href={undefined}
                className={classes.link}
                onClick={(event) => event.preventDefault()}
              >
                <Center>
                  <span className={classes.linkLabel}>{env}</span>
                  <IconChevronDown size="0.9rem" stroke={1.5} />
                </Center>
              </a>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={() => setEnv('mainnet-beta')}>Mainnet Beta</Menu.Item>
              <Menu.Item onClick={() => setEnv('devnet')}>Devnet</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </div>
    </Container>
  );
}
