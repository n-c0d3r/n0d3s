
module.use({

})



function Style(content) {

    let result = document.createElement('style');

    result.textContent = content;

    document.body.appendChild(result);

    return result;
}



return Style;