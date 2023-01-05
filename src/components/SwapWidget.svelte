<script>
    import TokenInput from './TokenInput.svelte';
    import DollarInput from './DollarInput.svelte';
    import { tokens, oppositeTokens } from '../utils/tokens.js';
    import { getLimitOrders, getDesoUsdPrice, tokenToUsdAmount, usdToTokenAmount, getPriceForTheSide, getTokenBalances, getBalance } from '../utils/daocoins.js';
    import { roundTo6or4Decimals, stripExtraChars, cleanInput } from '../utils/numbers.js';
    import { onDestroy, onMount } from 'svelte';
    import { orders, desoUsdPrice, isUserLogged, desoApi, tokenBalances } from '../Store.js';
    import downArrow from '../img/down_arrow.svg';
    import TokenSelect from './TokenSelect.svelte';
    import TokenMenu from './TokenMenu.svelte';
    import ReviewOrder from './ReviewOrder.svelte';

    let tokenList = Object.keys(tokens);

    let topTokenSelection = 'DESO';
    let downTokenSelection = 'openfund';

    let topTokenAmount;
    let downTokenAmount;

    let topUsdAmount;
    let downUsdAmount;

    const swapScreen = {
        Main: 'Main',
        TokenListUp: 'TokenListUp',
        TokenListDown: 'TokenListDown',
        ReviewOrder: 'ReviewOrder'
    };

    let screen = swapScreen.Main;

    let isError = false;
    const ErrorType = {
        NotEnoughLiqudity: 'NotEnoughLiqudity',
        Uknown: 'Uknown',
        None: 'None'
    };

    let errorType = ErrorType.None;

    onMount(async () => {
        updateOrders();
        await updateTokenBalances();
        $desoUsdPrice = await getDesoUsdPrice();
	});

    let ordersTimer, desoPriceTimer;

   ordersTimer = setInterval(async () => {
        updateOrders();
    }, 8000);

    desoPriceTimer = setInterval(async () => {
        $desoUsdPrice = await getDesoUsdPrice();
    }, 1000 * 30);

    onDestroy(async () => {
        clearInterval(ordersTimer);
        clearInterval(desoPriceTimer);
    });

    async function updateOrders() {
        $orders = await getLimitOrders(tokens[topTokenSelection], tokens[downTokenSelection]);
    }

    async function updateTokenBalances() {
        if($isUserLogged) {
            $tokenBalances = await getTokenBalances($desoApi.identity.getUserKey());
        }
    }

    function updateTokensTop() {
        let topTokenAmountStripped = stripExtraChars(topTokenAmount);

        resetError();

        try {
            topUsdAmount = tokenToUsdAmount(topTokenAmountStripped, topTokenSelection);
            updateDownAmounts(topTokenAmountStripped);
        } catch(e) {
            isError = true;
            errorType = ErrorType.NotEnoughLiqudity;
        }
    }

    function updateTokensDown() {
        let downTokenAmountStripped = stripExtraChars(downTokenAmount);

        resetError();

        try {
            downUsdAmount = tokenToUsdAmount(downTokenAmountStripped, downTokenSelection);
            updateTopAmounts(downTokenAmountStripped);
        } catch(e) {
            isError = true;
            errorType = ErrorType.NotEnoughLiqudity;
        }
    }

    function updateTokensTopUsd() {
        resetError();

        try {
            topTokenAmount = usdToTokenAmount(stripExtraChars(topUsdAmount), topTokenSelection);
            updateDownAmounts(topTokenAmount);
            topTokenAmount = roundTo6or4Decimals(topTokenAmount);
        } catch(e) {
            isError = true;
            errorType = ErrorType.NotEnoughLiqudity;
        }
    }

    function updateTokensDownUsd() {
        resetError();
        try {
            downTokenAmount = usdToTokenAmount(stripExtraChars(downUsdAmount), downTokenSelection);
            updateTopAmounts(downTokenAmount);
            downTokenAmount = roundTo6or4Decimals(downTokenAmount);
        } catch(e) {
            isError = true;
            errorType = ErrorType.NotEnoughLiqudity;
        }
    }

    function updateTopAmounts(_downTokenAmount) {
            try {
                topTokenAmount = getPriceForTheSide('top', topTokenSelection, _downTokenAmount);
                topUsdAmount = tokenToUsdAmount(topTokenAmount, topTokenSelection);
                topTokenAmount = roundTo6or4Decimals(topTokenAmount);
            } catch (e) {
                isError = true;
                errorType = ErrorType.NotEnoughLiqudity;
            }
    }

    async function updateDownAmounts(_topTokenAmount) {
            try {
                downTokenAmount = getPriceForTheSide('down', downTokenSelection, _topTokenAmount);
                downUsdAmount = tokenToUsdAmount(downTokenAmount, downTokenSelection);
                downTokenAmount = roundTo6or4Decimals(downTokenAmount);
            } catch (e) {
                isError = true;
                errorType = ErrorType.NotEnoughLiqudity;
            }
    }

    function reversePair() { 
        let temp = topTokenSelection;
        topTokenSelection = downTokenSelection;
        downTokenSelection = temp;  

        topTokenAmount = null;
        downTokenAmount = null;
        topUsdAmount = '~$0.00';
        downUsdAmount ='~$0.00';
    }

    async function updateDownTokenSelection() {
        topTokenSelection = oppositeTokens(downTokenSelection)[0];
        await updateOrders();
        updateTokensTop();
    }

    async function updateTopTokenSelection() {
        downTokenSelection = oppositeTokens(topTokenSelection)[0];
        await updateOrders();
        updateTokensTop();
    }

    function resetError() {
        isError = false;
        errorType = ErrorType.None;
    }    

    $: isAmountEmpty = !topTokenAmount || parseFloat(stripExtraChars(topTokenAmount)) === 0;
    $: spread = ((1 - parseFloat(cleanInput(downUsdAmount)) / parseFloat(cleanInput(topUsdAmount))) * -100).toFixed(2);
    $: reverseSpread = downTokenSelection === 'DESO' ? ((1 - tokenToUsdAmount(getPriceForTheSide('down', topTokenSelection, downTokenAmount), topTokenSelection) / parseFloat(tokenToUsdAmount(topTokenAmount, topTokenSelection))) * -100).toFixed(2) : 0;
    $: pricePerBuyToken = roundTo6or4Decimals((parseFloat(cleanInput(topTokenAmount))/parseFloat(cleanInput(downTokenAmount))));
    $: pricePerBuyTokenUsd = roundTo6or4Decimals(tokenToUsdAmount(pricePerBuyToken, topTokenSelection));
    $: insufficientBalance = parseFloat(stripExtraChars(topTokenAmount)) > getBalance(topTokenSelection);
    $: topTokenBalance = getBalance(topTokenSelection, $tokenBalances);
    $: downTokenBalance = getBalance(downTokenSelection, $tokenBalances);

