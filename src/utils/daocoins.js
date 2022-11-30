import { orders, desoUsdPrice, desoApi } from '../Store.js';
import { get } from 'svelte/store';
import { LiqudityError } from './errors.js';

const deso = get(desoApi);

export const getDesoUsdPrice = async () => {
    const response = await deso.metaData.getExchangeRate();
    return response.USDCentsPerDeSoExchangeRate;
}

export const getLimitOrders = async (DAOCoin1, DAOCoin2) => {
    const request = {
        "DAOCoin1CreatorPublicKeyBase58Check": DAOCoin1,
        "DAOCoin2CreatorPublicKeyBase58Check": DAOCoin2
    };
    const response = await deso.dao.getDAOCoinLimitOrders(request);
    return response?.Orders;
};

export const tokenToUsdAmount = (amount, selectionName) => {
    let desoValue = amount;
    if(selectionName != "DESO") {
        desoValue = daoCoinToDeso('BID', amount);
    }
    const calcPrice = get(desoUsdPrice) * desoValue / 100;
    return calcPrice.toFixed(2);
}

export const usdToDesoAmount = (usdAmount) => {
    let desoValue = usdAmount * 100 / get(desoUsdPrice);
    return desoValue;
}

//side - top or down
//selectionName - token name for top or down
export const getPriceForTheSide = (side, selectionName, amount) => {
    if (side === 'top') {
        return selectionName === 'DESO' ? daoCoinToDeso('ASK', amount) : desoToDAOCoin('BID', amount);
    } else if (side === 'down') {
        return selectionName === 'DESO' ? daoCoinToDeso('BID', amount) : desoToDAOCoin('ASK', amount);
    }
}

export const usdToTokenAmount = (usdValue, selectionName) =>{
    const desoValue =  usdToDesoAmount(usdValue)
    let value = desoValue;

    if(selectionName !== 'DESO') {
        value = desoToDAOCoin('BID', desoValue);
    }

    return value;
}

export const desoToDAOCoin = (type, amount) => {

    let toFill = amount;

    let ordersSorted = [];
    if(type === 'ASK') {
        ordersSorted = get(orders).filter(order => order.OperationType === 'ASK').sort((a, b) => parseFloat(a.Price) - parseFloat(b.Price));
    } else if(type === 'BID') {
        ordersSorted = get(orders).filter(order => order.OperationType === 'BID').sort((a, b) => parseFloat(b.Price) - parseFloat(a.Price));
    }

    let num = 0; // or length askSorted! then not liquid
    while(toFill > 0 && num < ordersSorted.length) {
        const liqudityPerAsk = parseFloat(ordersSorted[num].Quantity) * parseFloat(ordersSorted[num].Price);
        toFill -= liqudityPerAsk;
        num++;
    }

    if(toFill > 0) {
        //console.log('not enough liquidity for this amount ', toFill);
        throw new LiqudityError(toFill);
        return 0;
    }
    
    let result = [];
    let filled = 0;
    let coinTotal = 0;
    //cal price per coin too, avg
    for(let i = 0; i < num; i++) {
        result.push(ordersSorted[i]);
        if(i === num - 1) {
            let partialFill = (amount-filled);
            coinTotal += partialFill / parseFloat(ordersSorted[i].Price);
        } else {
            filled += parseFloat(ordersSorted[i].Quantity)*parseFloat(ordersSorted[i].Price);
            coinTotal += parseFloat(ordersSorted[i].Quantity);
        }
    }

    return coinTotal;
};

export const daoCoinToDeso = (type, amount) => {

    let toFill = amount;

    let ordersSorted = [];
    if(type === 'BID') {
        ordersSorted = get(orders).filter(order => order.OperationType === 'BID').sort((a, b) => parseFloat(b.Price) - parseFloat(a.Price));
    } else if(type === 'ASK') {
        ordersSorted = get(orders).filter(order => order.OperationType === 'ASK').sort((a, b) => parseFloat(a.Price) - parseFloat(b.Price));
    }

    let num = 0; // or length askSorted! then not liquid
    //not liquid if no orders
    // and if not enough liquidity - 
    while(toFill > 0 && num < ordersSorted.length) {
        const liqudityPerBid = parseFloat(ordersSorted[num].Quantity);
        toFill -= liqudityPerBid;
        num++;
    }

    if(toFill > 0) {
        //console.log('no liquidity for this trade ', toFill);
        throw new LiqudityError(toFill);
        //throw custom error with toFill varible
            
        return 0;
    }
    
    let result = [];
    let filled = 0;
    let coinTotal = 0;
    //cal price per coin too, avg
    for(let i = 0; i < num; i++) {
        result.push(ordersSorted[i]);
        if(i === num - 1) {
            let partialFill = (amount-filled);
            coinTotal += partialFill * parseFloat(ordersSorted[i].Price);
        } else {
            filled += parseFloat(ordersSorted[i].Quantity);
            coinTotal += parseFloat(ordersSorted[i].Quantity) * parseFloat(ordersSorted[i].Price);
        }
    }

    return coinTotal;
};