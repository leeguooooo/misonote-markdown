import { getDocTree } from '@/core/docs/docs';
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
