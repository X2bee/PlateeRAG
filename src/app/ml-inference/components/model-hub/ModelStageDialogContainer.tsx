'use client';

import React from 'react';
import ModelStageDialog from './ModelStageDialog';
import { useMlModelWorkspace } from '../MlModelWorkspaceContext';

const ModelStageDialogContainer: React.FC = () => {
    const { stageDialogModel, closeStageDialog } = useMlModelWorkspace();

    if (!stageDialogModel) {
        return null;
    }

    return (
        <ModelStageDialog
            model={stageDialogModel}
            onClose={closeStageDialog}
        />
    );
};

export default ModelStageDialogContainer;
