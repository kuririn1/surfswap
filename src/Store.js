import { readable, writable } from 'svelte/store';
import Deso from 'deso-protocol';
import { get } from 'svelte/store';

export const orders = writable([]);
export const tokenBalances = writable([]);
export const desoUsdPrice = writable(0);
export const desoUserBalance = writable(0);
export const desoApi = readable(new Deso());
const loggedUserPubliKey = get(desoApi)?.identity?.getUserKey();
export const isUserLogged = writable(loggedUserPubliKey === 'null' ? false : loggedUserPubliKey);



