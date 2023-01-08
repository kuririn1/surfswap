import desoLogo from '../img/DESO.png';

export let tokens = {
    'DESO' : 'DESO',
    'openfund' : 'BC1YLj3zNA7hRAqBVkvsTeqw7oi4H6ogKiAFL1VXhZy6pYeZcZ6TDRY', 
    'DeSoShopping' : 'BC1YLhF1JvLsBQoh5VYdkVvPzXX8y6SipfhMUhgkusvYnyr4iP33D1P', 
    'LIX' : 'BC1YLgcwvXPjeiYBVUDybtaw6GeYDmv6qurDts5DVoR1XG2v2WRvWdw',
    'OvercloutDESO' : 'BC1YLhZzLUK3bC59sguWuazQpaT4611cr12VXQig4rgiThRDT4Wiq8R',
    'AltumBase' : 'BC1YLfnsoQC1vCfPR9J5iXe3LVWeEU6UxFF1dgj6u2JFADrUqUsigY3',
    'setu_deso' : 'BC1YLh8VCfxnW64BKHpok5rH9vWRVh8ky9DZTi98x7eJGiGd8LMgqeM',
    'GatewayDAO' : 'BC1YLfyRWxtyiCdFCVjhLbEUvTtruFFfwmFMoVYcpVuGqi9Tk5VyJaF'
};

export let tradingPairs = [
    ['DESO', 'openfund'],
    ['DESO', 'DeSoShopping'],
    ['DESO', 'LIX'],
    ['DESO', 'OvercloutDESO'],
    ['DESO', 'AltumBase'],
    ['DESO', 'setu_deso'],
    ['DESO', 'GatewayDAO']
];

export const desoPublicKey = "BC1YLbnP7rndL92x7DbLp6bkUpCgKmgoHgz7xEbwhgHTps3ZrXA6LtQ";

export const oppositeTokens = (token) => {
    return tradingPairs.filter(pair => pair.includes(token)).map(pair => pair.filter(t => t !== token)[0]);
}

export const getTokenImage = (name, publicKey = '') => {
    if(name === 'DESO') {
        return desoLogo;
    } else {
        return 'https://node.deso.org/api/v0/get-single-profile-picture/' + (tokens[name] ?? publicKey);
    }
}

export const findNameBasedOnPK = (pk) => {
    const result = Object.keys(tokens).find(key => tokens[key] === pk);
    return result ? result : (pk === desoPublicKey ? 'DESO' : undefined);
}