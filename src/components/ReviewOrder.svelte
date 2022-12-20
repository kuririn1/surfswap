<script>
    import { onDestroy, onMount } from 'svelte';
    import { desoApi } from '../Store.js';
    import { tokens } from '../utils/tokens.js';
    import { stripExtraChars } from '../utils/numbers.js';
    import TokenPreview from './TokenPreview.svelte';
    import selectArrow from '../img/select_arrow.svg';
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();

    const deso = $desoApi;

    export let buyToken;
    export let sellToken;
    export let qty;

    let buyQty = 0;
    let sellQty = 0;

    let transactionHex;
    let transactionId;
    let orderComplete = false;
    let loading = false;
    let isError = false;
    const ErrorType = {
        NotEnoughCoins: 'NotEnoughCoins',
        MatchingOwnOrder: "MatchingOwnOrder",
        Uknown: 'Uknown',
        None: 'None'
    };
    let errorType = ErrorType.None;

    const back = () => {
        dispatch("back");
    };

    async function updatePrices() {
        let { BuyingCoinQuantityFilled, SellingCoinQuantityFilled } = await getSimulatedMarketOrderResult();
       buyQty = BuyingCoinQuantityFilled;
       sellQty = SellingCoinQuantityFilled;
    }

    let updatePricesTimer;

    onMount(async () => {
        updatePrices();
        updatePricesTimer = setInterval(async () => {
            updatePrices();
        }, 8000);
	});

    onDestroy(async () => {
        clearInterval(updatePricesTimer);
    });

    async function getSimulatedMarketOrderResult() {
        const request = {
            "OperationType" : "ASK",
            "TransactorPublicKeyBase58Check" : deso.identity.getUserKey(),
            "BuyingDAOCoinCreatorPublicKeyBase58Check" : tokens[buyToken],
            "SellingDAOCoinCreatorPublicKeyBase58Check" : tokens[sellToken],
            "Quantity" : qty,
            "FillType" : "FILL_OR_KILL",
            "MinFeeRateNanosPerKB":1000
        };
        try {
            const response = await deso.dao.createDaoCoinMarketOrder(request);
            transactionHex = response.TransactionHex;
            return response?.SimulatedExecutionResult;
        } catch (e) {
            isError = true;
            if(e.response.data.error.includes("is not enough to cover the amount they are selling")) {
                errorType = ErrorType.NotEnoughCoins;
                return {
                    "BuyingCoinQuantityFilled": 0,
                    "SellingCoinQuantityFilled": 0
                }
            } else if(e.response.data.error.includes("Error getting orders to match: : RuleErrorDAOCoinLimitOrderMatchingOwnOrder")) {
                errorType = ErrorType.MatchingOwnOrder;
            } else {
                errorType = ErrorType.Uknown;
                console.log(e.response.data.error);
            }
        }
    }

    async function sendMarketOrder() {
        try {
            loading = true;
            const response = await deso.identity.submitTransaction(transactionHex);
            transactionId = response.TransactionIDBase58Check;
            orderComplete = true;
            loading = false;
        } catch (e) {
            loading = false;
            console.log(e.response.data.error);
        }
    }

    $: qty = stripExtraChars(qty);
</script>

{#if orderComplete} 
    <div class="text-center mt-3 mb-2.5">
        <img src={selectArrow} alt="back arrow" class="float-left h-2 absolute ml-5 mt-3 rotate-90 rounded-sm hover:cursor-pointer hover:bg-gray-100 hover:ring-8 hover:ring-gray-100" on:click={back}>
        <span class="font-bold text-lg">Order complete</span>
    </div>
    <hr>

    <div class="p-5 justify-center text-center">
        <span class="text-sm mt-3">Transaction ID:</span>
        <input class="w-full text-xs mt-1.5" type="text" value={transactionId} readonly>
    </div>    
{:else}
    <div class="text-center mt-3 mb-2.5">
        <img src={selectArrow} alt="back arrow" class="float-left h-2 absolute ml-5 mt-3 rotate-90 rounded-sm hover:cursor-pointer hover:bg-gray-100 hover:ring-8 hover:ring-gray-100" on:click={back}>
        <span class="font-bold text-lg">Order review</span>
    </div>
    <hr>

    <div class="p-5">
    <TokenPreview token={sellToken} qty={sellQty} label="You sell" />
    <div class="h-3.5"></div>
    <TokenPreview token={buyToken} qty={buyQty} label="You buy" /> 
    
    {#if isError}
        <div class="bg-red-200 p-3 text-sm rounded-md mt-3.5 text-red-700 leading-6">
            {#if errorType === ErrorType.NotEnoughCoins}
                You don't have enough {sellToken} to complete this order.
            {:else if errorType === ErrorType.MatchingOwnOrder}
                This order is matching your own order.
            {:else}
                Uknown error.
            {/if}
        </div>    
    {/if}

    <button on:click={sendMarketOrder} class="bg-gradient-to-r from-cyan-500 to-blue-500  hover:from-blue-500 hover:to-cyan-500  rounded-lg inline-flex items-center justify-center w-full text-white mt-4 p-2 disabled:opacity-50" disabled='{isError}'>
       {#if loading}
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
            Executing order
        {:else}
            Place Order
        {/if}
    </button>
    </div>
{/if}

   
