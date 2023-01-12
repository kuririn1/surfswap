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
    if(Number(num) < 0.01) {
        num = 0.00;
    }
    return cleanInput(num).replace(/(\..{2}).*/g, '$1');
}

export const stripExtraChars = (num) => {
    return num?.toString()?.replace(/ /g, '')?.replace('~$', '');
}

export const cleanInput = (num) => {
    if(num === '.') return '0.';
    if(typeof num !== 'string') {
        num = num?.toString() || '';
    }    
    //allow only numbers 
    return num?.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1').replace(/^0+(?!\.|$)/, '');
}

export const addSpacesToNumber = (num) => {
    var parts = num.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return parts.join(".");
}


export const formatTokenInput = (num) => {
	let result = num.toLocaleString('en-US', {maximumFractionDigits: 6});
  return result?.replace(/,/g, ' ').replace(/\$/g, '~$');
}