import { desoApi } from '../Store.js';
import { get } from 'svelte/store';

const deso = get(desoApi);

export const getProfile = async () => {
    const request = {
        "PublicKeyBase58Check": deso.identity.getUserKey(),
    }
    const response = await deso.user.getSingleProfile(request);
    return response;
}

export const getProfilePic = async () => {
    const response = await deso.user.getSingleProfilePicture(deso.identity.getUserKey());
    return response;
}