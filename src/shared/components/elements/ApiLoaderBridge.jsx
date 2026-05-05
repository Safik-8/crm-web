/**
 * ApiLoaderBridge
 *
 * A zero-render component that lives inside the React tree (so it has access
 * to LoaderContext) and registers the loader callbacks with the plain-JS
 * apiClient module.
 *
 * Mount it once, high in the tree, inside <LoaderProvider>.
 * It renders nothing — its only job is the side-effect of wiring up the bridge.
 */

import { useEffect } from 'react';
import { registerLoaderBridge } from '../../../lib/api/api';
import { useLoader } from '../../context/LoaderContext';

const ApiLoaderBridge = () => {
  const { showLoader, hideLoader, forceHideLoader } = useLoader();

  useEffect(() => {
    registerLoaderBridge({
      show: showLoader,
      hide: hideLoader,
      forceHide: forceHideLoader,
    });
  }, [showLoader, hideLoader, forceHideLoader]);

  return null;
};

export default ApiLoaderBridge;
