export const roundTo6or4Decimals = (num) => {
    if (num.toString().split(".")[0].length < 3) {
        return roundToDecimal(num, 6);
    } else {
        return roundToDecimal(num, 4);
    }
};

export const roundToDecimal = (num, decimal) => {
    return Math.round(num * Math.pow(10, decimal)) / Math.pow(10, decimal);
};

export const cleanDollarInput = (num) => {
    //allow only 2 decimal places for USD
    return cleanInput(num).replace(/(\..{2}).*/g, '$1');
}

export const addSpacesToNumberOld = (num) => {
    //add spaces for thousands but not for decimals after dot
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

}

export const stripExtraChars = (num) => {
    return num?.toString()?.replace(/ /g, '')?.replace('~$', '');
}

export const cleanInput = (num) => {
    //allow only numbers 
    return num?.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1').replace(/^0+(?!\.|$)/, '');
}

/*
export const addSpacesToNumber3 = (num) => {
	let result = parseFloat(num).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  return result?.replace(/,/g, ' ').replace(/\$/g, '~$');
}
*/

export const addSpacesToNumber = (num) => {
    var parts = num.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return parts.join(".");
}


export const formatTokenInput = (num) => {
	let result = num.toLocaleString('en-US', {maximumFractionDigits: 6});
  return result?.replace(/,/g, ' ').replace(/\$/g, '~$');
}