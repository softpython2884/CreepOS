
import type { Email } from '@/components/apps/email-client';

export const supervisorChapter2Email: Omit<Email, 'id' | 'timestamp' | 'folder' | 'recipient'> = {
  sender: 'superviseur@recherche-lab.net',
  subject: 'Analyse complémentaire',
  body: `Bonne progression.

Les premiers résultats de DELTA7 ont révélé de nouvelles anomalies.
Un ancien opérateur a laissé des journaux cryptés. On voudrait que vous les parcouriez.
`,
  attachments: [
    {
      fileName: 'mem-ops.zip',
      link: 'download:///documents/mem-ops/',
    },
  ],
};
