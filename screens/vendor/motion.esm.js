// Local ES module bridge for offline environments
import './motion.js';

const motion = (typeof window !== 'undefined' ? window.Motion : globalThis.Motion) || {};

export const animate = motion.animate;
export const stagger = motion.stagger;
export const spring = motion.spring;
export default motion;
