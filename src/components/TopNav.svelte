<script>
    import logoutIcon from '../img/logout_icon.svg'
    import logo from '../img/surf-swap.svg'
    import { desoApi, isUserLogged } from '../Store.js';
    import { onMount } from 'svelte';

    const deso = $desoApi;
    let profilePic = '';
    let username = '...';

    async function login() {
        const response = await deso.identity.login('4');
        if(response?.key?.length > 0) {
            $isUserLogged = true;
            profilePic = await getProfilePic();
            username = (await getProfile()).Profile.Username;
        }
    }

    async function logout() {
        const response = await deso.identity.logout(deso.identity.getUserKey());
        if(response) {
            $isUserLogged = false;
        }
    }

    async function getProfile() {
        const request = {
            "PublicKeyBase58Check": deso.identity.getUserKey(),
        }
        const response = await deso.user.getSingleProfile(request);
        return response;
    }

    async function getProfilePic() {
        const response = await deso.user.getSingleProfilePicture(deso.identity.getUserKey());
        return response;
    }

    onMount(async () => {
        if($isUserLogged) {
            profilePic = await getProfilePic();
            username = (await getProfile()).Profile.Username;
        }
    });

</script>

<nav class="p-4">

    <div class="flex flex-row">
        <div class="flex-auto">
            <img src={logo} class="h-9" alt="SurfSwap">
        </div>
        <div class="flex-none">
            {#if $isUserLogged}
                <div class="flex flex-row">
                    <div class="bg-slate-100 rounded-lg p-1">
                        <div class="flex flex-row">
                            <div>
                                <img src={profilePic} class="rounded-full w-7 h-7">
                            </div>
                            <div class="leading-7 ml-2 text-sm mr-1">
                                {username}
                            </div>  
                        </div>      
                    </div>
                    <div class="ml-3">
                        <img on:click={logout} alt="logout" src={logoutIcon} class="mt-2 h-5 ring-4 rounded bg-gray-100 ring-gray-100 hover:cursor-pointer" />
                    </div>
                </div>
            {:else}
                <button on:click={login} class="bg-gradient-to-r from-indigo-500 to-indigo-400 hover:shadow-[0_0_22px_-7px_rgba(1,4,232,0.8)] rounded-lg text-white text-sm py-2 px-4">
                    Login with Deso
                </button>
            {/if}
        </div>
    </div>    
</nav>  