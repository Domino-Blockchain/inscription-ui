import { Center, Container, Flex, Group, Image, Menu, Title } from '@mantine/core';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { IconChevronDown } from '@tabler/icons-react';

import { Env } from '@/providers/useEnv';
import RetainQueryLink from '../RetainQueryLink';
import classes from './Header.module.css';
import strings from '@/localization';
import { LanguageMenu } from './LanguageMenu';

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

export interface HeaderProps {
  env: string;
  setEnv: (env: Env) => void;
  setLanguage: (lang: string) => void;
}

export function Header({ env, setEnv, setLanguage }: HeaderProps) {
  // const pathname = usePathname();
  // const { count } = useInscriptionCounter();

  return (
    <Container size="xl" h={80} pt={12}>
      <div className={classes.inner}>
        <Flex justify="center" align="center" gap="md">
          <RetainQueryLink href="/">
            <Image src="/logo.png" alt={strings.domichainLogoAlt} width={32} height={32} />
          </RetainQueryLink>
          <Title order={2}>{strings.inscriptionsTitle}</Title>
          {/* {pathname !== '/' && (
            <Title c="red" fw={900} order={3}>
              <NumberFormatter prefix="# " value={count} thousandSeparator />
            </Title>
          )} */}
        </Flex>
        <Group>
          <HeaderLink label={strings.createNftHeaderLink} link="/create-nft" />
          <HeaderLink label={strings.deployBrc20HeaderLink} link="/deploy-dpl20" />
          <HeaderLink label={strings.inscribeHeaderLink} link="/inscribe" />
          <HeaderLink label={strings.explorerHeaderLink} link="/explorer" />
          <HeaderLink label={strings.manageHeaderLink} link="/manage" />
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
              <Menu.Item onClick={() => setEnv('mainnet-beta')}>{strings.mainnetBetaNetwork}</Menu.Item>
              <Menu.Item onClick={() => setEnv('devnet')}>{strings.devnetNetwork}</Menu.Item>
            </Menu.Dropdown>
          </Menu>
          <LanguageMenu setLanguage={setLanguage} />
        </Group>
      </div>
    </Container>
  );
}
