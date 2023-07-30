
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



        let dependency_data_getter_content = `
        

        
        `;

        for(let key in module.dependency_data){

            let dependency_module = module.dependency_data[key];

            dependency_data_getter_content += `
            
                if(n0d3s.cached_dependency_datas == null)
                    n0d3s.cached_dependency_datas = new Object();

                var ${key} = n0d3s.cached_dependency_datas["${dependency_module.id}"];
            
            `;

        }



        return `

            var module = this;
            
            var build_state = false;
            var run_state = true;

            ${dependency_data_getter_content}
        
            if(build_state) return ${c}
        
        `;
    }

}



module.exports = SrcParser;