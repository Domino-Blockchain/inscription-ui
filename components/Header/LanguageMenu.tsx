import { Center, Flex, Menu } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';

import { useLang } from '@/providers/useLang';
import classes from '@/components/Header/Header.module.css';
import { LanguageIcon } from '@/components/Header/LanguageIcon';

export function LanguageMenu({ setLanguage }: { setLanguage: (lang: string) => void }) {
  const selectedLanguage = useLang();

  return (
    <Menu trigger="hover" transitionProps={{ exitDuration: 0 }} withinPortal>
      <Menu.Target>
        <a href={undefined} className={classes.link} onClick={(event) => event.preventDefault()}>
          <Center>
            <span className={classes.linkLabel}>
              <LanguageIcon lang={selectedLanguage} />
            </span>
            <IconChevronDown size="0.9rem" stroke={1.5} />
          </Center>
        </a>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item onClick={() => setLanguage('en')}>
          <Flex justify="flex-start" align="center" gap="md">
            <LanguageIcon lang="en" />
            English
          </Flex>
        </Menu.Item>
        <Menu.Item onClick={() => setLanguage('zh_Hant')}>
          <Flex justify="flex-start" align="center" gap="md">
            <LanguageIcon lang="zh_Hant" />
            中文
          </Flex>
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
