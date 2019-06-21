const timeout = function ( ms ){
    return new Promise( resolve => setTimeout(resolve,ms));
}

module.exports = timeout