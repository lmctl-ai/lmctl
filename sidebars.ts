import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: 'category',
      label: 'Tutorials',
      link: {
        type: 'generated-index',
        title: 'Tutorials',
        description: 'Task-oriented walkthroughs for getting useful work through lmctl.',
      },
      items: [
        'tutorials/install-first-run',
        'tutorials/first-workflow-job-image-qa',
        'tutorials/qa-suite-ai-test-chapters',
        'tutorials/operating-workflows-cli',
      ],
    },
  ],
  manualsSidebar: [
    {
      type: 'category',
      label: 'Manuals / Reference',
      link: {
        type: 'generated-index',
        title: 'Manuals / Reference',
        description: 'Lookup material for lmctl concepts, commands, workflows, and runtime behavior.',
      },
      items: [
        {
          type: 'category',
          label: 'Concepts',
          items: ['manuals/concepts-glossary'],
        },
        {
          type: 'category',
          label: 'Workflows & Archetypes',
          items: ['manuals/workflows-archetypes', 'manuals/architecture-overview'],
        },
        {
          type: 'category',
          label: 'CLI / API Reference',
          items: ['manuals/cli-apicli-reference'],
        },
        'manuals/operations-runbook',
        'manuals/configuration-environment',
        'manuals/ai-test-chapter-format',
        'troubleshooting',
        'glossary',
      ],
    },
  ],
};

export default sidebars;
