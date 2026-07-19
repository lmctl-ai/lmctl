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
    title: 'Baby steps',
    href: '/docs/tutorials/baby-steps',
    text: 'Start with the low-commitment path: list sessions, name them, and route a review.',
  },
  {
    title: 'First workflow job',
    href: '/docs/tutorials/first-workflow-job-image-qa',
    text: 'Older walkthrough for the image-qa path while the teamfile-first docs are being reconciled.',
  },
  {
    title: 'QA suite',
    href: '/docs/tutorials/qa-suite-ai-test-chapters',
    text: 'Use ai-test chapters to drive repeatable manual checks through workflows.',
  },
  {
    title: 'Operating teams',
    href: '/docs/tutorials/operating-workflows-cli',
    text: 'Inspect team state, send prompts, read sessions, and track follow-up from the CLI.',
  },
];

const manuals = [
  {
    title: 'CLI / API reference',
    href: '/docs/manuals/cli-reference',
    text: 'Lookup current commands for status, teams, sessions, chat, tail, seed, refresh, and local APIs.',
  },
  {
    title: 'Workflows & archetypes',
    href: '/docs/manuals/workflows-archetypes',
    text: 'Historical patterns being reframed as team delegation prompts and operating shapes.',
  },
  {
    title: 'Architecture overview',
    href: '/docs/manuals/architecture-overview',
    text: 'See how SQLite state, provider sessions, teamfiles, chat, and durable-memory fit together.',
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
      title="Teamfile-driven AI-agent coordination"
      description="lmctl documentation for teamfile-driven AI-agent coordination.">
      <header className="hero heroBanner">
        <div className="container">
          <h1 className="hero__title">lmctl</h1>
          <p className="hero__subtitle">
            Teamfile-driven AI-agent coordination for single-operator,
            Linux/WSL2, SQLite-backed automation.
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
              <code>lmctl</code> gives native AI provider CLIs a shared local
              teamfile, names for members, and a chat path for handoffs. The
              team prompt and durable memory are the organizing layer.
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
