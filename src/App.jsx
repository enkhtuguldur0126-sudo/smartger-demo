import { useRoute } from './lib/router.js';
import Header from './components/Header.jsx';
import DemoBanner from './components/DemoBanner.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Project from './pages/Project.jsx';
import Companies from './pages/Companies.jsx';
import Company from './pages/Company.jsx';
import { HowItWorks, Report } from './pages/Simple.jsx';
import Compare from './pages/Compare.jsx';
import Placeholder from './pages/Placeholder.jsx';
import UiKit from './pages/UiKit.jsx';

function Page({ parts }) {
  const [name, id] = parts;
  switch (name) {
    case undefined: return <Home />;
    case 'project': return <Project id={id} tab={parts[2]} />;
    case 'companies': return <Companies />;
    case 'company': return <Company id={id} />;
    case 'compare': return <Compare add={id} />;
    case 'how-it-works': return <HowItWorks />;
    case 'report': return <Report />;
    case 'ui': return <UiKit />;
    default: return <Placeholder titleKey="page.notFound" />;
  }
}

export default function App() {
  const parts = useRoute();
  return (
    <>
      <DemoBanner />
      <Header active={parts[0] || ''} />
      <main className="main">
        <Page parts={parts} />
      </main>
      <Footer />
    </>
  );
}
