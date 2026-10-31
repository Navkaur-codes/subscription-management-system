"use client";
/** Single place GSAP + plugins are registered. Motion components import from here, pages never import gsap. */
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { Flip } from "gsap/Flip";

gsap.registerPlugin(useGSAP, SplitText, ScrambleTextPlugin, DrawSVGPlugin, MotionPathPlugin, Flip);

export const reduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export { gsap, useGSAP, SplitText, Flip };
