
module.use({

});



function Element(tag) {

    let result;

    if(tag == "body"){

        result = document.body;

    }
    else {
        

        result = document.createElement(tag);

    }

    result.n0d3sEmbedded = true;

    result.setClass = function(name){

        result.classList.add(...name.split(' '));

        return result;
    }

    result.setId = function(id){

        result.id = id;

        return result;
    }

    result.setHRef = function(url){

        result.setAttribute("href", url);

        return result;
    }

    result.setStyle = function(styleConfig){

        for(let configName in styleConfig){

            result.style[configName] = styleConfig[configName];

        } 

        return result;
    };

    result.on = function(name, callback){

        result.addEventListener(name, callback);

        return result;
    };

    result.exe = function(callback){

        callback.bind(result)();

        return result;
    };

    const defaultSetAttribute = HTMLElement.prototype.setAttribute;
    result.setAttribute = function(name, value){

        defaultSetAttribute.bind(result)(name, value);

        return result;
    }

    result.appendInner = function(...childs){

        return result.appendInnerArray(childs);
    }

    result.appendInnerArray = function(childsArray){
        
        for(let childName in childsArray){

            let child = childsArray[childName];

            try {

                result.appendChild(child);

            }
            catch
            {

                try{

                    result.innerHTML += child;

                }
                catch{



                }

            }

        }

        return result;
    }

    result.setInner = function(...childs){

        return result.setInnerArray(childs);
    }

    result.setInnerArray = function(childsArray){

        result.innerHTML = "";
        
        for(let childName in childsArray){

            let child = childsArray[childName];

            try {

                result.appendChild(child);

            }
            catch
            {

                try{

                    result.innerHTML += child;

                }
                catch{



                }

            }

        }

        return result;
    }

    return result;
}



return Element;