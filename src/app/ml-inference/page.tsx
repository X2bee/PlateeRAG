'use client';

import React from 'react';
import { MlModelWorkspaceProvider } from './components/MlModelWorkspaceContext';
import MlModelWorkspacePage from './components/MlModelWorkspacePage';

const MlInferencePage: React.FC = () => {
    return (
        <MlModelWorkspaceProvider>
            <MlModelWorkspacePage view="full" />
        </MlModelWorkspaceProvider>
    );
};

export default MlInferencePage;
