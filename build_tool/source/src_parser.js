
class SrcParser {

    #options;
    get options(){

        return this.#options;
    }



    constructor(options){

        this.setupOptions(options);

    }

    setupOptions(options){

        this.#options = options || new Object();    

    }



    parse_build_state_src_content(js_content){

        let c = js_content;

        let i = 0;
        while(c[i] == '\n' || c[i] == '\r' || c[i] == ' ')
            ++i;

        c = c.slice(i, c.length);

        return `

            var module = this;
            
            var build_state = true;
            var run_state = false;
        
            if(build_state) return ${c}
        
        `;
    }

    parse_run_state_src_content(module){

        let c = module.src_content;

        let i = 0;
        while(c[i] == '\n' || c[i] == '\r' || c[i] == ' ')
            ++i;

        c = c.slice(i, c.length);



        let n0d3s_cached_dependency_results_js = ``;
        for(let variable_name in module.variable_to_dependencies){

            let dependencies = module.variable_to_dependencies[variable_name];

            if(!dependencies.is_multiple){

                n0d3s_cached_dependency_results_js += `
                    var ${variable_name} = window.n0d3s_cached_dependency_results["${dependencies[0].id}"];
                `;

            }
            else{

                n0d3s_cached_dependency_results_js += `
                    var ${variable_name} = [];
                `;

                for(let i = 0; i < dependencies.length; ++i){

                    n0d3s_cached_dependency_results_js += `
                        ${variable_name}.push(window.n0d3s_cached_dependency_results["${dependencies[i].id}"]);
                    `;

                }

            }

        }



        let n0d3s_text_objects = ``;
        for(let text_name in module.text_objects){

            n0d3s_text_objects += `var ${text_name} = ${'decodeURIComponent(`' + encodeURIComponent(module.text_objects[text_name]) + '`)'};`;

        }



        let n0d3s_json_objects = ``;
        for(let json_name in module.json_objects){

            n0d3s_json_objects += `var ${json_name} = ${
                'JSON.parse(decodeURIComponent('
                + '`' 
                + encodeURIComponent(JSON.stringify(module.json_objects[json_name]))
                + '`'
                + '))'
            };`;

        }



        let n0d3s_data_objects = ``;
        for(let data_name in module.data_objects){

            n0d3s_data_objects += `var ${data_name} = ${
                'JSON.parse(decodeURIComponent('
                + '`' 
                + encodeURIComponent(JSON.stringify(module.data_objects[data_name]))
                + '`'
                + '))'
            };`;

        }



        return `

            var module = {

                use_all() { return module; },
                use(obj) { return module; },
                register_page() { return module; },
                use_open_mode() { return module; },
                text(obj) { return module; },
                json(obj) { return module; },

                exe(callback) { return module; },
                exe_js(path, options) { return module; },

                external_js(arr) { return module; },
                external_js_module(arr) { return module; },

                create_virtual_module(file_content, options) { return module; },

                path_query(path_query, options) { return []; },

                add_data(name, value) { return module; },
                remove_data(name) { return module; },
                is_has_data(name) { return false; },

                relative_script_build_path() { return ""; },
                relative_page_build_path() { return ""; },

                script_build_path() { return ""; },
                page_build_path() { return ""; },

                use_and_get(path_query, options = new Object()) { return module; },

                auto_return(obj) { return module; },

                encode_js_str(value) { return ""; },
                decode_js_str(value) { return ""; },

            };
            
            var build_state = false;
            var run_state = true;

            if(window.n0d3s_cached_dependency_results == null)
                window.n0d3s_cached_dependency_results = new Object();

            
            
            ${(module.open_mode) ? "" : `window.n0d3s_cached_dependency_results["${module.id}"] = (()=>{`}            
            
                ${n0d3s_cached_dependency_results_js}

                ${n0d3s_text_objects}
                ${n0d3s_json_objects}
                ${n0d3s_data_objects}
                
                ${module.is_auto_return ? `module; return decodeURIComponent("${encodeURIComponent(JSON.stringify(module.auto_return_object))}")` : c}

            ${(module.open_mode) ? "" : `})();`}
        
        `;
    }

}



module.exports = SrcParser;