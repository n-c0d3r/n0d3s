
module.use({

    Element : "./element"

})
.use_open_mode();



function $(query) {

    let result = document.querySelector(query);

    if(result == document.body && result.n0d3sEmbedded != true){

        Element('body');
        
    }

    return result;
}

function $$(query) {

    return document.querySelectorAll(query);
}