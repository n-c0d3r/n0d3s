
const fs = require("fs");
const path = require("path");
const uuid = require('uuid');

const file_path_to_id = require('./file_path_to_id');

const Command = require("./command");
const Context = require("./context");
const PageStorage = require("./page_storage");
const SrcParser = require("./src_parser");
const Page = require("./page");



class BuildTool {

    #options;
    get options(){

        return this.#options;
    }

    #cli_argv;
    get cli_argv(){

        return this.#cli_argv;
    }

    #command;
    get command() {
        
        return this.#command;
    }

    #context;
    get context() {
        
        return this.#context;
    }

    #src_parser;
    get src_parser() {
        
        return this.#src_parser;
    }

    #index_module;
    get index_module() {
        
        return this.#index_module;
    }

    #modules;
    get modules() {
        
        return this.#modules;
    }



    constructor(options){

        this.setupOptions(options);

        

        this.#command = new Command({

            build_tool : this,

            cli_argv : this.cli_argv,
            
        });

        this.#context = new Context({

            build_tool : this,

        });

        this.#src_parser = new SrcParser({

            build_tool : this,

        });

        this.#modules = new Object();

    }

    setupOptions(options){

        this.#options = options || new Object();    

        this.#cli_argv = this.#options.cli_argv || [];

    }



    earlyCheckForBuilding(){

        try {

            let build_dir_path = "";
            let src_dir_path = "";

            if(Command.BUILD_DIR_KEY in this.command.data)
                build_dir_path = this.command.build_dir;
            else return false;

            if(Command.SOURCE_DIR_KEY in this.command.data)
                src_dir_path = this.command.source_dir;
            else return false;

            if(!fs.existsSync(build_dir_path)) 
                return false;
            if(!fs.existsSync(src_dir_path)) 
                return false;
            if(!fs.existsSync(this.command.src_index_file)) 
                return false;

        }
        catch {

            return false;
        }

        return true;
    }

    importSrc(src_file){

        var build_tool = this;

        let fileContent = fs.readFileSync(src_file).toString();

        let func = new Function(this.src_parser.parse_build_state_src_content(fileContent));

        func = func.bind({

            src_file: src_file,
            src_dir: path.dirname(src_file),
            src_content: fileContent,
            build_tool: build_tool, 
            context: build_tool.context, 
            id: file_path_to_id(src_file),

            ...BuildTool,

            dependency_data: new Object(),
            is_page: false,

            import(file_path){

                let corrected_file_path = path.resolve(
                    path.dirname(this.src_file), 
                    file_path
                );

                if(corrected_file_path.slice(corrected_file_path.length - 3, corrected_file_path.length) != '.js')
                    corrected_file_path += '.js';

                return build_tool.importSrc(corrected_file_path);
            },

            dependencies(obj){

                this.dependency_data = obj;

                for(let key in obj){

                    this.dependency_data[key] = this.import(obj[key]);

                }

                return this;             
            },

            register_page(){

                this.is_page = true;

                return this;     
            },

            require(file_path, globa_mode = true){

                if(globa_mode)
                    return require(file_path);



                let corrected_file_path = path.resolve(
                    path.dirname(this.src_file), 
                    file_path
                );

                if(corrected_file_path.slice(corrected_file_path.length - 3, corrected_file_path.length) != '.js')
                    corrected_file_path += '.js';

                return require(file_path);
            },

        });

        return func(true);
    }

    buildClSrcContent(module) {

        if(module.id in this.#modules)
            return;

        this.#modules[module.id] = module;

        module.cl_src_content = this.src_parser.parse_run_state_src_content(module);

        for(let key in module.dependency_data){

            this.buildClSrcContent(module.dependency_data[key]);

        }

    }

    saveScripts(){

        let scriptOutputDir = this.command.build_dir + '/scripts';

        for(let key in this.modules){

            let module = this.modules[key];

            let outputPath = `${scriptOutputDir}/${module.id}`;

            fs.writeFileSync(outputPath, module.cl_src_content);

        }

    }

    build(){

        if(!this.earlyCheckForBuilding()) {

            throw new Error("Early check for building failed!");

            return false;
        }



        this.#index_module = this.importSrc(this.command.src_index_file);

        this.buildClSrcContent(this.index_module);

        this.saveScripts();
        
    }

}



BuildTool.Command = Command;
BuildTool.Context = Context;
BuildTool.PageStorage = PageStorage;
BuildTool.Page = Page;



module.exports = BuildTool;