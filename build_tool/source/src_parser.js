
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
        while(c[i] == '\n' || c[i] == '\r')
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
        while(c[i] == '\n' || c[i] == '\r')
            ++i;

        c = c.slice(i, c.length);



        let n0d3s_cached_dependency_results_js = ``;

        for(let variable_name in module.variable_to_dependencies){

            let dependencies = module.variable_to_dependencies[variable_name];

            if(dependencies.length == 1){

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



        return `

            var module = {

                use() { return module; },
                register_page() { return module; },
                use_open_mode() { return module; }

            };
            
            var build_state = false;
            var run_state = true;

            if(window.n0d3s_cached_dependency_results == null)
                window.n0d3s_cached_dependency_results = new Object();

            
            
            ${(module.open_mode) ? "" : `window.n0d3s_cached_dependency_results["${module.id}"] = (()=>{`}            
            
                ${n0d3s_cached_dependency_results_js}
            
                ${c}

            ${(module.open_mode) ? "" : `})();`}
        
        `;
    }

}



module.exports = SrcParser;