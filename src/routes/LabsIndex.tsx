import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Code2, FlaskConical } from "lucide-react";
import ResourceLibrary from "../components/ResourceLibrary";
import { CircuitMotif } from "../components/QuantumArtwork";
import { LAB_RESOURCES } from "../content/workspaceCatalog";
export default function LabsIndex() {
  return (
    <div className="ql-page">
      <div className="ql-page-heading">
        <div>
          <p className="ql-eyebrow">QUANTUM LABS</p>
          <h1>Test one quantum idea at a time.</h1>
          <p>Choose a guided experiment to learn a concept, or use Circuit Studio to build your own circuit.</p>
        </div>
        <Link to="/labs/studio" className="ql-button ql-button-primary">
          <Code2 size={16} />
          Open circuit studio
        </Link>
      </div>
      <section className="ql-choice-grid" aria-label="Choose how to explore quantum computing">
        <Link to="/labs/guided/superposition" className="ql-choice-card">
          <BookOpen size={21} aria-hidden="true" />
          <span className="ql-choice-kicker">START HERE · GUIDED</span>
          <h2>Learn a concept</h2>
          <p>Make a prediction, change one control, and compare the result. Start with superposition.</p>
          <span className="ql-choice-link">Start first experiment <ArrowRight size={16} /></span>
        </Link>
        <Link to="/labs/studio" className="ql-choice-card">
          <Code2 size={21} aria-hidden="true" />
          <span className="ql-choice-kicker">BUILD FREELY · STUDIO</span>
          <h2>Design a circuit</h2>
          <p>Place gates, edit parameters, inspect the state, and run your own idea.</p>
          <span className="ql-choice-link">Open Circuit Studio <ArrowRight size={16} /></span>
        </Link>
        <Link to="/explore/algorithms" className="ql-choice-card">
          <FlaskConical size={21} aria-hidden="true" />
          <span className="ql-choice-kicker">NEXT STEP · ALGORITHMS</span>
          <h2>Follow a full procedure</h2>
          <p>See how gates solve a specific task, from Bell states to Grover search.</p>
          <span className="ql-choice-link">Browse algorithms <ArrowRight size={16} /></span>
        </Link>
      </section>
      <section className="ql-feature-banner">
        <div>
          <span className="ql-hero-label">FEATURED OPEN EXPERIMENT</span>
          <h2>How much noise can a Bell pair survive?</h2>
          <p>
            Change the noise level and compare the state before and after decoherence.
          </p>
          <Link to="/labs/fragility" className="ql-button ql-button-mint">
            Open fragility experiment <ArrowRight size={16} />
          </Link>
        </div>
        <CircuitMotif />
      </section>
      <div className="ql-library-section-heading">
        <div>
          <span className="ql-eyebrow">BROWSE EXPERIMENTS</span>
          <h2>Pick the question you want to test</h2>
          <p>Guided labs teach a single idea; open experiments let you vary more of the system.</p>
        </div>
      </div>
      <ResourceLibrary resources={LAB_RESOURCES} kind="labs" />
    </div>
  );
}
