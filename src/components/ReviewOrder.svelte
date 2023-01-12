<script>
    import { onDestroy, onMount } from 'svelte';
    import { desoApi } from '../Store.js';
    import { tokens, findNameBasedOnPK } from '../utils/tokens.js';
    import { stripExtraChars, roundTo6or4Decimals } from '../utils/numbers.js';
    import TokenPreview from './TokenPreview.svelte';
    import selectArrow from '../img/select_arrow.svg';
    import completeImg from '../img/complete.svg';
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();

    const deso = $desoApi;

    export let buyToken;
    export let sellToken;
    export let qty;
    export let qtyBuy;

    let buyQty = 0;
    let sellQty = 0;

    let transactionHex;
    let transactionId;
    let orderDetails;
    let orderComplete = false;
    let loading = false;
    let isError = false;
    const ErrorType = {
        NotEnoughCoins: 'NotEnoughCoins',
        MatchingOwnOrder: "MatchingOwnOrder",
        NotEnoughDeso: "NotEnoughDeso",
        OverspendingDeso: "OverspendingDeso",
        BuyingRestricted: "BuyingRestricted",
        Unknown: 'Unknown',
        None: 'None'
    };
    let errorType = ErrorType.None;

    const back = () => {
        dispatch("back");
    };

    async function updatePrices() {
        try {
            let { BuyingCoinQuantityFilled, SellingCoinQuantityFilled } = await getSimulatedMarketOrderResult();
            buyQty = BuyingCoinQuantityFilled;
            sellQty = SellingCoinQuantityFilled;
        } catch(e) {
            isError = true;
            errorType = ErrorType.Unknown;
            console.log(e);
        }
    }

    let updatePricesTimer, refreshTimer, timerCount = 8;

    onMount(async () => {
        updatePrices();
        updatePricesTimer = setInterval(async () => {
            await updatePrices();
            timerCount = 8;
        }, 8000);
        refreshTimer = setInterval(async () => {
            timerCount--;
        }, 1000);
	});

    onDestroy(async () => {
        clearInterval(updatePricesTimer);
        clearInterval(refreshTimer);
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
            } else if(e.response.data.error.includes("RuleErrorDAOCoinLimitOrderMatchingOwnOrder")) {
                errorType = ErrorType.MatchingOwnOrder;
            } else if(e.response.data.error.includes("AddInputsAndChangeToTransaction: Sanity check failed:")) {
                errorType = ErrorType.NotEnoughDeso;
            } else if(e.response.data.error.includes("RuleErrorDAOCoinLimitOrderOverspendingDESO")) {
                errorType = ErrorType.OverspendingDeso;
            } else if(e.response.data.error.includes("Buying this DAO coin is restricted to the creator of the DAO")) {
                errorType = ErrorType.BuyingRestricted;
            } else {
                errorType = ErrorType.Unknown;
                console.log(e.response.data.error);
            }
            return {
                    "BuyingCoinQuantityFilled": qtyBuy,
                    "SellingCoinQuantityFilled": qty
            }
        }
    }

    async function sendMarketOrder() {
        try {
            loading = true;
            const response = await deso.identity.submitTransaction(transactionHex);
            transactionId = response.TransactionIDBase58Check;
            orderComplete = true;
            clearInterval(updatePricesTimer);
            clearInterval(refreshTimer);
            loading = false;
            orderDetails = await getCompletedTransactionInfo(transactionId);
            addTxToDB(transactionId);
        } catch (e) {
            loading = false;
            isError = true;
            errorType = ErrorType.Unknown;
            console.log(e.response.data.error);
        }
    }

    function addTxToDB(txId) {
        try {
            fetch('https://surfswap.tools.workers.dev/tx/add/' + txId);
        } catch(e) {
            console.log(e);
        }
    }

    async function getCompletedTransactionInfo(txId) {
        const response = await fetch('https://node.deso.org/api/v1/transaction-info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                TransactionIDBase58Check: txId
            })
        });
        const result = await response.json();

        if(result?.Transactions?.length === 0) {
            throw new Error('Order error');
        }
        
        const ordersFilled = result.Transactions[0].TransactionMetadata.DAOCoinLimitOrderTxindexMetadata.FilledDAOCoinLimitOrdersMetadata.filter(order => order.IsFulfilled);
        if(ordersFilled?.length === 0) {
            throw new Error('Order not filled');
        }
        const coinBoughtPK = ordersFilled[0].BuyingDAOCoinCreatorPublicKey;
        const coinSoldPK = ordersFilled[0].SellingDAOCoinCreatorPublicKey;
        const coinBoughtName = findNameBasedOnPK(coinBoughtPK);
        const coinSoldName = findNameBasedOnPK(coinSoldPK);
        const coinsBought = ordersFilled.reduce((acc, order) => acc + parseInt(order.CoinQuantityInBaseUnitsBought, 16), 0);
        const coinsSold = ordersFilled.reduce((acc, order) => acc + parseInt(order.CoinQuantityInBaseUnitsSold, 16), 0);
        return {
            isFulfilled: true,
            coinBoughtName,
            coinSoldName,
            coinsBought : coinsBought / (coinBoughtName === 'DESO' ? 1E9 : 1E18),
            coinsSold : coinsSold / (coinSoldName === 'DESO' ? 1E9 : 1E18)
        };
    }

    $: qty = stripExtraChars(qty);
    $: qtyBuy = stripExtraChars(qtyBuy);
