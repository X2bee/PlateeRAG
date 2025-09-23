'use client';

import React from 'react';
import DeleteModelDialog from './DeleteModelDialog';
import { useMlModelWorkspace } from './MlModelWorkspaceContext';

const MlModelDeleteDialogContainer: React.FC = () => {
    const { deleteState, cancelDelete, confirmDelete } = useMlModelWorkspace();

    if (!deleteState.model) {
        return null;
    }

    return (
        <DeleteModelDialog
            model={deleteState.model}
            isDeleting={deleteState.isDeleting}
            errorMessage={deleteState.error}
            onCancel={cancelDelete}
            onConfirm={confirmDelete}
        />
    );
};

export default MlModelDeleteDialogContainer;
