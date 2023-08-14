
class Command {

    static SOURCE_DIR_KEY = "s";
    static BUILD_DIR_KEY = "b";
    static SRC_INDEX_FILE_NAME_KEY = "sin";
    static ADDITIONAL_SRC_DIRS_KEY = "as";
    static JS_EMBEDDED_BUILD = "jsem";
    static JS_ENCODE = "jsen";
    static RESOURCE_DIRS_KEY = "res";



    #options;
    get options(){

        return this.#options;
    }

    #build_tool;
    get build_tool(){

        return this.#build_tool;
    }

    #cli_argv;
    get cli_argv(){

        return this.#cli_argv;
    }

    #data;
    get data(){

        return this.#data;
    }



    get source_dir(){

        return this.str(Command.SOURCE_DIR_KEY);
    }
    get build_dir(){

        return this.str(Command.BUILD_DIR_KEY);
    }
    get src_index_file_name(){

        if(Command.SRC_INDEX_FILE_NAME_KEY in this.data)
            return this.str(Command.SRC_INDEX_FILE_NAME_KEY);

        else return "index.js";
    }
    get src_index_file(){

        return `${this.source_dir}/${this.src_index_file_name}`;
    }
    get additional_source_dirs(){

        let default_value = [
            __dirname + "/../../core/source" 
        ];

        if(Command.ADDITIONAL_SRC_DIRS_KEY in this.data)
            return default_value.concat(this.array(Command.ADDITIONAL_SRC_DIRS_KEY));
        else return default_value;
    }
    get js_embedded_build(){

        if(Command.JS_EMBEDDED_BUILD in this.data)
            return this.boolean(Command.JS_EMBEDDED_BUILD);
        else return true;
    }
    get js_encode(){

        if(Command.JS_ENCODE in this.data)
            return this.boolean(Command.JS_ENCODE);
        else return true;
    }
    get resource_dirs(){

        if(Command.RESOURCE_DIRS_KEY in this.data)
            return this.array(Command.RESOURCE_DIRS_KEY);
        else return [];
    }



    constructor(options){

        this.setupOptions(options);



        this.#data = new Object();

        this.#parse();

    }

    setupOptions(options){

        this.#options = options || new Object();   

        this.#build_tool = this.#options.build_tool;

        this.#cli_argv = this.#options.cli_argv || []; 

    }



    #parse(){

        for(let i = 0; i < this.#cli_argv.length; ) {

            if(this.cli_argv[i].length != 0){

                if(this.cli_argv[i][0] == '-'){

                    let argName = this.cli_argv[i].slice(1, this.cli_argv.length);

                    let value = [];

                    for(i += 1; i < this.cli_argv.length; ++i){

                        if(this.cli_argv[i].length != 0){

                            if(this.cli_argv[i][0] == '-'){

                                break;

                            }

                        }
                        
                        value.push(this.cli_argv[i]);

                    }

                    this.#data[argName] = value;

                    continue;

                }

            }

            ++i;

        }

    }



    array(name, DataType = null ) {

        if(DataType == null)
            return this.#data[name];

        let parsed_data = [];

        for(let data of this.#data[name])
            parsed_data.push(DataType(data));

        return parsed_data;
    }
    numberArray(name){

        return this.array(name, Number);
    }
    boolArray(name){

        return this.array(name, data => (data === 'true'));
    }
    str(name, connector = ' ') {

        return this.array(name).join(connector);
    }
    number(name){

        return Number(this.str(name));
    }
    boolean(name){

        return (this.str(name) === 'true');
    }

}



module.exports = Command;