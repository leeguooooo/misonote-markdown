import { getDocTree } from '@/lib/docs';
import DocsLayoutClient from '@/components/DocsLayoutClient';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const docTree = getDocTree();

  return (
    <DocsLayoutClient docTree={docTree}>
      {children}
    </DocsLayoutClient>
  );
}
