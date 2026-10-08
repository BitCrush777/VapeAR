import React from 'react';
import { ExperienceHUD, type ExperienceHUDProps } from './ExperienceHUD';

export const InteractionHint: React.FC<ExperienceHUDProps> = (props) => {
  return <ExperienceHUD {...props} />;
};

export default InteractionHint;
