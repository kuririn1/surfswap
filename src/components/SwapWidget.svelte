<script>
    import TokenInput from './TokenInput.svelte';
    import DollarInput from './DollarInput.svelte';
    import { tokens, oppositeTokens, tradingPairs } from '../utils/tokens.js';
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
        Unknown: 'Unknown',
        None: 'None'
    };

    let errorType = ErrorType.None;

    onMount(async () => {
        updateOrders();
        await updateTokenBalances();
        $desoUsdPrice = await getDesoUsdPrice();
	});

    let ordersTimer, desoPriceTimer, balancesTimer;

   ordersTimer = setInterval(async () => {
        updateOrders();
    }, 8000);

    desoPriceTimer = setInterval(async () => {
        $desoUsdPrice = await getDesoUsdPrice();
    }, 1000 * 45);

    balancesTimer = setInterval(async () => {
        updateTokenBalances();
    }, 1000 * 30);

    const unsubscribe = isUserLogged.subscribe(value => {
        updateTokenBalances();
	});

    onDestroy(async () => {
        clearInterval(ordersTimer);
        clearInterval(desoPriceTimer);
        clearInterval(balancesTimer);
        unsubscribe();
    });

    async function updateOrders() {
        $orders = await getLimitOrders(tokens[topTokenSelection], tokens[downTokenSelection]);
        if($orders === null) {
            isError = true;
            errorType = ErrorType.NotEnoughLiqudity;
            downTokenAmount = 0;
        }
    }

    async function updateTokenBalances() {
        if($isUserLogged) {
            $tokenBalances = await getTokenBalances($desoApi.identity.getUserKey());
            for (let i = 0; i < $tokenBalances.length; i++) {
                let token = $tokenBalances[i].token;
                let tokenPK = $tokenBalances[i].tokenPK;
                if (!tokens.hasOwnProperty(token)) {
                    tokens[token] = tokenPK;
                }
            }

            tokenList = Object.keys(tokens);
            let tokenNames = tradingPairs.map(pair => pair[1]);

            for (let key in tokens) {
                if (key !== "DESO" && !tokenNames.includes(key)) {
                    tradingPairs.push(["DESO", key]);
                }
            }
        } else {
            $tokenBalances = [];
        }
    }

    function addToken(name, tokenPK) {
        if (!tokens.hasOwnProperty(name)) {
            tokens[name] = tokenPK;
            tokenList = Object.keys(tokens);
            tradingPairs.push(["DESO", name]);
        }  
    }

    function updateTokensTop() {
        let topTokenAmountStripped = stripExtraChars(cleanInput(topTokenAmount));

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
        let downTokenAmountStripped = stripExtraChars(cleanInput(downTokenAmount));

        resetError();

        try {
            downUsdAmount = tokenToUsdAmount(downTokenAmountStripped, downTokenSelection);
            updateTopAmounts(downTokenAmountStripped);
        } catch(e) {
            isError = true;
            errorType = ErrorType.NotEnoughLiqudity;
            downTokenAmount = 0;
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
            downTokenAmount = 0;
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
                downTokenAmount = 0;
            }
    }

    function reversePair() { 
        let temp = topTokenSelection;
        topTokenSelection = downTokenSelection;
        downTokenSelection = temp;  

        resetAmounts();
        updateOrders();
    }

    function resetAmounts() {
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

    function calculateReverseSpread(a, b) {
        try {
            const reserveSpread =  ((1 - (pricePerSellToken / (getPriceForTheSide('top', downTokenSelection, stripExtraChars(topTokenAmount)) / stripExtraChars(topTokenAmount)))) * -100).toFixed(2);
            return reserveSpread;
        } catch(e) {
            console.log(e);
            return 0;
        }    
    }

    function resetError() {
        if($orders) {
            isError = false;
            errorType = ErrorType.None;
        }
    }    

    $: isAmountEmpty = !topTokenAmount || parseFloat(stripExtraChars(topTokenAmount)) === 0;
    $: spread = ((1 - parseFloat(cleanInput(downUsdAmount)) / parseFloat(cleanInput(topUsdAmount))) * -100).toFixed(2);
    //$: reverseSpread = downTokenSelection === 'DESO' ? calculateReverseSpread(topTokenAmount, downTokenAmount) : 0;
    $: pricePerBuyToken = roundTo6or4Decimals((parseFloat(cleanInput(topTokenAmount))/parseFloat(cleanInput(downTokenAmount))));
    $: pricePerSellToken = roundTo6or4Decimals((parseFloat(cleanInput(downTokenAmount))/parseFloat(cleanInput(topTokenAmount))));
    $: pricePerBuyTokenUsd = noLiqudity ? 0 : roundTo6or4Decimals(tokenToUsdAmount(pricePerBuyToken, topTokenSelection));
    $: pricePerSellTokenUsd = noLiqudity ? 0 : roundTo6or4Decimals(tokenToUsdAmount(pricePerSellToken, downTokenSelection));
    $: insufficientBalance = parseFloat(stripExtraChars(topTokenAmount)) > getBalance(topTokenSelection);
    $: topTokenBalance = getBalance(topTokenSelection, $tokenBalances);
    $: downTokenBalance = getBalance(downTokenSelection, $tokenBalances);
    $: noLiqudity = errorType === ErrorType.NotEnoughLiqudity;

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
                                <span class="text-indigo-400 hover:text-indigo-500 hover:cursor-pointer" on:click="{() => { topTokenAmount = topTokenBalance.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 18 })
                                    ; updateTokensTop(); }}">Max</span>   
                            {/if}
                        </p>
                    {/if}
                </div>
            </div>
            <div class="flex h-9">
                <div class="flex-none text-left">
                   <TokenSelect name={topTokenSelection} on:click={() => { screen = swapScreen.TokenListUp; updateTokenBalances(); }} />
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
                <TokenSelect name={downTokenSelection} on:click={() => { screen = swapScreen.TokenListDown; updateTokenBalances(); }} />    
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
                Unknown error.
            {/if}
        </div>    
    {/if}

    {#if $isUserLogged}
        <button on:click={() => { screen = swapScreen.ReviewOrder; }} class="bg-gradient-to-r from-indigo-500 to-indigo-400 hover:shadow-[0_0_22px_-7px_rgba(1,4,232,0.8)] rounded-lg text-center w-full text-white mt-4 p-2 disabled:opacity-50" disabled='{isAmountEmpty || insufficientBalance || noLiqudity}'>
            {#if isAmountEmpty}
                Enter amount to swap
            {:else if insufficientBalance}
                Insufficient balance of {topTokenSelection}
            {:else if noLiqudity}
                No liqudity to make a swap
            {:else}
                Review order
            {/if}
        </button>
    {:else}
        <button class="bg-gradient-to-r from-indigo-500 to-indigo-400 hover:shadow-[0_0_22px_-7px_rgba(1,4,232,0.8)] rounded-lg text-center w-full text-white mt-4 p-2 disabled:opacity-50" disabled="true">Login with Deso</button>
    {/if}
    </div>

{/if}

{#if screen === swapScreen.TokenListUp}
    <TokenMenu tokenList={tokenList} on:select={(e)=> { topTokenSelection = e.detail?.name; if(e.detail?.tokenPK) { addToken(topTokenSelection, e.detail?.tokenPK); } updateTopTokenSelection(); }} on:back={() => {screen = swapScreen.Main; updateOrders(); }} />
{/if}

{#if screen === swapScreen.TokenListDown}
    <TokenMenu tokenList={tokenList} on:select={(e)=> { downTokenSelection = e.detail?.name; if(e.detail?.tokenPK) { addToken(topTokenSelection, e.detail?.tokenPK); } updateDownTokenSelection(); }} on:back={() => {screen = swapScreen.Main; updateOrders(); }} />
{/if}

{#if screen === swapScreen.ReviewOrder}
    <ReviewOrder buyToken={downTokenSelection} sellToken={topTokenSelection} qty={topTokenAmount} qtyBuy={downTokenAmount} on:back={() => {screen = swapScreen.Main; updateTokenBalances(); updateOrders(); }} />
{/if}

</div>

{#if screen === swapScreen.Main && !noLiqudity}
    <div class="max-w-md mx-auto mt-4 text-sm px-8">
    <!-- {isNaN(spread) || spread == 0 ? '' :  -->
    {#if !isNaN(spread) && spread != 0 && spread != Infinity}
        <div><span class="text-gray-400">Spread</span> <span class="float-right">{spread}%</span></div>
   <!-- {:else if !isNaN(reverseSpread) && reverseSpread != 0 && reverseSpread != Infinity}
        <div><span class="text-gray-400">Spread</span> <span class="float-right">{reverseSpread}%</span></div>
   -->   
    {/if}
    {#if !isNaN(pricePerBuyToken)}    
        <div><span class="text-gray-400">{downTokenSelection} buy price</span> <span class="float-right">{pricePerBuyToken}{downTokenSelection === 'DESO' ? ` ${topTokenSelection}` : 'Ð'} <span class="text-gray-400">~${pricePerBuyTokenUsd}</span></span></div>
    {/if}   
    {#if !isNaN(pricePerSellToken)}    
        <div><span class="text-gray-400">{topTokenSelection} sell price</span> <span class="float-right">{pricePerSellToken}{topTokenSelection === 'DESO' ? ` ${downTokenSelection}` : 'Ð'} <span class="text-gray-400">~${pricePerSellTokenUsd}</span></span></div>
    {/if}   
    </div>
{/if}









