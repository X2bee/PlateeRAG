'use client';

import React from 'react';
import DeleteModelDialog from './DeleteModelDialog';
import { useMlModelWorkspace } from '../MlModelWorkspaceContext';
import type { RegisteredModel } from '../../types';

const MlModelDeleteDialogContainer: React.FC = () => {
    const { deleteState, cancelDelete, confirmDelete, openStageDialog } = useMlModelWorkspace();

    if (!deleteState.model) {
        return null;
    }

    const handleStageChangeRequest = (model: RegisteredModel) => {
        cancelDelete();
        openStageDialog(model);
    };

    const modalContent = (
        <DeleteModelDialog
            model={deleteState.model}
            isDeleting={deleteState.isDeleting}
            errorMessage={deleteState.error}
            errorCode={deleteState.errorCode}
            onCancel={cancelDelete}
            onConfirm={confirmDelete}
            onRequestStageChange={handleStageChangeRequest}
        />
    );

    return modalContent;
};

export default MlModelDeleteDialogContainer;
