
import type { Email } from '@/components/apps/email-client';

export const supervisorChapter2Email: Omit<Email, 'id' | 'timestamp' | 'folder' | 'recipient'> = {
  sender: 'Dr.V@recherche-lab.net',
  subject: 'Analyse complémentaire',
  body: `Bonne progression.

Les premiers résultats de DELTA7 ont révélé de nouvelles anomalies.
Un ancien opérateur a laissé des journaux cryptés. On voudrait que vous les parcouriez.

Le mot de passe pour l'archive est notre clé de département standard : memkey_042

PS : si vous croisez mon nom dans les RH, ne vous inquiétez pas du référencement. Système hérité.

- Dr. V.
`,
  attachments: [
    {
      fileName: 'mem-ops.zip',
      link: 'download:///documents/mem-ops/',
    },
  ],
};
