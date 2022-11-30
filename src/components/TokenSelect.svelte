<script>
    import selectArrow from '../img/select_arrow.svg';
    import { getTokenImage } from '../utils/tokens.js';
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();
    

    export let name = '';

    const click = () => {
        dispatch("click", name);
    };
</script>   

<div on:click={click} class="inline-flex flex-row hover:bg-slate-200 rounded-2xl width-auto p-1.5 hover:cursor-pointer">
    <div>
        <img class="rounded-full w-8 h-8" src="{getTokenImage(name)}">
    </div>
    <div class="leading-8 ml-3">
        <span class="text-lg font-semibold">{name}</span>
    </div>
    <div class="ml-2">
        <img class="h-1.5 mt-[0.80rem]" src={selectArrow}>
    </div>
</div>