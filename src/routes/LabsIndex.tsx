import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Code2, FlaskConical } from "lucide-react";
import ResourceLibrary from "../components/ResourceLibrary";
import { CircuitMotif } from "../components/QuantumArtwork";
import { LAB_RESOURCES } from "../content/workspaceCatalog";
export default function LabsIndex() {
  return (
    <div className="ql-page ql-human-labs">
      <section className="ql-labs-hero" aria-labelledby="labs-title">
        <div className="ql-labs-hero-copy">
          <p className="ql-eyebrow">QUANTUM LABS</p>
          <h1 id="labs-title">Draw a circuit.<br /><em>Inspect the result.</em></h1>
          <p>Place the gates, run the simulator, and examine the probabilities behind every measurement.</p>
          <Link to="/labs/studio" className="ql-button ql-button-mint">
            <Code2 size={16} />
            Enter Circuit Studio <ArrowRight size={16} />
          </Link>
          <span className="ql-labs-proof">Drag-and-drop gates · live statevector · measurement evidence</span>
        </div>
        <div className="ql-labs-hero-art" aria-hidden="true">
          <span>LIVE WORKBENCH</span>
          <CircuitMotif />
          <div className="ql-labs-result">
            <span>|00⟩</span><i><b style={{ width: "50%" }} /></i><strong>50%</strong>
            <span>|11⟩</span><i><b style={{ width: "50%" }} /></i><strong>50%</strong>
          </div>
        </div>
      </section>
      <section className="ql-lab-pathways" aria-label="Choose how to explore quantum computing">
        <Link to="/labs/guided/superposition">
          <span className="ql-stat-icon"><BookOpen size={19} /></span>
          <span><small>NEW TO QUANTUM?</small><strong>Begin with one guided experiment</strong></span>
          <ArrowRight size={17} />
        </Link>
        <Link to="/explore/algorithms">
          <span className="ql-stat-icon"><FlaskConical size={19} /></span>
          <span><small>READY FOR A FULL PROCEDURE?</small><strong>Trace an algorithm step by step</strong></span>
          <ArrowRight size={17} />
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
