import { useRoute } from './lib/router.js';
import Header from './components/Header.jsx';
import DemoBanner from './components/DemoBanner.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Project from './pages/Project.jsx';
import Companies from './pages/Companies.jsx';
import Company from './pages/Company.jsx';
import HowItWorks from './pages/HowItWorks.jsx';
import Report from './pages/Report.jsx';
import Compare from './pages/Compare.jsx';
import Placeholder from './pages/Placeholder.jsx';
import UiKit from './pages/UiKit.jsx';
import Login from './pages/Login.jsx';
import Workspace from './pages/Workspace.jsx';
import Admin from './pages/Admin.jsx';
import Legal from './pages/Legal.jsx';

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
    case 'login': return <Login />;
    case 'workspace': return <Workspace />;
    case 'admin': return <Admin />;
    case 'privacy': return <Legal doc="privacy" />;
    case 'terms': return <Legal doc="terms" />;
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
