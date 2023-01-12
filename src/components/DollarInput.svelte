<script>
    import { tick } from 'svelte';
    import { cleanDollarInput, addSpacesToNumber } from '../utils/numbers.js';
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();

    export let value = '~$0.00';
    let element;
    let isFocused = false;

    const input = () => {
        dispatch("input", value);
    };

    function cleanZero() {
        isFocused = true;
        if (value == '~$0' || value == '~$0.00' || value == '' || value == '0.00' || value == '~$') {
            value = '';
        }
    }

    function cleanPlaceholder() {
        isFocused = false;
        if (value == '~$0' || value == '~$' || value == '~$0.' || value == '~$0.0' || value == '') {
            value = '~$0.00';
        }
        if(!value.includes('~$')) {
            value = '~$' + value;
        }
    }

    $: element && sanitizeValue(value);

    async function sanitizeValue(rawValue) {
        value = cleanDollarInput(rawValue?.toString());
        value = value === '0' && !isFocused ? '0.00' : value;
        value = (value ? '~$' : '') + addSpacesToNumber(value);
        if(isFocused) {
            const selection = element.selectionStart - rawValue.length + value.length;
            await tick;
            element.setSelectionRange(selection, selection);
        }
}
    
</script>

<input class="text-right focus:outline-none text-gray-400 text-sm" placeholder="" on:focus={cleanZero} on:blur={cleanPlaceholder} bind:this={element} bind:value on:input={input}>