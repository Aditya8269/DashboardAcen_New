import { toast } from 'react-toastify';

export const toastService = {
    success: (message) => {
        toast.success(message);
    },
    error: (message) => {
        toast.error(message);
    },
    warn: (message) => {
        toast.warning(message);
    },
    info: (message) => {
        toast.info(message);
    }
};