</script>


<div class="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">

{#if screen === swapScreen.Main}
    <div class="p-5">
    <div class="border border-grey-500 p-2 rounded-lg">
            <div class="flex">
                <div class="flex-none">    
                    <p class="text-gray-400 text-sm mb-3">You sell</p>
                </div>
                <div class="flex-auto text-right">
                    {#if $isUserLogged}
                        <p class="text-gray-400 text-sm mb-3">Balance: {roundTo6or4Decimals(topTokenBalance)} 
                            {#if topTokenBalance > 0}
                                <span class="text-indigo-400 hover:text-indigo-500 hover:cursor-pointer" on:click="{() => { topTokenAmount = topTokenBalance; updateTokensTop(); }}">Max</span>   
                            {/if}
                        </p>
                    {/if}
                </div>
            </div>
            <div class="flex h-9">
                <div class="flex-none text-left">
                   <TokenSelect name={topTokenSelection} on:click={() => { screen = swapScreen.TokenListUp }} />
                 </div>
                 <div class="flex-auto text-right">
                    <TokenInput bind:value={topTokenAmount} on:input={updateTokensTop} />
                </div>
            </div>    
                  
        <div class="text-right">
            <DollarInput bind:value={topUsdAmount} on:input={updateTokensTopUsd} />
        </div>
    </div>

    <div class="text-center mt-1 -mb-1">
        <button on:click={reversePair}><img class="h-6 transition duration-300 hover:rotate-180" src={downArrow}></button>
    </div>

    <div class="border border-grey-500 p-2 rounded-lg">
        <div class="flex">
            <div class="flex-none">    
                <p class="text-gray-400 text-sm mb-3">You buy</p>
            </div>
            <div class="flex-auto text-right">
                {#if $isUserLogged}
                    <p class="text-gray-400 text-sm mb-3">Balance: {roundTo6or4Decimals(downTokenBalance)}</p>
                {/if}
            </div>
        </div>
        <div class="flex h-9">
            <div class="flex-none text-left">
                <TokenSelect name={downTokenSelection} on:click={() => { screen = swapScreen.TokenListDown }} />    
            </div>
            <div class="flex-auto text-right">
                <TokenInput bind:value={downTokenAmount} on:input={updateTokensDown} />
            </div>
        </div> 

        <div class="text-right">
            <DollarInput bind:value={downUsdAmount} on:input={updateTokensDownUsd} />
        </div>
    </div>

    {#if isError}
        <div class="bg-red-200 p-3 text-sm rounded-md mt-3.5 text-red-700 leading-6">
            {#if errorType === ErrorType.NotEnoughLiqudity}
                Not enough liqudity to make this swap.
            {:else}
                Uknown error.
            {/if}
        </div>    
    {/if}

    {#if $isUserLogged}
        <button on:click={() => { screen = swapScreen.ReviewOrder; }} class="bg-gradient-to-r from-indigo-500 to-indigo-400 hover:shadow-[0_0_22px_-7px_rgba(1,4,232,0.8)] rounded-lg text-center w-full text-white mt-4 p-2 disabled:opacity-50" disabled='{isAmountEmpty || insufficientBalance}'>
            {#if isAmountEmpty}
                Enter amount to swap
            {:else if insufficientBalance}
                Insufficient balance of {topTokenSelection}
            {:else}
                Review order
            {/if}
        </button>
    {:else}
        <button class="bg-gradient-to-r from-indigo-500 to-indigo-400 hover:shadow-[0_0_22px_-7px_rgba(1,4,232,0.8)] rounded-lg text-center w-full text-white mt-4 p-2">Login with Deso</button>
    {/if}
    </div>

{/if}

{#if screen === swapScreen.TokenListUp}
    <TokenMenu tokenList={tokenList} on:select={(e)=> { topTokenSelection = e.detail; updateTopTokenSelection(); }} on:back={() => {screen = swapScreen.Main }} />
{/if}

{#if screen === swapScreen.TokenListDown}
    <TokenMenu tokenList={tokenList} on:select={(e)=> { downTokenSelection = e.detail; updateDownTokenSelection(); }} on:back={() => {screen = swapScreen.Main }} />
{/if}

{#if screen === swapScreen.ReviewOrder}
    <ReviewOrder buyToken={downTokenSelection} sellToken={topTokenSelection} qty={topTokenAmount} on:back={() => {screen = swapScreen.Main }} />
{/if}

</div>

{#if screen === swapScreen.Main}
    <div class="max-w-md mx-auto mt-4 text-sm px-8">
    <!-- {isNaN(spread) || spread == 0 ? '' :  -->
    {#if !isNaN(spread) && spread != 0 && spread != Infinity}
        <div><span class="text-gray-400">Spread</span> <span class="float-right">{spread}%</span></div>
    {/if}
    {#if !isNaN(pricePerBuyToken)}    
        <div><span class="text-gray-400">{downTokenSelection} buy price</span> <span class="float-right">{pricePerBuyToken}{downTokenSelection === 'DESO' ? ` ${topTokenSelection}` : 'Ð'} <span class="text-gray-400">~${pricePerBuyTokenUsd}</span></span></div>
    {/if}    
    </div>
{/if}









