
const fs = require("fs");
const path = require("path");
const uuid = require('uuid');
const fse = require('fs-extra');
var UglifyJS = require("uglify-js");

const { Queue } = require('@datastructures-js/queue');

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

        this.#modules = [];

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

            // if(!fs.existsSync(build_dir_path)) 
                // return false;
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

    search_for_corrected_path(from_file_path, to_file_path) {

        let corrected_file_path = path.resolve(
            path.dirname(from_file_path), 
            to_file_path
        );

        if(fs.existsSync(corrected_file_path)){

            if(fs.statSync(corrected_file_path).isDirectory())
                corrected_file_path += "/.js";
            else if(corrected_file_path.slice(corrected_file_path.length - 3, corrected_file_path.length) != '.js')
                corrected_file_path += '.js';

        }
        else if(corrected_file_path.slice(corrected_file_path.length - 3, corrected_file_path.length) != '.js')
            corrected_file_path += '.js';

        if(fs.existsSync(path.normalize(corrected_file_path))){

            return corrected_file_path;
        }



        corrected_file_path = path.resolve(
            this.command.source_dir, 
            to_file_path
        );

        if(fs.existsSync(corrected_file_path)){

            if(fs.statSync(corrected_file_path).isDirectory())
                corrected_file_path += "/.js";
            else if(corrected_file_path.slice(corrected_file_path.length - 3, corrected_file_path.length) != '.js')
                corrected_file_path += '.js';

        }
        else if(corrected_file_path.slice(corrected_file_path.length - 3, corrected_file_path.length) != '.js')
            corrected_file_path += '.js';

        if(fs.existsSync(path.normalize(corrected_file_path))){

            return corrected_file_path;
        }



        for(let additional_source_dir of this.command.additional_source_dirs){

            let corrected_file_path = path.resolve(
                additional_source_dir, 
                to_file_path
            );
    
            if(fs.existsSync(corrected_file_path)){

                if(fs.statSync(corrected_file_path).isDirectory())
                    corrected_file_path += "/.js";                    
                else if(corrected_file_path.slice(corrected_file_path.length - 3, corrected_file_path.length) != '.js')
                    corrected_file_path += '.js';
    
            }
            else if(corrected_file_path.slice(corrected_file_path.length - 3, corrected_file_path.length) != '.js')
                corrected_file_path += '.js';
    
            if(fs.existsSync(corrected_file_path)){
    
                return corrected_file_path;
            }

        }



        throw new Error(`${from_file_path}: module ${to_file_path} not found`);

        return null;
    }

    parse_use_path(from_file_path, to_path){

        let build_tool = this;

        function search_for_dir(from_file_path, to_dir_path){

            let corrected_file_path = path.resolve(
                path.dirname(from_file_path), 
                to_dir_path
            );
    
            if(fs.existsSync(corrected_file_path))
                return corrected_file_path;



            corrected_file_path = path.resolve(
                build_tool.command.source_dir, 
                to_dir_path
            );
    
            if(fs.existsSync(corrected_file_path))
                return corrected_file_path;
    
    
    
            for(let additional_source_dir of build_tool.command.additional_source_dirs){
    
                let corrected_file_path = path.resolve(
                    additional_source_dir, 
                    to_dir_path
                );
        
                if(fs.existsSync(corrected_file_path))
                    return corrected_file_path;
    
            }

        }

        let result = [];
        
        while(to_path[to_path.length - 1] == ' '){

            to_path = to_path.slice(0, to_path.length - 1);

        }

        if(to_path[to_path.length - 1] == '*' && to_path[to_path.length - 2] == '*'){

            let dir_path = search_for_dir(from_file_path, path.dirname(to_path));

            let items = fs.readdirSync(dir_path);

            for(let item of items){

                let item_path = `${dir_path}/${item}`;

                if(fs.statSync(item_path).isDirectory()){

                    if(fs.existsSync(item_path + '/.js'))
                        result.push(item_path);

                }
                else if(path.extname(item) == '.js')
                    result.push(item_path);

            }

        }
        else if(to_path[to_path.length - 1] == '*'){

            let dir_path = search_for_dir(from_file_path, path.dirname(to_path));

            let items = fs.readdirSync(dir_path);

            for(let item of items){

                let item_path = `${dir_path}/${item}`;

                if(fs.statSync(item_path).isFile() && path.extname(item) == '.js')
                    result.push(item_path);

            }

        }
        else{

            result.push(to_path);

        }

        return result;
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
            variable_to_dependencies: new Object(),
            is_page: false,
            open_mode: false,

            text_objects: new Object(),
            json_objects: new Object(), 

            import(file_path){

                let corrected_file_path = build_tool.search_for_corrected_path(this.src_file, file_path);

                if(path.resolve(corrected_file_path) == path.resolve(this.src_file))
                    return null;

                let module = build_tool.importSrc(corrected_file_path);

                if(module == null)
                    throw new Error(`import ${file_path} failed`);

                return module;
            },

            use(obj){

                if(obj == null) return this;

                if(Array.isArray(obj)){

                    for(let to_path of obj){

                        let parsed_paths = build_tool.parse_use_path(this.src_file, to_path);

                        if(parsed_paths.length == 1){

                            let module = this.import(parsed_paths[0]);

                            if(module != null)
                                this.dependency_data[module.id] = module;

                        }
                        else{

                            for(let parsed_path of parsed_paths){

                                let module = this.import(parsed_path);
        
                                if(module != null)
                                    this.dependency_data[module.id] = module;

                            }

                        }

                    }

                }
                else{

                    for(let key in obj){
    
                        let parsed_paths = build_tool.parse_use_path(this.src_file, obj[key]);
    
                        this.variable_to_dependencies[key] = [];
    
                        if(parsed_paths.length == 1){
    
                            let module = this.import(parsed_paths[0]);
    
                            if(module != null) {

                                this.dependency_data[module.id] = module;
    
                                this.variable_to_dependencies[key].push(module);

                            }
    
                        }
                        else{
    
                            for(let parsed_path of parsed_paths){
    
                                let module = this.import(parsed_path);
        
                                if(module != null) {

                                    this.dependency_data[module.id] = module;
        
                                    this.variable_to_dependencies[key].push(module);

                                }
    
                            }
    
                        }
    
                    }

                }

                return this;             
            },

            text(obj){

                if(build_tool.command.resource_dirs.length == 0)
                    throw new Error(`cant import text because there is no resource directory`);

                if(obj == null) return this;

                for(let data_name in obj){

                    for(let resource_dir_path of build_tool.command.resource_dirs){

                        let file_path = path.resolve(resource_dir_path, obj[data_name]);

                        if(path.extname(file_path) != ".txt")
                            file_path += ".txt";

                        if(fs.existsSync(file_path)){

                            let data = fs.readFileSync(file_path).toString();

                            this.text_objects[data_name] = data;

                            break;

                        }
    
                    }

                    if (!(data_name in this.text_objects))
                        throw new Error(`import ${data_name} failed`);

                }

                return this;
            },

            json(obj){

                if(build_tool.command.resource_dirs.length == 0)
                    throw new Error(`cant import json because there is no resource directory`);

                if(obj == null) return this;

                for(let data_name in obj){

                    for(let resource_dir_path of build_tool.command.resource_dirs){

                        let file_path = path.resolve(resource_dir_path, obj[data_name]);

                        if(path.extname(file_path) != ".json")
                            file_path += ".json";

                        if(fs.existsSync(file_path)){

                            let data = JSON.parse(fs.readFileSync(file_path).toString());

                            this.json_objects[data_name] = data;

                            break;

                        }
    
                    }

                    if (!(data_name in this.json_objects))
                        throw new Error(`import ${data_name} failed`);

                }                

                return this;
            },

            register_page(preInnerHTML = "", postInnerHTML = ""){

                this.is_page = true;

                this.preInnerHTML = preInnerHTML;
                this.postInnerHTML = postInnerHTML;

                return this;     
            },

            use_open_mode(){

                this.open_mode = true;

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

    sortedDependencies(module) {

        function traverse(module, pushedModuleIds = new Object()) {
    
            let sortedModules = [];
    
            for(let key in module.dependency_data){
    
                let dependency_module = module.dependency_data[key];
    
                if(dependency_module.id in pushedModuleIds)
                    continue;
    
                pushedModuleIds[dependency_module.id] = dependency_module.id;
    
                sortedModules = sortedModules.concat(
                    traverse(dependency_module, pushedModuleIds)
                );
    
            }
    
            sortedModules.push(module);
    
            return sortedModules;
        }

        let sortedModules = traverse(module);

        sortedModules = sortedModules.slice(0, sortedModules.length - 1);

        return sortedModules;
    }

    buildSortedModuleList() {

        this.#modules = this.sortedDependencies(this.index_module);

        this.#modules.push(this.index_module);

    }

    buildClSrcContent() {

        for(let module of this.#modules){

            module.cl_src_content = this.src_parser.parse_run_state_src_content(module);

        }

    }

    saveScripts(){

        let scriptOutputDir = this.command.build_dir + '/scripts';

        if(!fs.existsSync(scriptOutputDir))
            fs.mkdirSync(scriptOutputDir);

        for(let module of this.modules){

            let outputPath = `${scriptOutputDir}/${module.id}`;

            let js_content = module.cl_src_content;

            if(this.command.js_encode)
                js_content = UglifyJS.minify(js_content).code;

            fs.writeFileSync(outputPath, js_content);

        }

    }

    savePages(){

        let pageOutputDir = this.command.build_dir + '/pages';

        let scriptOutputDir = this.command.build_dir + '/scripts';

        let clientLibDir = this.command.build_dir + '/client_lib/source';

        if(!fs.existsSync(pageOutputDir))
            fs.mkdirSync(pageOutputDir);

        for(let module of this.modules){

            if(!module.is_page)
                continue;

            let relative_path = path.normalize(path.relative(this.command.source_dir, module.src_file));

            relative_path = relative_path.slice(0, relative_path.length - 2) + 'html';

            let outputPath = `${pageOutputDir}/${relative_path}`;
            let scriptOutputPath = `${scriptOutputDir}/${module.id}`;

            

            let modules = this.sortedDependencies(module);

            modules.push(module);



            let htmlModuleContent = ``;

            if(!this.command.js_embedded_build) {

                for(let m of modules){

                    htmlModuleContent += `<script src="${path.relative(path.dirname(outputPath), `${scriptOutputDir}/${m.id}`)}"></script>`;

                }

            }



            let jsEmbeddedContent = ``;

            if(this.command.js_embedded_build) {

                for(let m of modules){

                    let file_path = `${scriptOutputDir}/${m.id}`;

                    jsEmbeddedContent += fs.readFileSync(file_path);

                }

                if(this.command.js_encode)
                    jsEmbeddedContent = `<script>${UglifyJS.minify(jsEmbeddedContent).code}</script>`;
                else
                    jsEmbeddedContent = `<script>${jsEmbeddedContent}</script>`;

            }

            

            let htmlContent = `
            
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta http-equiv='cache-control' content='no-cache'> 
                    <meta http-equiv='expires' content='0'> 
                    <meta http-equiv='pragma' content='no-cache'>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <!--<script src="${path.relative(path.dirname(outputPath), clientLibDir)}/n0d3s.js"></script>-->
                    <title></title>
                </head>
                <body>
                    ${module.preInnerHTML || ""}

                    ${this.command.js_embedded_build ? jsEmbeddedContent : htmlModuleContent}

                    ${module.postInnerHTML || ""}
                </body>
                </html>
            
            `;

            if(!fs.existsSync(path.dirname(outputPath)))
                fs.mkdirSync(path.dirname(outputPath), {recursive: true});

            fs.writeFileSync(outputPath, htmlContent);

        }

    }

    build(){

        console.log("Start build project");

        if(!this.earlyCheckForBuilding()) {

            throw new Error("Early check for building failed!");

            return false;
        }

        this.#index_module = this.importSrc(this.command.src_index_file);

        this.buildSortedModuleList();
        this.buildClSrcContent();

        this.saveScripts();
        this.savePages();

        if(this.command.js_embedded_build)
            fs.rmSync(this.command.build_dir + '/scripts', { recursive: true, force: true });

        console.log("Build project done");
        
    }

}



BuildTool.Command = Command;
BuildTool.Context = Context;
BuildTool.PageStorage = PageStorage;
BuildTool.Page = Page;



module.exports = BuildTool;