// The page around the tracker: logo, tabs, tax year, install and backup.
import { useRef } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Box, Button, Flex, HStack, Text } from '@chakra-ui/react';
import { Download, Upload } from 'lucide-react';
import ExpenseTracker, { TABS, lastYear } from './ExpenseTracker';
import InstallApp from './components/InstallApp';
import { useToast } from './components/toaster';
import { makeBackup, readImport, store } from './store';

export function TrackerPage() {
  const { year, tab } = useParams();
  if (!year) return <Navigate to={`/${lastYear()}/entries`} replace />;
  if (!tab) return <Navigate to={`/${year}/entries`} replace />;
  return (
    <Box h="calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom))">
      <ExpenseTracker header={(yearPicker, reload) => <Header yearPicker={yearPicker} reload={reload} />} />
    </Box>
  );
}

function Header({ yearPicker, reload }: { yearPicker: React.ReactNode; reload: () => void }) {
  const { year, tab } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);

  const handleDownload = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(makeBackup(), null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `koaabooks-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (files: FileList) => {
    const docs: Record<string, unknown> = {};
    for (const file of Array.from(files)) {
      let found: Record<string, unknown> | null = null;
      try { found = readImport(file.name, JSON.parse(await file.text())); } catch {}
      if (!found) { window.alert(`${file.name} is not a Koaabooks backup or an expense tracker file.`); return; }
      Object.assign(docs, found);
    }
    const keys = Object.keys(docs);
    const replaced = keys.filter(k => store.get(k) != null);
    const what = keys.map(k => k.startsWith('_') ? k.slice(1) : k).join(', ');
    if (replaced.length && !window.confirm(`Replace ${replaced.map(k => k.startsWith('_') ? k.slice(1) : k).join(', ')} in this browser with the imported copy?`)) return;
    try {
      for (const k of keys) store.put(k, docs[k]);
    } catch (err: any) {
      toast('error', `Import failed: ${err.message || 'browser storage is full or blocked'}`);
      return;
    }
    reload();
    toast('success', `Imported ${what}`);
  };

  return (
    <Box borderBottom="1px solid" borderColor="var(--border-color)" flexShrink={0}>
      <Flex px={4} pt={3} pb={2} gap={3} align="center" justify="space-between" flexWrap="wrap">
        <HStack gap={2}>
          <img src={`${import.meta.env.BASE_URL}icon-192.png`} alt="" width={32} height={32} style={{ borderRadius: 8 }} />
          <Box>
            <Text fontSize="xl" fontWeight={700} lineHeight="1.1" color="var(--heading-color)">Koaabooks</Text>
            <Text fontSize="xs" color="var(--muted-text)">saved in this browser</Text>
          </Box>
        </HStack>
        <HStack gap={2} flexWrap="wrap">
          {yearPicker}
          <InstallApp />
          <Button size="sm" variant="outline" onClick={handleDownload} aria-label="Download" title="Save every year and list to a file">
            <Download size={14} /><Box as="span" display={{ base: 'none', sm: 'inline' }}>Download</Box>
          </Button>
          <Button size="sm" variant="outline" onClick={() => fileInput.current?.click()} aria-label="Import" title="Load a Koaabooks backup, or Okaasan expense tracker files">
            <Upload size={14} /><Box as="span" display={{ base: 'none', sm: 'inline' }}>Import</Box>
          </Button>
          <input ref={fileInput} type="file" accept=".json,application/json" multiple hidden
            onChange={e => { const f = e.target.files; if (f?.length) handleImport(f); e.target.value = ''; }} />
        </HStack>
      </Flex>
      <HStack px={2} gap={0} overflowX="auto" role="tablist">
        {TABS.map(t => {
          const active = t.id === tab;
          return (
            <Button key={t.id} size="sm" variant="ghost" role="tab" aria-selected={active}
              onClick={() => navigate(`/${year}/${t.id}`)}
              borderRadius={0} flexShrink={0}
              borderBottom="2px solid" borderColor={active ? 'var(--icon-color)' : 'transparent'}
              fontWeight={active ? 600 : 400}
              color={active ? 'var(--heading-color)' : 'var(--muted-text)'}
            >{t.label}</Button>
          );
        })}
      </HStack>
    </Box>
  );
}
