// src/shared/components/elements/GlobalLoader.jsx

import React from 'react';
import { useLoader } from '../../context/LoaderContext';

/**
 * GlobalLoader
 *
 * Rendered as a thin, premium brand-orange progress line anchored to the top of the content pane.
 * Avoids blocking user interactions and replaces the fullscreen Lottie screen overlay.
 */
const GlobalLoader = () => {
  const { isLoading } = useLoader();

  if (!isLoading) return null;

  return (
    <div
      className="top-progress-bar"
      role="progressbar"
      aria-label="Loading progress"
      aria-busy={isLoading}
    />
  );
};

export default GlobalLoader;
