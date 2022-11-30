<script>
    import { tick } from 'svelte';
    import { createEventDispatcher } from "svelte";
    import { cleanInput, addSpacesToNumber } from '../utils/numbers.js';

    const dispatch = createEventDispatcher();

    export let value = '';
    let element;
    let isFocused = false;

    const input = () => {
        dispatch("input", value);
    };

    $: element && sanitizeValue(value);

    async function sanitizeValue(rawValue) {
        if (!rawValue) {
            return;
        }
		value = cleanInput(rawValue?.toString());
        value = addSpacesToNumber(value);
        if(isFocused) {
            const selection = element.selectionStart - rawValue.length + value.length;
            await tick;
            element.setSelectionRange(selection, selection);
        }
	}

</script>

<input class="text-right focus:outline-none text-black text-2xl placeholder:text-black w-full" on:blur={()=>{isFocused=false;}} on:focus={()=>{isFocused=true;}} placeholder="0" bind:this={element} bind:value on:input={input}>