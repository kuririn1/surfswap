import { readable, writable } from 'svelte/store';
import Deso from 'deso-protocol';
import { get } from 'svelte/store';

export const orders = writable([]);
export const desoUsdPrice = writable(0);
export const desoApi = readable(new Deso());
export const isUserLogged = writable(!!get(desoApi)?.identity?.getUserKey());



