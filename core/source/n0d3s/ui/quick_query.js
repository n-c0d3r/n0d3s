
module.use({

    Element : "./element"

})
.use_open_mode();



function $(query) {

    let result = document.querySelector(query);

    if(result == document.body && result.n0d3sEmbedded != true){

        Element('body');
        
    }

    if(result == document.title && result.n0d3sEmbedded != true){

        Element('title');
        
    }

    return result;
}

function $$(query) {

    return document.querySelectorAll(query);
}