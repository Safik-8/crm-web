import React from 'react';
import DynamicFormSlideover from './DynamicFormSlideover';

/**
 * Premium Slide-over Drawer Component
 * Standardized to delegate to DynamicFormSlideover
 */
const Drawer = ({ isOpen, onClose, title, subtitle, children, width, showFooter = false, ...props }) => {
  return (
    <DynamicFormSlideover
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      showFooter={showFooter}
      width={width || { xs: '100%', sm: 540, md: 640 }}
      {...props}
    >
      {children}
    </DynamicFormSlideover>
  );
};

export default Drawer;
