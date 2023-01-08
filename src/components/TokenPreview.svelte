<script>
    import { getTokenImage } from '../utils/tokens.js';
    import { roundTo6or4Decimals, addSpacesToNumber } from '../utils/numbers.js';
    import { tokenToUsdAmount } from '../utils/daocoins.js';

    export let label;
    export let qty;
    export let token;
</script>    

<div class="border border-grey-500 p-2 rounded-lg">
    <div class="flex text-gray-400 text-sm">
        <div class="flex-none text-left">
            {label}
         </div>
         <div class="flex-auto text-right">
            ~${tokenToUsdAmount(qty, token).toFixed(2)}
        </div>
    </div> 

    <div class="flex mt-2.5">
        <div class="flex-none text-left">
            <div class="flex flex-row py-1">
                <div>
                    <img class="rounded-full w-9 h-9 ml-3.5" src="{getTokenImage(token)}">
                </div>    
                <div class="ml-3.5 leading-9">
                    {token}
                </div>
            </div>    
         </div>
         <div class="flex-auto text-right text-black text-2xl mt-[5px]">
            {addSpacesToNumber(roundTo6or4Decimals(qty))}
        </div>
    </div>  
</div>