import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Cpu, FlaskConical } from "lucide-react";
import ResourceLibrary from "../components/ResourceLibrary";
import { ALGORITHM_RESOURCES } from "../content/workspaceCatalog";
export default function ExploreIndex() {
  return (
    <div className="ql-page">
      <div className="ql-page-heading">
        <div>
          <p className="ql-eyebrow">THE ALGORITHM LIBRARY</p>
          <h1>See how quantum algorithms work.</h1>
          <p>
            Each walkthrough starts with a problem, then shows the gates, the changing state, and the measured result.
          </p>
        </div>
        <span className="ql-pill">
          {ALGORITHM_RESOURCES.length} interactive explorations
        </span>
      </div>
      <section className="ql-library-intro" aria-label="How to use the algorithm library">
        <div>
          <span className="ql-eyebrow">A GOOD FIRST RUN</span>
          <h2>Start with a Bell pair</h2>
          <p>Watch two gates create correlations, switch the measurement basis, then try changing the circuit yourself.</p>
          <div className="ql-library-intro-actions">
            <Link to="/explore/algorithms/bell-state" className="ql-button ql-button-primary">Open Bell walkthrough <ArrowRight size={16} /></Link>
            <Link to="/labs/guided/bell-state" className="ql-button ql-button-outline">Try the guided Bell lab</Link>
          </div>
        </div>
        <ol className="ql-library-steps">
          <li><span>01</span><div><strong>Understand the task</strong><p>What answer should the algorithm produce?</p></div></li>
          <li><span>02</span><div><strong>Change one input</strong><p>Watch how the circuit and state respond.</p></div></li>
          <li><span>03</span><div><strong>Read the result</strong><p>Compare the measured outcome with your prediction.</p></div></li>
        </ol>
      </section>
      <div className="ql-library-section-heading">
        <div>
          <span className="ql-eyebrow">BROWSE WALKTHROUGHS</span>
          <h2>Choose a problem to solve</h2>
          <p>Begin with foundations, then move to search, communication, and hybrid algorithms.</p>
        </div>
        <Link to="/labs" className="ql-text-link"><FlaskConical size={16} /> New to quantum? Start in Labs <ArrowRight size={15} /></Link>
      </div>
      <ResourceLibrary resources={ALGORITHM_RESOURCES} kind="algorithms" />
      <Link to="/explore/hardware" className="ql-hardware-banner">
        <span className="ql-stat-icon">
          <Cpu size={25} />
        </span>
        <div>
          <span className="ql-eyebrow">BEYOND THE CIRCUIT</span>
          <h2>Meet the machines behind the mathematics.</h2>
          <p>
            Explore a quantum processor and the hardware that makes it possible.
          </p>
        </div>
        <span>
          Hardware explorer <ArrowUpRight size={18} />
        </span>
      </Link>
    </div>
  );
}
