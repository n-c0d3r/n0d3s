
const PageStorage = require('./page_storage');



class Context {

    #options;
    get options(){

        return this.#options;
    }

    #build_tool;
    get build_tool(){

        return this.#build_tool;
    }

    page_storage;



    constructor(options){

        this.setupOptions(options);



        this.page_storage = new PageStorage({

            context : this,

        });

    }

    setupOptions(options){

        this.#options = options || new Object();    

        this.#build_tool = this.#options.build_tool;

    }

}



module.exports = Context;