</script>

{#if orderComplete} 
    <div class="text-center">
        <!-- <img src={selectArrow} alt="back arrow" class="float-left h-2 absolute ml-5 mt-3 rotate-90 rounded-sm hover:cursor-pointer hover:bg-gray-100 hover:ring-8 hover:ring-gray-100" on:click={back}> -->
        <img src="{completeImg}" alt="Order complete" class="my-8 w-16 mx-auto">
        <span class="font-bold text-xl">Order complete</span>
    </div>

    <div class="mt-3 px-5 pb-5 justify-center text-center">

        <div class="text-sm font-bold mb-2">
            {#if orderDetails?.isFulfilled}
                Swapped {roundTo6or4Decimals(orderDetails.coinsSold)} {orderDetails.coinSoldName} for {roundTo6or4Decimals(orderDetails.coinsBought)} {orderDetails.coinBoughtName}
            {:else}
            <div class="flex justify-center">
               <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="#6366f1" stroke-width="4"></circle>
                    <path class="opacity-75" fill="#6366f1" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>    
            {/if}
        </div>

        <a class="text-sm text-indigo-400 hover:underline" target="_blank" rel="noreferrer" href="https://explorer.deso.org/?transaction-id={transactionId}">View on DeSo Explorer</a>

        <button on:click={back} class="mt-6 bg-gradient-to-r from-indigo-500 to-indigo-400 hover:shadow-[0_0_22px_-7px_rgba(1,4,232,0.8)] rounded-lg inline-flex items-center justify-center w-full text-white p-2 disabled:opacity-50">
            Close
        </button>
    </div>
   
{:else}
    <div class="text-center mt-3 mb-2.5">
        <img src={selectArrow} alt="back arrow" class="float-left h-2 absolute ml-5 mt-3 rotate-90 rounded-sm hover:cursor-pointer hover:bg-gray-100 hover:ring-8 hover:ring-gray-100" on:click={back}>
        <span class="font-bold text-lg">Order review</span>
    </div>
    <hr>

    <div class="text-center text-xs text-gray-400 pt-4 pb-2">
        {#if timerCount}
            Refreshing quote in {timerCount}s
        {:else}
            Refreshing...
        {/if}
    </div>

    <div class="p-5 pt-0">
    <TokenPreview token={sellToken} qty={sellQty} label="You sell" />
    <div class="h-3.5"></div>
    <TokenPreview token={buyToken} qty={buyQty} label="You buy" />   
    
    {#if isError}
        <div class="bg-red-200 p-3 text-sm rounded-md mt-3.5 text-red-700 leading-6">
            {#if errorType === ErrorType.NotEnoughCoins}
                You don't have enough {sellToken} to complete this order.
            {:else if errorType === ErrorType.MatchingOwnOrder}
                This order is matching your own order.
            {:else if errorType === ErrorType.NotEnoughDeso}    
                You don't have enough DeSo to cover the transaction fees.
            {:else if errorType === ErrorType.OverspendingDeso} 
                Error: RuleErrorDAOCoinLimitOrderOverspendingDESO
            {:else if errorType === ErrorType.OverspendingDeso} 
                Buying of this coin is restricted by the creator.
            {:else}
                Uknown error.
            {/if}
        </div>    
    {/if}

    <button on:click={sendMarketOrder} class="bg-gradient-to-r from-indigo-500 to-indigo-400 hover:shadow-[0_0_22px_-7px_rgba(1,4,232,0.8)] rounded-lg inline-flex items-center justify-center w-full text-white mt-4 p-2 disabled:opacity-50" disabled='{isError}'>
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

   
