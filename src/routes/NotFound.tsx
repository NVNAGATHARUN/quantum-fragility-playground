import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Orbit } from "lucide-react";
export default function NotFound() {
  return (
    <div className="ql-page ql-empty">
      <Orbit size={44} />
      <span className="ql-eyebrow">404 · OUTSIDE OUR OBSERVABLE UNIVERSE</span>
      <h1>This page is still a possibility.</h1>
      <p>Let’s bring you back to something you can explore.</p>
      <Link to="/" className="ql-button ql-button-primary">
        Back to your workspace <ArrowRight size={16} />
      </Link>
    </div>
  );
}
