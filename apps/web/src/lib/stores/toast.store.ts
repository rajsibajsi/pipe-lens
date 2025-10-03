import { writable } from 'svelte/store';

export interface Toast {
	id: string;
	type: 'success' | 'error' | 'warning' | 'info';
	title: string;
	message?: string;
	duration?: number;
	action?: {
		label: string;
		onClick: () => void;
	};
}

interface ToastState {
	toasts: Toast[];
}

const initialState: ToastState = {
	toasts: [],
};

function createToastStore() {
	const { subscribe, update } = writable<ToastState>(initialState);

	return {
		subscribe,

		add: (toast: Omit<Toast, 'id'>) => {
			const id = crypto.randomUUID();
			const newToast: Toast = {
				id,
				duration: 5000,
				...toast,
			};

			update((state) => ({
				...state,
				toasts: [...state.toasts, newToast],
			}));

			// Auto remove after duration
			if (newToast.duration && newToast.duration > 0) {
				setTimeout(() => {
					toastStore.remove(id);
				}, newToast.duration);
			}

			return id;
		},

		remove: (id: string) => {
			update((state) => ({
				...state,
				toasts: state.toasts.filter((toast) => toast.id !== id),
			}));
		},

		clear: () => {
			update((state) => ({
				...state,
				toasts: [],
			}));
		},

		success: (title: string, message?: string, options?: Partial<Toast>) => {
			return toastStore.add({
				type: 'success',
				title,
				message,
				...options,
			});
		},

		error: (title: string, message?: string, options?: Partial<Toast>) => {
			return toastStore.add({
				type: 'error',
				title,
				message,
				duration: 8000, // Errors stay longer
				...options,
			});
		},

		warning: (title: string, message?: string, options?: Partial<Toast>) => {
			return toastStore.add({
				type: 'warning',
				title,
				message,
				...options,
			});
		},

		info: (title: string, message?: string, options?: Partial<Toast>) => {
			return toastStore.add({
				type: 'info',
				title,
				message,
				...options,
			});
		},
	};
}

export const toastStore = createToastStore();
