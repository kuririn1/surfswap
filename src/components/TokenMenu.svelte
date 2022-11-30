<script>
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();
    import { getTokenImage } from '../utils/tokens.js';
    import selectArrow from '../img/select_arrow.svg';
    import xIcon from '../img/x_icon.svg';


    export let tokenList = [];
    export let value = '';
    let searchInput = '';

    const select = (name) => {
        dispatch("select", name);
        back();
    };

    const back = () => {
        dispatch("back");
    };

    let searchFocus = false;

    function setFocus() {
        searchFocus = true;
    }

    function removeFocus() {
        searchFocus = false;
    }
</script>

<div class="text-center mt-3 mb-2.5">
   <img src={selectArrow} alt="back arrow" class="float-left h-2 absolute ml-5 mt-3 rotate-90 rounded-sm hover:cursor-pointer hover:bg-gray-100 hover:ring-8 hover:ring-gray-100" on:click={back}>
    <span class="font-bold text-lg">Select a coin</span>
</div>
<div class="mx-5 mb-5 flex flex-row border rounded-lg border-white {searchFocus ? 'border-blue-400 border' : ''}">
    <input type="text" on:focus={setFocus} on:blur={removeFocus} bind:value={searchInput} class="w-full rounded-l-lg h-10 bg-slate-50 p-2 focus:outline-none" placeholder="Search token by name...">
    <div class="rounded-r-lg bg-slate-50 pr-2">
        <img src={xIcon} on:click={back} class="h-6 mt-2 rounded-md hover:cursor-pointer hover:bg-gray-100 hover:ring-2 hover:ring-gray-100 {searchInput.length > 0 ? 'block' : 'hidden'}">
    </div>
</div>
<hr>
<div class="w-full my-3 overflow-y-scroll max-h-72">
    {#each tokenList as name}
    {#if name.toLowerCase().includes(searchInput.toLowerCase())}
        <div class="flex flex-row hover:bg-slate-200 hover:cursor-pointer py-1" on:click="{()=>select(name)}">
            <div>
                <img class="rounded-full w-9 h-9 ml-3.5" src="{getTokenImage(name)}">
            </div>    
            <div class="ml-3.5 leading-9">
                {name}
            </div>
        </div>    
    {/if}
    {/each}
    {#if tokenList.filter(name => { return name.toLowerCase().includes(searchInput.toLowerCase())}).length === 0}
        <div class="text-center text-gray-400 my-3">
            No results found
        </div>
    {/if}
</div>    
