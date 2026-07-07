import clsx from 'clsx';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

const tutorials = [
  {
    title: 'Install & first run',
    href: '/docs/tutorials/install-first-run',
    text: 'Install lmctl, confirm the CLI, and run your first local checks.',
  },
  {
    title: 'First workflow job',
    href: '/docs/tutorials/first-workflow-job-image-qa',
    text: 'Create a project and run the image-qa workflow end to end.',
  },
  {
    title: 'QA suite',
    href: '/docs/tutorials/qa-suite-ai-test-chapters',
    text: 'Use ai-test chapters to drive repeatable manual checks through workflows.',
  },
];

const manuals = [
  {
    title: 'CLI / API reference',
    href: '/docs/manuals/cli-reference',
    text: 'Lookup commands for projects, teams, workflows, jobs, runs, attentions, and issues.',
  },
  {
    title: 'Workflows & archetypes',
    href: '/docs/manuals/workflows-archetypes',
    text: 'Understand workflow JSON, compound primitives, and routed outcomes.',
  },
  {
    title: 'Architecture overview',
    href: '/docs/manuals/architecture-overview',
    text: 'See how the daemon, SQLite state, provider sessions, workflows, and durable-memory fit together.',
  },
];

function Card({title, href, text}: {title: string; href: string; text: string}) {
  return (
    <Link className="docCard" to={href}>
      <h3>{title}</h3>
      <p>{text}</p>
    </Link>
  );
}

export default function Home(): JSX.Element {
  return (
    <Layout
      title="Workflow-driven AI-agent platform"
      description="lmctl documentation for workflow-driven AI-agent automation.">
      <header className="hero heroBanner">
        <div className="container">
          <h1 className="hero__title">lmctl</h1>
          <p className="hero__subtitle">
            Workflow-driven AI-agent platform for single-operator, Linux/WSL2,
            SQLite-backed automation.
          </p>
          <div className="heroActions">
            <Link
              className={clsx('button button--primary button--lg')}
              to="/docs/tutorials/install-first-run">
              Start with install
            </Link>
            <Link
              className={clsx('button button--secondary button--lg')}
              to="/docs/manuals/concepts-glossary">
              Read the concepts
            </Link>
          </div>
        </div>
      </header>
      <main>
        <section className="sectionPlain">
          <div className="container">
            <h2>What lmctl does</h2>
            <p>
              <code>lmctl</code> runs structured workflows that spawn
              native AI provider CLIs as cooperating agents. A workflow
              definition controls sequencing and routing, so the pipeline is
              the organizing layer.
            </p>
            <p>
              Provider sessions are treated as disposable caches. Project
              knowledge lives in durable-memory files, so useful context can
              survive compaction, restarts, and provider changes.
            </p>
          </div>
        </section>
        <section className="sectionBand">
          <div className="container">
            <h2>Tutorials</h2>
            <div className="docGrid">
              {tutorials.map((item) => (
                <Card key={item.href} {...item} />
              ))}
            </div>
          </div>
        </section>
        <section className="sectionPlain">
          <div className="container">
            <h2>Manuals / Reference</h2>
            <div className="docGrid">
              {manuals.map((item) => (
                <Card key={item.href} {...item} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
