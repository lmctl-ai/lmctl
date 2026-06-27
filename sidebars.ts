import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  whySidebar: [
    {
      type: 'category',
      label: 'Why lmctl',
      link: {
        type: 'generated-index',
        title: 'Why lmctl',
        description: 'The ideas behind lmctl: diverse players, adversarial review, scalable context, and cost-aware model routing.',
      },
      items: [
        'why/players-and-diversity',
        'why/adversarial-review',
        'why/context-and-durable-memory',
        'why/cost-and-model-routing',
      ],
    },
  ],
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
        'tutorials/baby-steps',
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
          items: ['manuals/concepts-glossary', 'manuals/teams-connect'],
        },
        {
          type: 'category',
          label: 'Workflows & Archetypes',
          items: ['manuals/workflows-archetypes', 'manuals/templates-catalog', 'manuals/architecture-overview'],
        },
        {
          type: 'category',
          label: 'CLI Reference',
          items: ['manuals/cli-reference'],
        },
        'manuals/operations-runbook',
        'manuals/configuration-environment',
        'manuals/ai-test-chapter-format',
        'troubleshooting',
        'glossary',
        'changelog',
        'license',
      ],
    },
  ],
};

export default sidebars;
