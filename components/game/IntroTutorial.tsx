"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";

const IntroTutorial: React.FC = () => (
  <section className="intro-immersive mb-4">
    <div className="intro-hero text-foreground">
      <div className="intro-hero__glow" />
      <div className="intro-hero__content">
        <p className="text-xs uppercase font-semibold text-cyan mb-1">
          Briefing
        </p>
        <h2 className="text-2xl font-bold mb-2">Culture War: Rise or Vanish</h2>
        <p className="mb-3 text-muted-foreground">
          You lead a digital movement racing to capture the national
          conversation. Shape narratives, outmaneuver bans, and amplify support
          before platforms shut you down.
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="cyan">Build Support</Badge>
          <Badge variant="yellow">Manage Risk</Badge>
          <Badge variant="green">Spend Clout &amp; Funds</Badge>
        </div>
      </div>
      <div className="intro-hero__stats rounded-lg shadow-sm bg-card/90 backdrop-blur-sm">
        <div className="p-4">
          <h6 className="text-xs uppercase font-semibold mb-2 text-foreground">
            Win / Lose
          </h6>
          <ul className="mb-0 intro-list">
            <li>
              Win at <strong>80% average support</strong> across all states.
            </li>
            <li>
              Lose if <strong>Risk reaches 100%</strong> and the platforms ban
              you.
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 intro-panels">
      <div className="intro-panel h-full">
        <h5 className="font-semibold mb-2">Your Toolkit</h5>
        <ul className="intro-list">
          <li>
            <strong>Clout</strong>: Reputation that fuels high-profile actions.
          </li>
          <li>
            <strong>Funds</strong>: Cash to deploy across campaigns.
          </li>
          <li>
            <strong>Risk</strong>: Heat from platforms and authorities—keep it
            low.
          </li>
          <li>
            <strong>Support</strong>: State-by-state backing that drives
            victory.
          </li>
        </ul>
      </div>
      <div className="intro-panel h-full">
        <h5 className="font-semibold mb-2">Flow of a Turn</h5>
        <ol className="intro-steps mb-0">
          <li>
            Choose an <strong>Action</strong> on the right to invest clout or
            funds.
          </li>
          <li>
            Watch the <strong>News</strong> and <strong>Social Media</strong>{" "}
            feeds react.
          </li>
          <li>
            When an <strong>Event</strong> interrupts, pick a response to guide
            the narrative.
          </li>
          <li>
            Check the <strong>Map</strong> for shifting support (deep green
            means momentum).
          </li>
        </ol>
      </div>
      <div className="intro-panel h-full">
        <h5 className="font-semibold mb-2">Field Notes</h5>
        <ul className="intro-list mb-0">
          <li>
            Chain low-cost moves to unlock bigger swings without spiking Risk.
          </li>
          <li>
            Pair growth actions with cover stories to keep scrutiny in check.
          </li>
          <li>
            Advisors hint at hidden angles—read their quotes before you act.
          </li>
        </ul>
      </div>
    </div>
  </section>
);

export default IntroTutorial;
