'use client';

import React from 'react';
import DeleteModelDialog from './DeleteModelDialog';
import { useMlModelWorkspace } from '../MlModelWorkspaceContext';
import { create } from 'domain';
import { createPortal } from 'react-dom';

const MlModelDeleteDialogContainer: React.FC = () => {
    const { deleteState, cancelDelete, confirmDelete } = useMlModelWorkspace();

    if (!deleteState.model) {
        return null;
    }

    const modalContent = (
        <DeleteModelDialog
            model={deleteState.model}
            isDeleting={deleteState.isDeleting}
            errorMessage={deleteState.error}
            onCancel={cancelDelete}
            onConfirm={confirmDelete}
        />
    );

    return modalContent;
};

export default MlModelDeleteDialogContainer;
