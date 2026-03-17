import { setRequestLocale } from 'next-intl/server';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

/**
 * Minimal layout for print pages — no sidebar, no header, no providers.
 * Only provides basic structure for printing.
 */
export default async function PrintLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <div className="min-h-screen bg-white">{children}</div>;
}
