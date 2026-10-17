// "Install app" button, shown everywhere except inside the installed app. When
// the browser has an install prompt ready (Chrome / Edge / Android), the button
// opens it; otherwise (iPhone Safari never allows it, Chrome waits for some use
// first) it shows how to install on this device.
import { useEffect, useState } from 'react';
import { Box, Button, Dialog, HStack, Portal, Text, VStack, CloseButton } from '@chakra-ui/react';
import { Share, SquarePlus, Smartphone, MonitorDown, EllipsisVertical } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// The browser fires this once, possibly before React mounts: keep it at module level.
let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(l => l());
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    notify();
  });
}

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;

type Platform = 'ios' | 'android' | 'mac-safari' | 'firefox' | 'desktop';

function platform(): Platform {
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac; touch support gives it away.
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Firefox\//.test(ua)) return 'firefox';
  if (/Macintosh/.test(ua) && /Safari\//.test(ua) && !/Chrome|Chromium|Edg\//.test(ua)) return 'mac-safari';
  return 'desktop';
}

type Step = [React.ReactNode, React.ReactNode];

const STEPS: Record<Platform, { title: string; steps: Step[] }> = {
  ios: {
    title: 'Add Koaabooks to your home screen',
    steps: [
      [<Share size={18} />, <>Tap the <b>Share</b> button: at the bottom of Safari on iPhone, at the top on iPad.</>],
      [<SquarePlus size={18} />, <>Scroll down and tap <b>Add to Home Screen</b>.</>],
      [<Smartphone size={18} />, <>Tap <b>Add</b>, then open Koaabooks from its icon, once while online so it works offline.</>],
    ],
  },
  android: {
    title: 'Install Koaabooks',
    steps: [
      [<EllipsisVertical size={18} />, <>Open the browser menu <b>⋮</b>.</>],
      [<SquarePlus size={18} />, <>Tap <b>Install app</b> or <b>Add to Home screen</b>.</>],
      [<Smartphone size={18} />, <>Confirm, then open Koaabooks from its icon, once while online so it works offline.</>],
    ],
  },
  'mac-safari': {
    title: 'Add Koaabooks to the Dock',
    steps: [
      [<Share size={18} />, <>In Safari, choose <b>File → Add to Dock</b> (macOS Sonoma or later).</>],
      [<MonitorDown size={18} />, <>Click <b>Add</b>; Koaabooks then opens in its own window.</>],
    ],
  },
  firefox: {
    title: 'Install Koaabooks',
    steps: [
      [<MonitorDown size={18} />, <>Firefox cannot install web apps. Open this page in <b>Chrome</b> or <b>Edge</b>, or on your phone.</>],
    ],
  },
  desktop: {
    title: 'Install Koaabooks',
    steps: [
      [<MonitorDown size={18} />, <>Click the <b>install icon</b> at the right end of the address bar.</>],
      [<EllipsisVertical size={18} />, <>Or open the menu <b>⋮</b> → <b>Cast, save and share</b> → <b>Install page as app</b> (Chrome), or <b>Apps → Install this site as an app</b> (Edge).</>],
    ],
  },
};

const InstallApp: React.FC = () => {
  const [, rerender] = useState(0);
  const [guide, setGuide] = useState(false);

  useEffect(() => {
    const l = () => rerender(n => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  if (isStandalone()) return null;
  const guideFor = STEPS[platform()];

  const install = async () => {
    if (deferred) {
      const prompt = deferred;
      await prompt.prompt();
      await prompt.userChoice;
      deferred = null;
      notify();
    } else {
      setGuide(true);
    }
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={install}><Smartphone size={14} /> Install app</Button>
      <Dialog.Root open={guide} onOpenChange={(d: { open: boolean }) => setGuide(d.open)} placement="center">
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="420px" width="92vw">
              <Dialog.Header>
                <Dialog.Title>{guideFor.title}</Dialog.Title>
              </Dialog.Header>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" position="absolute" top={3} right={3} />
              </Dialog.CloseTrigger>
              <Dialog.Body pb={5}>
                <VStack align="stretch" gap={3} fontSize="sm">
                  {guideFor.steps.map(([icon, text], i) => (
                    <HStack key={i} gap={3} align="flex-start">
                      <Box pt="2px">{icon}</Box>
                      <Text>{guideFor.steps.length > 1 ? `${i + 1}. ` : ''}{text}</Text>
                    </HStack>
                  ))}
                  <Text fontSize="xs" color="var(--muted-text)">
                    The installed app has its own storage. If you already have entries here, use <b>Download</b> first,
                    then <b>Import</b> the file in the app.
                  </Text>
                </VStack>
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
};

export default InstallApp;
