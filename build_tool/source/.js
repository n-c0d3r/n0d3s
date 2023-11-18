
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

    #imported_modules;
    get imported_modules() {
        
        return this.#imported_modules;
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

        this.#imported_modules = new Object();

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

    search_for_corrected_path(from_dir_path, caller_file_path, to_file_path, file_extension, additional_dirs, entry_prefix = "") {

        let corrected_file_path = path.resolve(
            from_dir_path, 
            to_file_path
        );

        if(fs.existsSync(corrected_file_path)){

            if(fs.statSync(corrected_file_path).isDirectory())
                corrected_file_path += `/${entry_prefix}.${file_extension}`;
            else if(corrected_file_path.slice(corrected_file_path.length - (file_extension.length + 1), corrected_file_path.length) != `.${file_extension}`)
                corrected_file_path += `.${file_extension}`;

        }
        else if(corrected_file_path.slice(corrected_file_path.length - (file_extension.length + 1), corrected_file_path.length) != `.${file_extension}`)
            corrected_file_path += `.${file_extension}`;

        if(fs.existsSync(path.normalize(corrected_file_path))){

            return corrected_file_path;
        }



        corrected_file_path = path.resolve(
            this.command.source_dir, 
            to_file_path
        );

        if(fs.existsSync(corrected_file_path)){

            if(fs.statSync(corrected_file_path).isDirectory())
                corrected_file_path += `/${entry_prefix}.${file_extension}`;
            else if(corrected_file_path.slice(corrected_file_path.length - (file_extension.length + 1), corrected_file_path.length) != `.${file_extension}`)
                corrected_file_path += `.${file_extension}`;

        }
        else if(corrected_file_path.slice(corrected_file_path.length - (file_extension.length + 1), corrected_file_path.length) != `.${file_extension}`)
            corrected_file_path += `.${file_extension}`;

        if(fs.existsSync(path.normalize(corrected_file_path))){

            return corrected_file_path;
        }



        for(let additional_source_dir of additional_dirs){

            let corrected_file_path = path.resolve(
                additional_source_dir, 
                to_file_path
            );
    
            if(fs.existsSync(corrected_file_path)){

                if(fs.statSync(corrected_file_path).isDirectory())
                    corrected_file_path += `/${entry_prefix}.${file_extension}`;                    
                else if(corrected_file_path.slice(corrected_file_path.length - (file_extension.length + 1), corrected_file_path.length) != `.${file_extension}`)
                    corrected_file_path += `.${file_extension}`;
    
            }
            else if(corrected_file_path.slice(corrected_file_path.length - (file_extension.length + 1), corrected_file_path.length) != `.${file_extension}`)
                corrected_file_path += `.${file_extension}`;
    
            if(fs.existsSync(corrected_file_path)){
    
                return corrected_file_path;
            }

        }



        return null;
    }

    parse_path_query(from_dir_path, caller_file_path, path_query, file_extension, additional_dirs, entry_prefix = ""){

        let build_tool = this;

        function search_for_dir(from_dir_path, to_dir_path){

            let corrected_file_path = path.resolve(
                from_dir_path, 
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
    
    
    
            for(let additional_source_dir of additional_dirs){
    
                let corrected_file_path = path.resolve(
                    additional_source_dir, 
                    to_dir_path
                );
        
                if(fs.existsSync(corrected_file_path))
                    return corrected_file_path;
    
            }

        }

        let result = [];
        result.is_multiple = false;
        
        while(path_query[path_query.length - 1] == ' '){

            path_query = path_query.slice(0, path_query.length - 1);

        }

        if(path_query[path_query.length - 1] == '*' && path_query[path_query.length - 2] == '*'){

            let dir_path = search_for_dir(from_dir_path, path.dirname(path_query));

            let items = fs.readdirSync(dir_path);

            for(let item of items){

                let item_path = `${dir_path}/${item}`;

                if(fs.statSync(item_path).isDirectory()){

                    if(fs.existsSync(item_path + `/${entry_prefix}.${file_extension}`))
                        result.push(item_path);

                }
                else if(path.extname(item) == `.${file_extension}`)
                    result.push(item_path);

            }

            result.is_multiple = true;

        }
        else if(path_query[path_query.length - 1] == '*'){

            let dir_path = search_for_dir(from_dir_path, path.dirname(path_query));

            let items = fs.readdirSync(dir_path);

            for(let item of items){

                let item_path = `${dir_path}/${item}`;

                if(fs.statSync(item_path).isFile() && path.extname(item) == `.${file_extension}`)
                    result.push(item_path);

            }

            result.is_multiple = true;

        }
        else{

            result.push(path_query);

        }


        
        let corrected_result = [];
        corrected_result.is_multiple = result.is_multiple;

        for(let parsed_path of result){

            let corrected_path = build_tool.search_for_corrected_path(from_dir_path, caller_file_path, parsed_path, file_extension, additional_dirs, entry_prefix);

            if(corrected_path == null)
                continue;

            if(caller_file_path == null)
                corrected_result.push(corrected_path);
            else if(path.resolve(corrected_path) != path.resolve(caller_file_path))
                corrected_result.push(corrected_path);

        }

        return corrected_result;
    }

    import_module(src_file){

        let resolved_file = path.resolve(src_file);

        if(resolved_file in this.#imported_modules) {

            return this.#imported_modules[resolved_file];
        }

        let src_content = fs.readFileSync(src_file).toString();

        let module = this.create_module(src_content, path.dirname(src_file), src_file);

        this.#imported_modules[resolved_file] = module;

        return module;
    }
    create_module(src_content, src_dir, src_file, is_virtual = false){

        var build_tool = this;

        let parsed_src_content = this.src_parser.parse_build_state_src_content(src_content);

        let func = new Function(parsed_src_content);

        func = func.bind({

            parsed_src_content: parsed_src_content,

            src_file: src_file,
            non_virtual_src_file(){

                if (is_virtual)
                    return null;

                return this.src_file;
            },

            src_dir: src_dir,
            src_content: src_content,
            build_tool: build_tool, 
            context: build_tool.context, 
            id: uuid.v4().replaceAll("-", "_"),

            is_virtual: is_virtual,

            ...BuildTool,

            dependent_modules: new Object(),
            variable_to_dependencies: new Object(),
            is_page: false,
            open_mode: false,

            text_objects: new Object(),
            json_objects: new Object(), 
            data_objects: new Object(), 

            external_js_array: [],
            external_js_module_array: [],

            is_auto_return: false,
            auto_return_object: null,

            build_tool: build_tool,

            import(file_path){

                let module = build_tool.import_module(file_path);

                if(module == null)
                    throw new Error(`${this.src_dir} :: ${this.non_virtual_src_file() || this.id} -> import(): import ${file_path} failed`);

                return module;
            },

            encode_js_str(value){

                return `"${encodeURIComponent(value)}"`;
            },
            decode_js_str(value){

                return decodeURIComponent(value);
            },

            add_dependency(module) {

                this.dependent_modules[module.id] = module;
                
                return this;
            },

            create_virtual_module(file_content, options = new Object()){

                let new_virtual_module = build_tool.create_module(
                    file_content, 
                    options.src_dir || this.src_dir, 
                    options.virtual_src_file, 
                    true
                );

                if(options.auto_add_dependency || true)
                    this.add_dependency(new_virtual_module);
        
                return new_virtual_module;
            },

            use_all(options) {

                this.use(
                    [

                        "./**",

                    ],
                    options
                );

                return this;
            },

            use_and_get(path_query, options = new Object()) {

                let use_id = "use_" + uuid.v4().replaceAll('-', '_');

                var obj = new Object();
                obj[use_id] = path_query;

                this.use(
                    obj,
                    options
                );

                return this.variable_to_dependencies[use_id];
            },

            use(obj, options = new Object()){

                if(obj == null) return this;

                if(Array.isArray(obj)){

                    for(let path_query of obj){

                        let parsed_paths = build_tool.parse_path_query(
                            this.src_dir, this.non_virtual_src_file(), path_query, 
                            'js', 
                            build_tool.command.additional_source_dirs,
                            options.entry_prefix || ""
                        );

                        if(parsed_paths.length == 0)
                            throw new Error(`${this.src_dir} :: ${this.non_virtual_src_file() || this.id} -> use(): import ${path_query} failed`);

                        if(!parsed_paths.is_multiple){

                            let module = this.import(parsed_paths[0]);

                            if(module != null)
                                this.dependent_modules[module.id] = module;

                        }
                        else{

                            for(let parsed_path of parsed_paths){

                                let module = this.import(parsed_path);
        
                                if(module != null)
                                    this.dependent_modules[module.id] = module;

                            }

                        }

                    }

                }
                else{

                    for(let key in obj){
    
                        let parsed_paths = build_tool.parse_path_query(
                            this.src_dir, this.non_virtual_src_file(), obj[key], 
                            'js', 
                            build_tool.command.additional_source_dirs,
                            options.entry_prefix || ""
                        );

                        if(parsed_paths.length == 0)
                            throw new Error(`${this.src_dir} :: ${this.non_virtual_src_file() || this.id} -> use(): import ${key} from ${object[key]} failed`);
    
                        this.variable_to_dependencies[key] = [];
                        this.variable_to_dependencies[key].is_multiple = parsed_paths.is_multiple;
    
                        if(!parsed_paths.is_multiple){
    
                            let module = this.import(parsed_paths[0]);
    
                            if(module != null) {

                                this.dependent_modules[module.id] = module;
    
                                this.variable_to_dependencies[key].push(module);

                            }
    
                        }
                        else{
    
                            for(let parsed_path of parsed_paths){
    
                                let module = this.import(parsed_path);
        
                                if(module != null) {

                                    this.dependent_modules[module.id] = module;
        
                                    this.variable_to_dependencies[key].push(module);

                                }
    
                            }
    
                        }
    
                    }

                }

                return this;             
            },

            text(obj, options = new Object()){

                if(build_tool.command.resource_dirs.length == 0)
                    throw new Error(`cant import text because there is no resource directory`);

                if(obj == null) return this;

                for(let key in obj){
    
                    let parsed_paths = build_tool.parse_path_query(
                        this.src_dir, this.non_virtual_src_file(), obj[key], 
                        'txt', 
                        build_tool.command.resource_dirs,
                        options.entry_prefix || ""
                    );

                    if(parsed_paths.length == 0)
                        throw new Error(`${this.src_dir} :: ${this.non_virtual_src_file() || this.id} -> text(): from ${obj[key]} failed`);

                    if(!parsed_paths.is_multiple){

                        let data = fs.readFileSync(parsed_paths[0]).toString();

                        this.text_objects[key] = data;

                    }
                    else{

                        this.text_objects[key] = [];

                        for(let parsed_path of parsed_paths){

                            let data = fs.readFileSync(parsed_path).toString();
    
                            this.text_objects[key].push(data);

                        }

                    }

                }

                return this;
            },

            add_data(name, value){

                this.data_objects[name] = value;

                return this;
            },
            remove_data(name) {

                delete this.data_objects[name];

                return this;
            },
            is_has_data(name) {

                return name in this.data_objects;
            },

            json(obj, options = new Object()){

                if(build_tool.command.resource_dirs.length == 0)
                    throw new Error(`cant import json because there is no resource directory`);

                if(obj == null) return this;

                for(let key in obj){
    
                    let parsed_paths = build_tool.parse_path_query(
                        this.src_dir, this.non_virtual_src_file(), obj[key], 
                        'json', 
                        build_tool.command.resource_dirs, 
                        options.entry_prefix || ""
                    );

                    if(parsed_paths.length == 0)
                        throw new Error(`${this.src_dir} :: ${this.non_virtual_src_file() || this.id} -> json(): import ${key} from ${obj[key]} failed`);

                    if(!parsed_paths.is_multiple){

                        let data = JSON.parse(fs.readFileSync(parsed_paths[0]).toString());

                        this.json_objects[key] = data;

                    }
                    else{

                        this.json_objects[key] = [];

                        for(let parsed_path of parsed_paths){

                            let data = JSON.parse(fs.readFileSync(parsed_path).toString());

                            this.json_objects[key],push(data);

                        }

                    }

                }              

                return this;
            },

            exe(callback){

                callback();

                return this;
            },

            exe_js(path, options = new Object()){

                let parsed_paths = build_tool.parse_path_query(
                    this.src_dir, this.non_virtual_src_file(), path, 
                    'js', 
                    build_tool.command.additional_source_dirs, 
                    options.entry_prefix || ""
                );

                if(parsed_paths.length == 0)
                    throw new Error(`${this.src_dir} :: ${this.non_virtual_src_file() || this.id} -> exe_js(): import ${key} from ${obj[key]} failed`);

                for(let parsed_path of parsed_paths){

                    let file_content = `var module = this; fs.readFileSync(parsed_path).toString()`;

                    let func = new Function(file_content);

                    func.bind(this);

                    func();

                }
                
                return this;
            },

            external_js(arr) {

                if(!Array.isArray(arr))
                    throw new Error(`${this.src_dir} :: ${this.non_virtual_src_file() || this.id} -> external_js(): ${arr} is not an array`);

                this.external_js_array = external_js_array.concat(arr);

                return this;
            },

            external_js_module(arr) {

                if(!Array.isArray(arr))
                    throw new Error(`${this.src_dir} :: ${this.non_virtual_src_file() || this.id} -> external_js_module(): ${arr} is not an array`);

                this.external_js_module_array = external_js_module_array.concat(arr);

                return this;
            },

            path_query(path_query, options = new Object()){

                options.file_extension = options.file_extension || "js";
                options.additional_dirs = options.additional_dirs || build_tool.command.additional_source_dirs;
                options.entry_prefix = options.entry_prefix || "";

                return build_tool.parse_path_query(
                    this.src_dir,
                    this.non_virtual_src_file(),
                    path_query,
                    options.file_extension,
                    options.additional_dirs,
                    options.entry_prefix
                );
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
                    this.src_dir, 
                    file_path
                );

                if(corrected_file_path.slice(corrected_file_path.length - 3, corrected_file_path.length) != '.js')
                    corrected_file_path += '.js';

                return require(file_path);
            },

            relative_script_build_path(){

                return `scripts/${this.id}.js`;
            },            
            relative_page_build_path(){

                let parsed_html_file = null;
                
                if(this.src_file != null)
                    parsed_html_file = this.src_file.slice(0, this.src_file.length - 3) + ".html";

                return "pages/" + path.normalize(path.relative(build_tool.command.source_dir, parsed_html_file || (this.src_dir + '/' + this.id + ".html")));
            },

            script_build_path(){

                return build_tool.command.build_dir + "/" + this.relative_script_build_path();
            },            
            page_build_path(){

                return build_tool.command.build_dir + "/" + this.relative_page_build_path();
            },

            auto_return(obj){

                this.auto_return_object = obj;
                this.is_auto_return = true;

                return this;
            }

        });

        return func(true);
    }

    sortedDependencies(module) {

        function traverse(module, pushedModuleIds = new Object()) {
    
            let sortedModules = [];
    
            for(let key in module.dependent_modules){
    
                let dependency_module = module.dependent_modules[key];
    
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

        fse.emptyDirSync(scriptOutputDir);

        for(let module of this.modules){

            let outputPath = module.script_build_path();

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

        fse.emptyDirSync(pageOutputDir);

        for(let module of this.modules){

            if(!module.is_page)
                continue;

            

            let outputPath = module.page_build_path();

            

            let modules = this.sortedDependencies(module);

            modules.push(module);



            let htmlModuleContent = ``;

            if(!this.command.js_embedded_build) {

                for(let m of modules){

                    htmlModuleContent += `<script src="${path.relative(path.dirname(outputPath), m.script_build_path())}"></script>`;

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



            let externalJSContent = '';
            for(let m of modules){

                for(let external_js of m.external_js_array){

                    externalJSContent += `<script src="${external_js}"></script>`;

                }

            }

            let externalJSModuleContent = '';
            for(let m of modules){

                for(let external_js of m.external_js_module_array){

                    externalJSContent += `<script type="module" src="${external_js}"></script>`;

                }

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

                    ${externalJSContent}
                    ${externalJSModuleContent}

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

        this.#index_module = this.import_module(this.command.src_index_file);

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